import { describe, expect, it } from 'vitest';
import {
  notifyThemeChange,
  recordUserPreference,
  subscribeDarkMode,
  unsubscribeDarkMode,
} from '../../src/index.js';

describe('dark-mode axis semantics (v0.3)', () => {
  it('subscribe → theme-change → user-preferred → unsubscribe full path', () => {
    const s = subscribeDarkMode({
      target: 'macos',
      observerId: 'obs-1',
      initialTheme: 'light',
    });
    notifyThemeChange(s, 'dark');
    recordUserPreference(s, 'dark');
    unsubscribeDarkMode(s);
    expect(s.state).toBe('unsubscribed');
    expect(s.currentTheme).toBe('dark');
    expect(s.userPreference).toBe('dark');
    expect(s.changeCount).toBe(1);
  });

  it('rejects same-theme change', () => {
    const s = subscribeDarkMode({ target: 'windows', observerId: 'o', initialTheme: 'light' });
    expect(() => notifyThemeChange(s, 'light')).toThrow(/unchanged/);
  });

  it('rejects operations after unsubscribe', () => {
    const s = subscribeDarkMode({ target: 'linux', observerId: 'o', initialTheme: 'light' });
    unsubscribeDarkMode(s);
    expect(() => notifyThemeChange(s, 'dark')).toThrow(/not subscribed/);
    expect(() => recordUserPreference(s, 'dark')).toThrow(/not subscribed/);
    expect(() => unsubscribeDarkMode(s)).toThrow(/already unsubscribed/);
  });

  it('rejects empty inputs', () => {
    expect(() =>
      subscribeDarkMode({ target: 'macos', observerId: '', initialTheme: 'light' }),
    ).toThrow(/observerId/);
  });

  it('provider dialect maps per target', () => {
    const mac = subscribeDarkMode({ target: 'macos', observerId: 'o', initialTheme: 'light' });
    const win = subscribeDarkMode({ target: 'windows', observerId: 'o', initialTheme: 'light' });
    const lin = subscribeDarkMode({ target: 'linux', observerId: 'o', initialTheme: 'light' });
    expect(mac.history[0]?.providerEvent).toContain('macos.NSDistributedNotificationCenter');
    expect(win.history[0]?.providerEvent).toContain('windows.WM_SETTINGCHANGE');
    expect(lin.history[0]?.providerEvent).toContain('linux.xdgPortal.Settings');
  });

  it('multiple theme changes accumulate', () => {
    const s = subscribeDarkMode({ target: 'macos', observerId: 'o', initialTheme: 'light' });
    notifyThemeChange(s, 'dark');
    notifyThemeChange(s, 'light');
    notifyThemeChange(s, 'dark');
    expect(s.changeCount).toBe(3);
    expect(s.currentTheme).toBe('dark');
  });

  it('all 3 theme modes accepted', () => {
    for (const theme of ['light', 'dark', 'no-preference'] as const) {
      const s = subscribeDarkMode({ target: 'macos', observerId: `o-${theme}`, initialTheme: theme });
      expect(s.currentTheme).toBe(theme);
    }
  });
});
