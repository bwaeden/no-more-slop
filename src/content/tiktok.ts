import { shouldBlock } from '../shared/storage';

const GOOGLE_HOME = 'https://www.google.com/';

let redirecting = false;

function blankPage(): void {
  const style = document.createElement('style');
  style.id = 'nms-tiktok-blank';
  style.textContent = `
    html, body { background: #f6f3ec !important; }
    body { visibility: hidden !important; }
  `;
  (document.head || document.documentElement).appendChild(style);
}

async function update(): Promise<void> {
  if (redirecting) return;
  if (!(await shouldBlock('tiktok'))) return;
  redirecting = true;
  blankPage();
  location.replace(GOOGLE_HOME);
}

async function init(): Promise<void> {
  await update();

  chrome.storage.onChanged.addListener((_changes, area) => {
    if (area !== 'local') return;
    void update();
  });
}

void init();
