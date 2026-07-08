import { describe, expect, it } from 'vitest';
import {
  applyDownloadedUpdate,
  recordUpdateDownloaded,
  scheduleRelaunch,
  startAutoUpdaterCheck,
} from '../../src/index.js';

describe('auto-updater axis semantics (v0.2)', () => {
  it('check → download → apply → relaunch full path', () => {
    const s = startAutoUpdaterCheck({ target: 'macos', channel: 'stable' });
    recordUpdateDownloaded(s, { version: '1.2.3', bytes: 42_000_000 });
    applyDownloadedUpdate(s);
    scheduleRelaunch(s, 5_000);
    expect(s.state).toBe('relaunch-scheduled');
    expect(s.latestVersion).toBe('1.2.3');
    expect(s.downloadedBytes).toBe(42_000_000);
    expect(s.applied).toBe(true);
    expect(s.relaunchDelayMs).toBe(5_000);
    expect(s.history.map((h) => h.neutralEvent)).toEqual([
      'auto-updater.check_started',
      'auto-updater.update_downloaded',
      'auto-updater.update_applied',
      'auto-updater.relaunch_scheduled',
    ]);
  });

  it('rejects apply without download', () => {
    const s = startAutoUpdaterCheck({ target: 'windows', channel: 'beta' });
    expect(() => applyDownloadedUpdate(s)).toThrow(/not downloaded/);
  });

  it('rejects relaunch without apply', () => {
    const s = startAutoUpdaterCheck({ target: 'linux', channel: 'nightly' });
    recordUpdateDownloaded(s, { version: '2.0.0', bytes: 1 });
    expect(() => scheduleRelaunch(s, 100)).toThrow(/not applied/);
  });

  it('rejects empty / negative inputs', () => {
    expect(() => startAutoUpdaterCheck({ target: 'macos', channel: '' })).toThrow(/channel/);
    const s = startAutoUpdaterCheck({ target: 'macos', channel: 'stable' });
    expect(() => recordUpdateDownloaded(s, { version: '', bytes: 10 })).toThrow(/version/);
    expect(() => recordUpdateDownloaded(s, { version: '1.0', bytes: -1 })).toThrow(/bytes/);
    recordUpdateDownloaded(s, { version: '1.0', bytes: 10 });
    applyDownloadedUpdate(s);
    expect(() => scheduleRelaunch(s, -1)).toThrow(/delayMs/);
  });

  it('provider dialect maps per target', () => {
    const mac = startAutoUpdaterCheck({ target: 'macos', channel: 'stable' });
    const win = startAutoUpdaterCheck({ target: 'windows', channel: 'stable' });
    const lin = startAutoUpdaterCheck({ target: 'linux', channel: 'stable' });
    expect(mac.history[0]?.providerEvent).toContain('macos.autoUpdater');
    expect(win.history[0]?.providerEvent).toContain('windows.autoUpdater');
    expect(lin.history[0]?.providerEvent).toContain('linux.autoUpdater');
  });
});
