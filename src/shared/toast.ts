import { injectToast } from './inject-toast';
import { pickBlockMessage } from './messages';

const PENDING_KEY = 'nms:pending-toast';

export function showToast(message: string): void {
  injectToast(message);
}

export function queueToastForNextPage(message: string): void {
  try {
    sessionStorage.setItem(PENDING_KEY, message);
  } catch {
    // sessionStorage disabled — fail silently.
  }
}

export function flushPendingToast(): void {
  try {
    const pending = sessionStorage.getItem(PENDING_KEY);
    if (!pending) return;
    sessionStorage.removeItem(PENDING_KEY);
    const show = () => showToast(pending);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', show, { once: true });
    } else {
      show();
    }
  } catch {
    // Ignore storage errors.
  }
}

export function buildBlockMessage(platformLabel: string, intent: string): string {
  return pickBlockMessage(platformLabel, intent);
}
