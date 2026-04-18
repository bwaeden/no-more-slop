const SHORTS_ID_RE = /youtube\.com\/shorts\/([A-Za-z0-9_-]{4,})/i;

const HIDE_HREF_PATTERNS: RegExp[] = [
  /tiktok\.com\/@[^/]+\/video\//i,
  /tiktok\.com\/video\//i,
  /tiktok\.com\/v\//i,
  /instagram\.com\/reel[s]?\//i,
  /[?&]udm=39(?:&|$)/i,
];

const RESULT_SELECTORS = 'div.g, .MjjYud, .hlcw0c, .kvH3mc';
const CAROUSEL_SELECTORS = [
  '[aria-label="Short videos"]',
  '[aria-label="Shorts"]',
];

function shouldHide(href: string): boolean {
  return HIDE_HREF_PATTERNS.some((re) => re.test(href));
}

function rewriteShortsToWatch(root: Element): void {
  root
    .querySelectorAll<HTMLAnchorElement>('a[href*="youtube.com/shorts/"]')
    .forEach((anchor) => {
      if (anchor.dataset.nmsRewritten) return;
      const match = anchor.href.match(SHORTS_ID_RE);
      if (!match) return;
      const videoId = match[1];
      anchor.href = `https://www.youtube.com/watch?v=${videoId}`;
      anchor.dataset.nmsRewritten = '1';
    });
}

function getPrimaryHref(result: Element): string | null {
  const heading = result.querySelector('h3');
  if (heading) {
    const anchor = heading.closest('a') as HTMLAnchorElement | null;
    if (anchor?.href) return anchor.href;
  }
  const firstAnchor = result.querySelector('a[href]') as HTMLAnchorElement | null;
  return firstAnchor?.href ?? null;
}

function hideUdm39Links(): void {
  document
    .querySelectorAll<HTMLAnchorElement>('a[href*="udm=39"]')
    .forEach((anchor) => {
      if (anchor.dataset.nmsHidden) return;
      anchor.dataset.nmsHidden = '1';
      let target: HTMLElement = anchor;
      let cursor: HTMLElement | null = anchor.parentElement;
      for (let i = 0; cursor && i < 3; i++) {
        if (cursor.children.length === 1) {
          target = cursor;
          cursor = cursor.parentElement;
        } else {
          break;
        }
      }
      target.style.display = 'none';
    });
}

const SHORT_HEADING_TEXTS = new Set([
  'short videos',
  'shorts',
  'more short videos',
  'more shorts',
]);

function hideShortsSections(): void {
  document
    .querySelectorAll<HTMLElement>('h2, h3, [role="heading"], span[role="heading"]')
    .forEach((heading) => {
      if (heading.dataset.nmsHidden) return;
      const text = heading.textContent?.trim().toLowerCase() ?? '';
      if (!SHORT_HEADING_TEXTS.has(text)) return;

      const section = heading.closest(
        '[data-hveid], .ULSxyf, g-section-with-header, [role="region"], [jscontroller]',
      ) as HTMLElement | null;
      const target = section ?? heading;
      target.style.display = 'none';
      heading.dataset.nmsHidden = '1';
    });
}

function processResults(): void {
  rewriteShortsToWatch(document.body || document.documentElement);

  document.querySelectorAll<HTMLElement>(RESULT_SELECTORS).forEach((result) => {
    if (result.dataset.nmsHidden) return;
    const href = getPrimaryHref(result);
    if (!href) return;
    if (shouldHide(href)) {
      result.style.display = 'none';
      result.dataset.nmsHidden = '1';
    }
  });

  for (const selector of CAROUSEL_SELECTORS) {
    document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      if (el.dataset.nmsHidden) return;
      el.style.display = 'none';
      el.dataset.nmsHidden = '1';
    });
  }

  hideUdm39Links();
  hideShortsSections();
}

let rafScheduled = false;
function schedule(): void {
  if (rafScheduled) return;
  rafScheduled = true;
  requestAnimationFrame(() => {
    rafScheduled = false;
    processResults();
  });
}

function init(): void {
  processResults();
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
