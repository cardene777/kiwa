import { providerEventName, type AxisStep, type DesktopTarget } from './types.js';

/**
 * Dark-mode axis (v0.3) — subscribe + theme-change + user-preferred + unsubscribe の 4 step 遷移。
 * macOS AppleInterfaceTheme + Windows ImmersiveColorSet + Linux xdg-portal Settings color-scheme を uniform 扱い。
 */
export type DarkModeState =
  | 'idle'
  | 'subscribed'
  | 'theme-changed'
  | 'user-preferred'
  | 'unsubscribed';

export type ThemeMode = 'light' | 'dark' | 'no-preference';

export interface DarkModeSession {
  target: DesktopTarget;
  observerId: string;
  state: DarkModeState;
  currentTheme: ThemeMode;
  userPreference: ThemeMode;
  changeCount: number;
  history: AxisStep<DarkModeState>[];
}

function emit(
  session: DarkModeSession,
  neutralEvent:
    | 'dark-mode.subscribed'
    | 'dark-mode.theme_changed'
    | 'dark-mode.user_preferred'
    | 'dark-mode.unsubscribed',
  metadata: Record<string, string | number | boolean>,
): AxisStep<DarkModeState> {
  const step: AxisStep<DarkModeState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    metadata: { observerId: session.observerId, ...metadata },
  };
  session.history.push(step);
  return step;
}

export function subscribeDarkMode(input: {
  target: DesktopTarget;
  observerId: string;
  initialTheme: ThemeMode;
}): DarkModeSession {
  if (input.observerId.length === 0) throw new Error('subscribeDarkMode: observerId must not be empty');
  const session: DarkModeSession = {
    target: input.target,
    observerId: input.observerId,
    state: 'subscribed',
    currentTheme: input.initialTheme,
    userPreference: input.initialTheme,
    changeCount: 0,
    history: [],
  };
  emit(session, 'dark-mode.subscribed', { initialTheme: input.initialTheme });
  return session;
}

export function notifyThemeChange(
  session: DarkModeSession,
  newTheme: ThemeMode,
): AxisStep<DarkModeState> {
  if (session.state === 'idle' || session.state === 'unsubscribed') {
    throw new Error('notifyThemeChange: not subscribed');
  }
  if (newTheme === session.currentTheme) {
    throw new Error(`notifyThemeChange: theme unchanged (${newTheme})`);
  }
  session.currentTheme = newTheme;
  session.changeCount += 1;
  session.state = 'theme-changed';
  return emit(session, 'dark-mode.theme_changed', {
    newTheme,
    changeCount: session.changeCount,
  });
}

export function recordUserPreference(
  session: DarkModeSession,
  preference: ThemeMode,
): AxisStep<DarkModeState> {
  if (session.state === 'idle' || session.state === 'unsubscribed') {
    throw new Error('recordUserPreference: not subscribed');
  }
  session.userPreference = preference;
  session.state = 'user-preferred';
  return emit(session, 'dark-mode.user_preferred', {
    preference,
    currentTheme: session.currentTheme,
  });
}

export function unsubscribeDarkMode(session: DarkModeSession): AxisStep<DarkModeState> {
  if (session.state === 'unsubscribed') throw new Error('unsubscribeDarkMode: already unsubscribed');
  session.state = 'unsubscribed';
  return emit(session, 'dark-mode.unsubscribed', {
    changeCount: session.changeCount,
    finalTheme: session.currentTheme,
    finalPreference: session.userPreference,
  });
}
