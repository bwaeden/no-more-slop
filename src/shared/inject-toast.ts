export function injectToast(message: string): void {
  if (!document.documentElement) return;

  const HOST_ID = 'no-more-slop-toast-host';
  const existing = document.getElementById(HOST_ID);
  if (existing) existing.remove();

  const host = document.createElement('div');
  host.id = HOST_ID;
  host.style.cssText =
    'all:initial;position:fixed;top:0;left:0;right:0;z-index:2147483647;pointer-events:none;';

  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    :host { all: initial; }
    .wrap {
      display: flex;
      justify-content: center;
      padding-top: 22px;
      pointer-events: none;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 22px 14px 18px;
      background: #1a1a1a;
      color: #f6f3ec;
      border-radius: 999px;
      font: 500 14.5px/1.3 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      letter-spacing: -0.005em;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.28), 0 1px 0 rgba(255, 255, 255, 0.06) inset;
      transform: translateY(-140px);
      opacity: 0;
      transition: transform 0.6s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.4s ease;
      pointer-events: auto;
      max-width: min(460px, calc(100vw - 32px));
      will-change: transform, opacity;
    }
    .toast.visible { transform: translateY(0); opacity: 1; }
    .toast.leaving { transform: translateY(-140px); opacity: 0; }
    .icon { font-size: 16px; line-height: 1; flex-shrink: 0; }
    .text { display: block; }
  `;
  shadow.appendChild(style);

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  const toast = document.createElement('div');
  toast.className = 'toast';

  const icon = document.createElement('span');
  icon.className = 'icon';
  icon.textContent = '\uD83D\uDD12';

  const text = document.createElement('span');
  text.className = 'text';
  text.textContent = message;

  toast.appendChild(icon);
  toast.appendChild(text);
  wrap.appendChild(toast);
  shadow.appendChild(wrap);

  document.documentElement.appendChild(host);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('visible'));
  });

  setTimeout(() => {
    toast.classList.remove('visible');
    toast.classList.add('leaving');
    setTimeout(() => {
      if (host.parentNode) host.parentNode.removeChild(host);
    }, 650);
  }, 5500);
}
