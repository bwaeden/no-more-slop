import {
  endSession,
  getState,
  onStateChange,
  setStrictMode,
  setTheme,
  setToggle,
  startSession,
  type Platform,
  type StoredState,
  type ThemeMode,
} from '../shared/storage';

const startView = document.getElementById('start-view') as HTMLElement;
const activeView = document.getElementById('active-view') as HTMLElement;
const breakConfirmView = document.getElementById('break-confirm-view') as HTMLElement;
const breakView = document.getElementById('break-view') as HTMLElement;
const summaryView = document.getElementById('summary-view') as HTMLElement;

const intentForm = document.getElementById('intent-form') as HTMLFormElement;
const intentInput = document.getElementById('intent-input') as HTMLInputElement;
const intentLabel = document.getElementById('intent-label') as HTMLElement;
const intentDisplay = document.getElementById('intent-display') as HTMLElement;
const timerDisplay = document.getElementById('timer-display') as HTMLElement;
const blockCountDisplay = document.getElementById('block-count') as HTMLElement;
const strictBadge = document.getElementById('strict-badge') as HTMLElement;
const endSessionButton = document.getElementById('end-session') as HTMLButtonElement;
const justBlockButton = document.getElementById('just-block-button') as HTMLButtonElement;
const strictToggle = document.getElementById('strict-toggle') as HTMLInputElement;

const breakButton = document.getElementById('break-button') as HTMLButtonElement;
const breakConfirmText = document.getElementById('break-confirm-text') as HTMLElement;
const breakIntentRef = document.getElementById('break-intent-ref') as HTMLElement;
const breakCancelButton = document.getElementById('break-cancel') as HTMLButtonElement;
const breakTimerDisplay = document.getElementById('break-timer') as HTMLElement;
const endBreakButton = document.getElementById('end-break') as HTMLButtonElement;
const durationButtons = document.querySelectorAll<HTMLButtonElement>('button.duration');

const summaryIntentLabel = document.getElementById('summary-intent-label') as HTMLElement;
const summaryIntentText = document.getElementById('summary-intent-text') as HTMLElement;
const summaryDuration = document.getElementById('summary-duration') as HTMLElement;
const summaryBlocks = document.getElementById('summary-blocks') as HTMLElement;
const strictConfirmBox = document.getElementById('strict-confirm-box') as HTMLElement;
const strictInput = document.getElementById('strict-input') as HTMLInputElement;
const confirmEndButton = document.getElementById('confirm-end') as HTMLButtonElement;
const keepGoingButton = document.getElementById('keep-going') as HTMLButtonElement;

const themeToggle = document.getElementById('theme-toggle') as HTMLButtonElement;

const toggleInputs = document.querySelectorAll<HTMLInputElement>(
  '.platforms .switch input[data-platform]',
);

const INTENT_PLACEHOLDERS = [
  'finish chem lab report',
  'write the essay',
  'study for finals',
  'ship the pull request',
  'grind leetcode',
  'read chapter 4',
  'prep tomorrow\u2019s slides',
  'clean my inbox',
  'finish the side project',
  'outline the blog post',
  'work on the thesis',
  'fix that bug',
  'plan my week',
  'do the reading',
  'call mom back',
];

intentInput.placeholder =
  INTENT_PLACEHOLDERS[Math.floor(Math.random() * INTENT_PLACEHOLDERS.length)];

type View = 'start' | 'active' | 'break-confirm' | 'break' | 'summary';

let pendingView: View | null = null;

function applyTheme(mode: ThemeMode): void {
  document.documentElement.setAttribute('data-theme', mode);
  try {
    localStorage.setItem('nms-theme', mode);
  } catch {
    // Ignore if storage unavailable.
  }
}

