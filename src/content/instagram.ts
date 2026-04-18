import { getState, recordBlock, shouldBlock } from '../shared/storage';
import {
  buildBlockMessage,
  flushPendingToast,
  queueToastForNextPage,
} from '../shared/toast';

const STYLE_ID = 'nms-instagram-hide';
const HIDE_CSS = `
  a[href="/reels/"],
  a[href^="/reels/"],
  a[href*="/reel/"],
  [aria-label="Reels"] {
    display: none !important;
  }
`;

function isReelsPath(pathname: string): boolean {
  return pathname.startsWith('/reels') || pathname.includes('/reel/');
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
  if (!isReelsPath(location.pathname)) return false;
  if (redirecting) return true;
  redirecting = true;

  await recordBlock();
  const { session } = await getState();
  queueToastForNextPage(buildBlockMessage('Instagram Reels', session.intent));

  const blank = document.createElement('style');
  blank.textContent =
    'html, body { background: #f6f3ec !important; visibility: hidden !important; }';
  (document.head || document.documentElement).appendChild(blank);

  location.replace('https://www.instagram.com/');
  return true;
}

async function update(): Promise<void> {
  if (await shouldBlock('instagram')) {
    applyHide();
    if (isReelsPath(location.pathname)) {
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
