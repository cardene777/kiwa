import { describe, expect, it } from 'vitest';
import {
  clickTrayIcon,
  createTrayIcon,
  removeTrayIcon,
  updateTrayTooltip,
} from '../../src/index.js';

describe('tray-icon axis semantics (v0.2)', () => {
  it('create → tooltip → click → remove full path', () => {
    const s = createTrayIcon({
      target: 'macos',
      trayId: 'tray-1',
      iconPath: '/app/icon.png',
    });
    updateTrayTooltip(s, 'Sync in progress');
    clickTrayIcon(s);
    clickTrayIcon(s);
    removeTrayIcon(s);
    expect(s.state).toBe('removed');
    expect(s.tooltip).toBe('Sync in progress');
    expect(s.clickCount).toBe(2);
    expect(s.removed).toBe(true);
  });

  it('rejects operations after remove', () => {
    const s = createTrayIcon({
      target: 'windows',
      trayId: 't',
      iconPath: '/icon.ico',
    });
    removeTrayIcon(s);
    expect(() => updateTrayTooltip(s, 'x')).toThrow(/removed/);
    expect(() => clickTrayIcon(s)).toThrow(/removed/);
    expect(() => removeTrayIcon(s)).toThrow(/already removed/);
  });

  it('rejects empty inputs', () => {
    expect(() =>
      createTrayIcon({ target: 'macos', trayId: '', iconPath: '/x' }),
    ).toThrow(/trayId/);
    expect(() =>
      createTrayIcon({ target: 'macos', trayId: 't', iconPath: '' }),
    ).toThrow(/iconPath/);
    const s = createTrayIcon({ target: 'macos', trayId: 't', iconPath: '/x' });
    expect(() => updateTrayTooltip(s, '')).toThrow(/tooltip/);
  });

  it('provider dialect maps per target', () => {
    const mac = createTrayIcon({ target: 'macos', trayId: 't', iconPath: '/i' });
    const win = createTrayIcon({ target: 'windows', trayId: 't', iconPath: '/i' });
    const lin = createTrayIcon({ target: 'linux', trayId: 't', iconPath: '/i' });
    expect(mac.history[0]?.providerEvent).toContain('macos.NSStatusItem');
    expect(win.history[0]?.providerEvent).toContain('windows.notifyIcon');
    expect(lin.history[0]?.providerEvent).toContain('linux.statusNotifierItem');
  });

  it('tooltip updates accumulate history', () => {
    const s = createTrayIcon({ target: 'linux', trayId: 't', iconPath: '/i' });
    updateTrayTooltip(s, 'first');
    updateTrayTooltip(s, 'second');
    updateTrayTooltip(s, 'third');
    expect(s.tooltip).toBe('third');
    expect(s.history.filter((h) => h.neutralEvent === 'tray-icon.tooltip_updated').length).toBe(3);
  });
});