function formatElapsed(startedAt: number): string {
  const ms = Math.max(0, Date.now() - startedAt);
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatDuration(startedAt: number | null): string {
  if (!startedAt) return '0m';
  const ms = Date.now() - startedAt;
  const total = Math.floor(ms / 60_000);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  const seconds = Math.floor(ms / 1000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

function formatCountdown(endsAt: number): string {
  const ms = Math.max(0, endsAt - Date.now());
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function showView(view: View): void {
  startView.hidden = view !== 'start';
  activeView.hidden = view !== 'active';
  breakConfirmView.hidden = view !== 'break-confirm';
  breakView.hidden = view !== 'break';
  summaryView.hidden = view !== 'summary';
}

function renderSummary(state: StoredState): void {
  const { session, strictMode } = state;
  if (session.intent) {
    summaryIntentLabel.textContent = "You said you'd";
    summaryIntentText.textContent = session.intent;
  } else {
    summaryIntentLabel.textContent = 'Focus mode';
    summaryIntentText.textContent = 'Blocked slop';
  }
  summaryDuration.textContent = formatDuration(session.startedAt);
  summaryBlocks.textContent = String(session.blockCount ?? 0);

  if (strictMode) {
    strictConfirmBox.hidden = false;
    strictInput.value = '';
    confirmEndButton.disabled = true;
  } else {
    strictConfirmBox.hidden = true;
    confirmEndButton.disabled = false;
  }
}

function render(state: StoredState): void {
  applyTheme(state.theme);

  const { session, breakState, toggles, strictMode } = state;
  const onBreak =
    breakState.active && breakState.endsAt !== null && Date.now() < breakState.endsAt;

  if (onBreak) {
    showView('break');
    updateBreakTimer(breakState.endsAt!);
    return;
  }

  if (!session.active) {
    showView('start');
    intentInput.value = '';
    strictToggle.checked = strictMode;
    return;
  }

  if (pendingView === 'summary') {
    showView('summary');
    renderSummary(state);
    return;
  }

  if (pendingView === 'break-confirm') {
    showView('break-confirm');
  } else {
    showView('active');
  }

  if (session.intent) {
    intentLabel.textContent = "You said you'd";
    intentDisplay.textContent = session.intent;
    breakConfirmText.innerHTML = `You said you'd <strong></strong>.`;
    const ref = breakConfirmText.querySelector('strong');
    if (ref) ref.textContent = session.intent;
  } else {
    intentLabel.textContent = 'Focus mode';
    intentDisplay.textContent = 'Just blocking slop';
    breakConfirmText.textContent = "You're blocking slop right now.";
  }
  breakIntentRef.textContent = session.intent || 'stay focused';
  timerDisplay.textContent = session.startedAt
    ? formatElapsed(session.startedAt)
    : '';
  const count = session.blockCount ?? 0;
  blockCountDisplay.textContent = count === 1 ? '1 block' : `${count} blocks`;
  strictBadge.hidden = !strictMode;

  for (const input of toggleInputs) {
    const platform = input.dataset.platform as Platform;
    input.checked = toggles[platform];
    input.disabled = strictMode;
  }
}

let breakTimerInterval: number | undefined;
function updateBreakTimer(endsAt: number): void {
  breakTimerDisplay.textContent = formatCountdown(endsAt);
  if (breakTimerInterval) clearInterval(breakTimerInterval);
  breakTimerInterval = window.setInterval(() => {
    if (Date.now() >= endsAt) {
      clearInterval(breakTimerInterval);
      getState().then(render);
      return;
    }
    breakTimerDisplay.textContent = formatCountdown(endsAt);
  }, 1000);
}

let sessionTimerInterval: number | undefined;
function startSessionTimerRefresh(startedAt: number | null): void {
  if (sessionTimerInterval) clearInterval(sessionTimerInterval);
  if (!startedAt) return;
  sessionTimerInterval = window.setInterval(() => {
    timerDisplay.textContent = formatElapsed(startedAt);
  }, 1000);
}

intentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const intent = intentInput.value.trim();
  if (!intent) return;
  await startSession(intent);
});

justBlockButton.addEventListener('click', async () => {
  await startSession('');
});

strictToggle.addEventListener('change', async () => {
  await setStrictMode(strictToggle.checked);
});

endSessionButton.addEventListener('click', () => {
  pendingView = 'summary';
  getState().then(render);
});

toggleInputs.forEach((input) => {
  input.addEventListener('change', async () => {
    if (input.disabled) return;
    const platform = input.dataset.platform as Platform;
    await setToggle(platform, input.checked);
  });
});

breakButton.addEventListener('click', () => {
  pendingView = 'break-confirm';
  showView('break-confirm');
});

breakCancelButton.addEventListener('click', () => {
  pendingView = null;
  showView('active');
});

durationButtons.forEach((btn) => {
  btn.addEventListener('click', async () => {
    const minutes = Number(btn.dataset.min);
    if (!Number.isFinite(minutes) || minutes <= 0) return;
    pendingView = null;
    await chrome.runtime.sendMessage({
      type: 'start-break',
      durationMinutes: minutes,
    });
  });
});

endBreakButton.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'end-break' });
});

strictInput.addEventListener('input', () => {
  confirmEndButton.disabled = strictInput.value.trim().toLowerCase() !== 'end';
});

confirmEndButton.addEventListener('click', async () => {
  if (confirmEndButton.disabled) return;
  pendingView = null;
  await endSession();
});

keepGoingButton.addEventListener('click', () => {
  pendingView = null;
  showView('active');
});

themeToggle.addEventListener('click', async () => {
  const { theme } = await getState();
  await setTheme(theme === 'dark' ? 'light' : 'dark');
});

getState().then((state) => {
  render(state);
  startSessionTimerRefresh(state.session.startedAt);
});

onStateChange((state) => {
  render(state);
  startSessionTimerRefresh(state.session.startedAt);
});
