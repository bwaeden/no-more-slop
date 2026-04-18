export type Platform = 'youtube' | 'instagram' | 'tiktok' | 'snapchat' | 'x' | 'reddit';
export type ThemeMode = 'light' | 'dark';

export interface SessionState {
  active: boolean;
  intent: string;
  startedAt: number | null;
  blockCount: number;
}

export interface Toggles {
  youtube: boolean;
  instagram: boolean;
  tiktok: boolean;
  snapchat: boolean;
  x: boolean;
  reddit: boolean;
}

export interface BreakState {
  active: boolean;
  endsAt: number | null;
  durationMs: number;
}

export interface StoredState {
  session: SessionState;
  toggles: Toggles;
  breakState: BreakState;
  theme: ThemeMode;
  strictMode: boolean;
}

const DEFAULT_STATE: StoredState = {
  session: { active: false, intent: '', startedAt: null, blockCount: 0 },
  toggles: {
    youtube: true,
    instagram: true,
    tiktok: true,
    snapchat: true,
    x: true,
    reddit: true,
  },
  breakState: { active: false, endsAt: null, durationMs: 0 },
  theme: 'light',
  strictMode: false,
};

export async function getState(): Promise<StoredState> {
  const stored = (await chrome.storage.local.get(DEFAULT_STATE)) as StoredState;
  stored.session = { ...DEFAULT_STATE.session, ...stored.session };
  stored.toggles = { ...DEFAULT_STATE.toggles, ...stored.toggles };
  stored.breakState = { ...DEFAULT_STATE.breakState, ...stored.breakState };
  return stored;
}

export async function setState(partial: Partial<StoredState>): Promise<void> {
  await chrome.storage.local.set(partial);
}

export async function startSession(intent: string): Promise<void> {
  await setState({
    session: {
      active: true,
      intent: intent.trim(),
      startedAt: Date.now(),
      blockCount: 0,
    },
    breakState: { active: false, endsAt: null, durationMs: 0 },
  });
}

export async function endSession(): Promise<void> {
  await setState({
    session: { active: false, intent: '', startedAt: null, blockCount: 0 },
    breakState: { active: false, endsAt: null, durationMs: 0 },
  });
}

export async function recordBlock(): Promise<void> {
  const { session } = await getState();
  if (!session.active) return;
  await setState({
    session: { ...session, blockCount: (session.blockCount ?? 0) + 1 },
  });
}

export async function setToggle(platform: Platform, enabled: boolean): Promise<void> {
  const { toggles } = await getState();
  await setState({ toggles: { ...toggles, [platform]: enabled } });
}

export async function setTheme(mode: ThemeMode): Promise<void> {
  await setState({ theme: mode });
}

export async function setStrictMode(enabled: boolean): Promise<void> {
  await setState({ strictMode: enabled });
}

export async function isOnBreak(): Promise<boolean> {
  const { breakState } = await getState();
  if (!breakState.active || !breakState.endsAt) return false;
  if (Date.now() >= breakState.endsAt) {
    await setState({ breakState: { active: false, endsAt: null, durationMs: 0 } });
    return false;
  }
  return true;
}

export async function shouldBlock(platform: Platform): Promise<boolean> {
  if (await isOnBreak()) return false;
  const { session, toggles } = await getState();
  return session.active && toggles[platform];
}

export function onStateChange(
  callback: (state: StoredState) => void,
): () => void {
  const listener = (
    _changes: Record<string, chrome.storage.StorageChange>,
    area: string,
  ) => {
    if (area !== 'local') return;
    getState().then(callback);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
