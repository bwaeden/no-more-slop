import { getState, recordBlock, shouldBlock } from '../shared/storage';
import {
  buildBlockMessage,
  flushPendingToast,
  queueToastForNextPage,
} from '../shared/toast';

const STYLE_ID = 'nms-snapchat-hide';
const HIDE_CSS = `
  a[href*="/spotlight"],
  a[href*="/discover"],
  [data-testid="spotlight-nav"],
  [data-testid="discover-nav"],
  [aria-label="Spotlight"],
  [aria-label="Discover"] {
    display: none !important;
  }
  .nms-nav-hidden { display: none !important; }
`;

const BLOCKED_NAV_LABELS = ['spotlight', 'stories', 'discover'];

function getBlockedPathLabel(pathname: string): string | null {
  if (pathname.includes('/spotlight/') || pathname.endsWith('/spotlight')) {
    return 'Snapchat Spotlight';
  }
  if (
    pathname === '/discover' ||
    pathname.startsWith('/discover/') ||
    pathname.startsWith('/discover?')
  ) {
    return 'Snapchat Discover';
  }
  return null;
}

function applyHide(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = HIDE_CSS;
  (document.head || document.documentElement).appendChild(style);
}

function removeHide(): void {
  document.getElementById(STYLE_ID)?.remove();
  document
    .querySelectorAll('.nms-nav-hidden')
    .forEach((el) => el.classList.remove('nms-nav-hidden'));
}

function hideLabeledNavs(): void {
  document.querySelectorAll<HTMLSpanElement>('span').forEach((span) => {
    const text = span.textContent?.trim().toLowerCase();
    if (!text || !BLOCKED_NAV_LABELS.includes(text)) return;

    // Hide the nearest sibling button (the icon) + the label wrapper together.
    const labelWrapper = span.parentElement;
    if (labelWrapper) {
      const iconSibling =
        labelWrapper.previousElementSibling ?? labelWrapper.nextElementSibling;
      if (iconSibling && iconSibling.tagName === 'BUTTON') {
        (iconSibling as HTMLElement).classList.add('nms-nav-hidden');
      }
      labelWrapper.classList.add('nms-nav-hidden');
    }

    // Walk up and hide the full nav-item container — whichever ancestor
    // contains both a button and the label.
    let cursor: HTMLElement | null = span.parentElement;
    for (let i = 0; cursor && i < 10; i++) {
      const hasButton = cursor.querySelector('button, [role="button"]');
      const hasSvg = cursor.querySelector('svg');
      if (hasButton || hasSvg) {
        cursor.classList.add('nms-nav-hidden');
        // Keep climbing one more level to catch the outer wrapper too.
        if (cursor.parentElement) {
          const parent = cursor.parentElement;
          if (parent.childElementCount <= 2) {
            parent.classList.add('nms-nav-hidden');
          }
        }
        break;
      }
      cursor = cursor.parentElement;
    }
  });
}

let redirecting = false;

async function redirectIfNeeded(): Promise<boolean> {
  const label = getBlockedPathLabel(location.pathname);
  if (!label) return false;
  if (redirecting) return true;
  redirecting = true;

  await recordBlock();
  const { session } = await getState();
  queueToastForNextPage(buildBlockMessage(label, session.intent));

  const blank = document.createElement('style');
  blank.textContent =
    'html, body { background: #f6f3ec !important; visibility: hidden !important; }';
  (document.head || document.documentElement).appendChild(blank);

  location.replace(`${location.origin}/`);
  return true;
}

let observer: MutationObserver | null = null;
let rafScheduled = false;

function scheduleScan(): void {
  if (rafScheduled) return;
  rafScheduled = true;
  requestAnimationFrame(() => {
    rafScheduled = false;
    hideLabeledNavs();
  });
}

async function update(): Promise<void> {
  if (await shouldBlock('snapchat')) {
    applyHide();
    hideLabeledNavs();
    if (!observer) {
      observer = new MutationObserver(scheduleScan);
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    }
    if (getBlockedPathLabel(location.pathname)) {
      void redirectIfNeeded();
    }
  } else {
    removeHide();
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }
}

let lastPath = location.pathname;
async function init(): Promise<void> {
  await update();
  flushPendingToast();

  chrome.storage.onChanged.addListener((_changes, area) => {
    if (area !== 'local') return;
    void update();
  });

  window.addEventListener('popstate', () => {
    void update();
  });

  setInterval(() => {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      redirecting = false;
      void update();
    }
  }, 400);
}

void init();
