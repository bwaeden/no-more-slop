import { shouldBlock } from '../shared/storage';
import { flushPendingToast } from '../shared/toast';

const HIDE_STYLE_ID = 'nms-hide-style';
const BLANK_STYLE_ID = 'nms-shorts-blank';

const HIDE_CSS = `
  ytd-rich-shelf-renderer[is-shorts],
  ytd-reel-shelf-renderer,
  ytm-reel-shelf-renderer,
  grid-shelf-view-model,
  ytm-shorts-lockup-view-model,
  ytm-shorts-lockup-view-model-v2,
  ytd-reel-video-renderer,
  ytd-reel-item-renderer,
  ytd-rich-shelf-renderer[is-playables],
  ytd-rich-shelf-renderer:has([href^="/playables/"]),
  ytd-rich-section-renderer:has([href^="/playables/"]),
  yt-tab-shape:has(a[href$="/shorts"]),
  yt-tab-shape:has(a[href*="/shorts?"]),
  yt-tab-shape[tab-title="Shorts" i],
  tp-yt-paper-tab:has(a[href$="/shorts"]),
  tp-yt-paper-tab[aria-label*="Shorts" i],
  .yt-tab-group-shape [role="tab"]:has(a[href$="/shorts"]),
  ytd-c4-tabbed-header-renderer yt-tab-shape:has(a[href$="/shorts"]),
  a.yt-simple-endpoint.yt-tab-shape[href$="/shorts"],
  ytd-guide-entry-renderer:has(a[title="Shorts"]),
  ytd-guide-entry-renderer:has(a[href="/shorts"]),
  ytd-guide-entry-renderer:has(a[title="Playables"]),
  ytd-guide-entry-renderer:has(a[href="/playables"]),
  ytd-guide-entry-renderer:has(a[href^="/playables"]),
  ytd-mini-guide-entry-renderer:has(a[href="/shorts"]),
  ytd-mini-guide-entry-renderer:has(a[href="/playables"]),
  ytm-pivot-bar-item-renderer:has(a[href="/shorts"]),
  ytm-pivot-bar-item-renderer:has(a[href="/playables"]),
  ytd-rich-item-renderer:has(ytm-shorts-lockup-view-model),
  ytd-rich-item-renderer:has(ytm-shorts-lockup-view-model-v2),
  ytd-rich-item-renderer:has(ytd-reel-item-renderer),
  ytd-rich-item-renderer:has(a[href^="/playables/"]),
  ytd-video-renderer:has(a#thumbnail[href^="/shorts/"]),
  ytd-video-renderer:has(a#thumbnail[href^="/playables/"]),
  ytd-grid-video-renderer:has(a#thumbnail[href^="/shorts/"]),
  ytd-compact-video-renderer:has(a#thumbnail[href^="/shorts/"]),
  .nms-hide-shelf {
    display: none !important;
  }
`;

const BLANK_PAGE_CSS = `
  html, body { background: #f6f3ec !important; }
  body { visibility: hidden !important; }
  ytd-app, #content, #page-manager, video, audio { display: none !important; }
`;

const MAIN_WORLD_SILENCER = `
  (() => {
    if (window.__nmsSilencerInstalled) return;
    window.__nmsSilencerInstalled = true;
    const silence = (media) => {
      try {
        media.muted = true;
        media.volume = 0;
        media.pause();
        if (media.autoplay) media.autoplay = false;
      } catch (e) {}
    };
    const origPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      silence(this);
      return Promise.resolve();
    };
    Object.defineProperty(HTMLMediaElement.prototype, 'volume', {
      get() { return 0; },
      set() {},
    });
    const sweep = () => {
      document.querySelectorAll('video, audio').forEach(silence);
    };
    sweep();
    setInterval(sweep, 80);
    new MutationObserver(sweep).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    void origPlay;
  })();
`;

function injectStyle(id: string, css: string): void {
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);
}

function removeStyle(id: string): void {
  document.getElementById(id)?.remove();
}

function injectMainWorldScript(code: string): void {
  const script = document.createElement('script');
  script.textContent = code;
  (document.head || document.documentElement).appendChild(script);
  script.remove();
}

function silenceAllMedia(): void {
  document.querySelectorAll<HTMLMediaElement>('video, audio').forEach((media) => {
    try {
      media.muted = true;
      media.volume = 0;
      media.pause();
    } catch {
      // Ignore
    }
  });
}

function markShelvesByTitle(): void {
  const shelves = document.querySelectorAll(
    'ytd-shelf-renderer, ytd-rich-shelf-renderer',
  );
  for (const shelf of shelves) {
    if (shelf.classList.contains('nms-hide-shelf')) continue;
    const titleEl = shelf.querySelector('#title, h2 span, h2');
    const title = titleEl?.textContent?.trim().toLowerCase() ?? '';
    if (
      title === 'shorts' ||
      title.startsWith('shorts ') ||
      title === 'playables' ||
      title.startsWith('playables ')
    ) {
      shelf.classList.add('nms-hide-shelf');
    }
  }
}

function unmarkShelves(): void {
  document
    .querySelectorAll('.nms-hide-shelf')
    .forEach((el) => el.classList.remove('nms-hide-shelf'));
}

let observer: MutationObserver | null = null;
let rafScheduled = false;

function scheduleMark(): void {
  if (rafScheduled) return;
  rafScheduled = true;
  requestAnimationFrame(() => {
    rafScheduled = false;
    markShelvesByTitle();
  });
}

async function update(): Promise<void> {
  const blocked = await shouldBlock('youtube');
  const pathname = location.pathname;
  const onShortsPath = /(?:^|\/)shorts(\/|$)/.test(pathname);
  const onPlayablesPath = /(?:^|\/)playables(\/|$)/.test(pathname);
  const onBlockedPath = onShortsPath || onPlayablesPath;

  if (blocked) {
    if (onBlockedPath) {
      injectStyle(BLANK_STYLE_ID, BLANK_PAGE_CSS);
      injectMainWorldScript(MAIN_WORLD_SILENCER);
      silenceAllMedia();
      chrome.runtime.sendMessage({
        type: 'redirect-away-from',
        kind: onShortsPath ? 'shorts' : 'playables',
      });
      return;
    }
    injectStyle(HIDE_STYLE_ID, HIDE_CSS);
    markShelvesByTitle();
    if (!observer) {
      observer = new MutationObserver(scheduleMark);
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    }
  } else {
    removeStyle(HIDE_STYLE_ID);
    removeStyle(BLANK_STYLE_ID);
    unmarkShelves();
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }
}

async function init(): Promise<void> {
  await update();
  flushPendingToast();

  chrome.storage.onChanged.addListener((_changes, area) => {
    if (area !== 'local') return;
    void update();
  });

  window.addEventListener('yt-navigate-finish', () => {
    scheduleMark();
    void update();
  });
  window.addEventListener('popstate', () => void update());
}

void init();
