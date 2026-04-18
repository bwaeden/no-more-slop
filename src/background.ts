import { injectToast } from './shared/inject-toast';
import { pickBlockMessage } from './shared/messages';
import {
  getState,
  recordBlock,
  setState,
  shouldBlock,
  type Platform,
} from './shared/storage';

const YOUTUBE_HOME = 'https://www.youtube.com/';
const GOOGLE_HOME = 'https://www.google.com/';
const X_SAFE = 'https://x.com/messages';

const PLATFORM_LABEL: Record<Platform, string> = {
  youtube: 'YouTube Shorts',
  instagram: 'Instagram Reels',
  tiktok: 'TikTok',
  snapchat: 'Snapchat',
  x: 'X feed',
  reddit: 'Reddit feed',
};

const FRESH_TAB_PREFIXES = [
  'chrome://newtab',
  'chrome://new-tab-page',
  'brave://newtab',
  'edge://newtab',
  'about:blank',
  'about:newtab',
];

const BREAK_ALARM = 'nms-break-end';

function isFreshTabUrl(url: string | undefined): boolean {
  if (!url || url === '') return true;
  return FRESH_TAB_PREFIXES.some((prefix) => url.startsWith(prefix));
}

async function buildBlockedMessage(label: string): Promise<string> {
  const { session } = await getState();
  const intent = session.active ? session.intent : '';
  return pickBlockMessage(label, intent);
}

function scheduleToast(tabId: number, message: string): void {
  let settled = false;
  let timeoutId: ReturnType<typeof setTimeout>;

  const cleanup = () => {
    if (settled) return;
    settled = true;
    chrome.tabs.onUpdated.removeListener(listener);
    clearTimeout(timeoutId);
  };

  const listener = (
    changedTabId: number,
    info: chrome.tabs.TabChangeInfo,
  ) => {
    if (changedTabId !== tabId) return;
    if (info.status !== 'complete') return;
    cleanup();
    chrome.scripting
      .executeScript({
        target: { tabId },
        func: injectToast,
        args: [message],
      })
      .catch(() => {
        // Restricted page — ignore.
      });
  };

  timeoutId = setTimeout(cleanup, 12_000);
  chrome.tabs.onUpdated.addListener(listener);
}

async function redirectWithToast(
  tabId: number,
  url: string,
  label: string,
): Promise<void> {
  await recordBlock();
  const message = await buildBlockedMessage(label);
  scheduleToast(tabId, message);
  try {
    await chrome.tabs.update(tabId, { url });
  } catch {
    // Tab closed.
  }
}

async function bounceBackOrHome(
  tabId: number,
  blockedHost: string,
  platform: Platform,
): Promise<void> {
  let previousUrl: string | undefined;
  try {
    const tab = await chrome.tabs.get(tabId);
    previousUrl = tab.url;
  } catch {
    previousUrl = undefined;
  }

  const label = PLATFORM_LABEL[platform];

  if (
    previousUrl &&
    !isFreshTabUrl(previousUrl) &&
    !previousUrl.includes(blockedHost)
  ) {
    await redirectWithToast(tabId, previousUrl, label);
    return;
  }

  await redirectWithToast(tabId, GOOGLE_HOME, label);
}

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;

  let url: URL;
  try {
    url = new URL(details.url);
  } catch {
    return;
  }

  if (url.hostname.endsWith('youtube.com')) {
    const isShortsPath = /(?:^|\/)shorts(\/|$)/.test(url.pathname);
    const isPlayablesPath = /(?:^|\/)playables(\/|$)/.test(url.pathname);
    if (isShortsPath || isPlayablesPath) {
      if (await shouldBlock('youtube')) {
        const label = isPlayablesPath ? 'YouTube Playables' : 'YouTube Shorts';
        let redirectTarget = YOUTUBE_HOME;
        const channelMatch = url.pathname.match(/^\/(@[^/]+)\/shorts/);
        if (channelMatch) {
          redirectTarget = `https://www.youtube.com/${channelMatch[1]}/videos`;
        }
        await redirectWithToast(details.tabId, redirectTarget, label);
      }
    }
    return;
  }

  if (url.hostname.endsWith('tiktok.com')) {
    if (await shouldBlock('tiktok')) {
      await bounceBackOrHome(details.tabId, 'tiktok.com', 'tiktok');
    }
    return;
  }

  if (url.hostname.endsWith('x.com') || url.hostname.endsWith('twitter.com')) {
    const p = url.pathname;
    const allowed =
      p === '/' ||
      p.startsWith('/messages') ||
      p.startsWith('/settings') ||
      p.startsWith('/compose') ||
      p.startsWith('/search') ||
      p.startsWith('/i/flow/') ||
      p.startsWith('/account') ||
      p.startsWith('/login') ||
      p.startsWith('/logout') ||
      p.startsWith('/signup') ||
      p.startsWith('/i/password_reset') ||
      p.startsWith('/i/verified') ||
      /^\/[^/]+\/status\//i.test(p);
    if (!allowed) {
      if (await shouldBlock('x')) {
        await redirectWithToast(details.tabId, X_SAFE, 'X feed');
      }
    }
    return;
  }

  if (url.hostname.endsWith('reddit.com')) {
    const pathname = url.pathname;
    const blocked =
      pathname === '/' ||
      pathname === '' ||
      /^\/r\/popular(\/|$)/i.test(pathname) ||
      /^\/r\/all(\/|$)/i.test(pathname);
    if (blocked) {
      if (await shouldBlock('reddit')) {
        await bounceBackOrHome(details.tabId, 'reddit.com', 'reddit');
      }
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'redirect-away-from' && sender.tab?.id !== undefined) {
    const kind = message.kind;
    const label =
      kind === 'playables' ? 'YouTube Playables' : 'YouTube Shorts';
    redirectWithToast(sender.tab.id, YOUTUBE_HOME, label).then(() =>
      sendResponse({ ok: true }),
    );
    return true;
  }

  if (message?.type === 'start-break' && typeof message.durationMinutes === 'number') {
    const durationMs = message.durationMinutes * 60 * 1000;
    const endsAt = Date.now() + durationMs;
    setState({ breakState: { active: true, endsAt, durationMs } }).then(() => {
      chrome.alarms.create(BREAK_ALARM, { when: endsAt });
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message?.type === 'end-break') {
    setState({ breakState: { active: false, endsAt: null, durationMs: 0 } }).then(() => {
      chrome.alarms.clear(BREAK_ALARM);
      sendResponse({ ok: true });
    });
    return true;
  }

  return false;
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== BREAK_ALARM) return;

  const { breakState, session } = await getState();
  if (!breakState.active) return;

  await setState({ breakState: { active: false, endsAt: null, durationMs: 0 } });

  const message = session.intent
    ? `Break over — back to ${session.intent}.`
    : 'Break over — back on task.';

  try {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (activeTab?.id !== undefined) {
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: injectToast,
        args: [message],
      });
    }
  } catch {
    // Restricted tab — ignore.
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('[No More Slop] installed');
});
