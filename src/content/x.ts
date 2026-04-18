import { getState, recordBlock, shouldBlock } from '../shared/storage';
import {
  buildBlockMessage,
  flushPendingToast,
  queueToastForNextPage,
} from '../shared/toast';

const STYLE_ID = 'nms-x-hide';
const HIDE_CSS = `
  [data-testid="primaryColumn"] [aria-label="Timeline: Your Home Timeline"],
  [data-testid="primaryColumn"] [aria-label="Timeline: For you"],
  [data-testid="primaryColumn"] [aria-label="Timeline: Following"],
  [aria-label="Home timeline"],
  div[aria-label^="Timeline: "][aria-live] {
    display: none !important;
  }
`;
const SAFE_DESTINATION = 'https://x.com/messages';

function isAllowedPath(pathname: string): boolean {
  if (pathname === '/') return true;
  if (pathname.startsWith('/messages')) return true;
  if (pathname.startsWith('/settings')) return true;
  if (pathname.startsWith('/compose')) return true;
  if (pathname.startsWith('/search')) return true;
  if (pathname.startsWith('/i/flow/')) return true;
  if (pathname.startsWith('/account')) return true;
  if (pathname.startsWith('/login')) return true;
  if (pathname.startsWith('/logout')) return true;
  if (pathname.startsWith('/signup')) return true;
  if (pathname.startsWith('/i/password_reset')) return true;
  if (pathname.startsWith('/i/verified')) return true;
  if (/^\/[^/]+\/status\//i.test(pathname)) return true;
  return false;
}

function isBlockedPath(pathname: string): boolean {
  return !isAllowedPath(pathname);
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
  queueToastForNextPage(buildBlockMessage('X feed', session.intent));

  const blank = document.createElement('style');
  blank.textContent =
    'html, body { background: #f6f3ec !important; visibility: hidden !important; }';
  (document.head || document.documentElement).appendChild(blank);

  location.replace(SAFE_DESTINATION);
  return true;
}

async function update(): Promise<void> {
  if (await shouldBlock('x')) {
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
      redirecting = false;
      void update();
    }
  }, 400);
}

void init();
