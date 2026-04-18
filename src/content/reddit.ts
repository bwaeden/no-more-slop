import { getState, recordBlock, shouldBlock } from '../shared/storage';
import {
  buildBlockMessage,
  flushPendingToast,
  queueToastForNextPage,
} from '../shared/toast';

const STYLE_ID = 'nms-reddit-hide';
const HIDE_CSS = `
  shreddit-feed[feed-type="home"],
  shreddit-feed[feed-type="popular"],
  shreddit-feed[feed-type="all"],
  faceplate-tracker[source="home_feed"] {
    display: none !important;
  }
`;
const SAFE_DESTINATION = 'https://www.google.com/';

function isBlockedPath(pathname: string): boolean {
  if (pathname === '/' || pathname === '') return true;
  if (/^\/r\/popular(\/|$)/i.test(pathname)) return true;
  if (/^\/r\/all(\/|$)/i.test(pathname)) return true;
  return false;
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
}

let redirecting = false;

async function redirectIfNeeded(): Promise<boolean> {
  if (!isBlockedPath(location.pathname)) return false;
  if (redirecting) return true;
  redirecting = true;

  await recordBlock();
  const { session } = await getState();
  queueToastForNextPage(buildBlockMessage('Reddit feed', session.intent));

  const blank = document.createElement('style');
  blank.textContent =
    'html, body { background: #f6f3ec !important; visibility: hidden !important; }';
  (document.head || document.documentElement).appendChild(blank);

  location.replace(SAFE_DESTINATION);
  return true;
}

async function update(): Promise<void> {
  if (await shouldBlock('reddit')) {
    applyHide();
    if (isBlockedPath(location.pathname)) {
      void redirectIfNeeded();
    }
  } else {
    removeHide();
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
      void update();
    }
  }, 400);
}

void init();
