import { describe, expect, it } from 'vitest';
import {
  MOCK_ADAPTERS,
  REAL_ADAPTERS,
  makeMockAdapter,
  makeRealAdapter,
  type AdapterMode,
  type DesktopAdapter,
} from '../../src/index.js';
import type { DesktopAxis, DesktopTarget } from '../../src/semantics/index.js';

const ALL_AXES: DesktopAxis[] = [
  'electron',
  'tauri',
  'webview',
  'auto-updater',
  'fs-permissions',
  'notification',
  'menu-bar',
  'tray-icon',
  'screen-recording',
  'global-shortcut',
  'clipboard',
  'dark-mode',
];

const ALL_TARGETS: DesktopTarget[] = ['macos', 'windows', 'linux'];
const ALL_MODES: AdapterMode[] = ['mock', 'real'];

describe('desktop adapter interface (v0.4)', () => {
  it('MOCK_ADAPTERS has all 12 axes', () => {
    expect(Object.keys(MOCK_ADAPTERS).sort()).toEqual([...ALL_AXES].sort());
  });

  it('REAL_ADAPTERS has all 12 axes', () => {
    expect(Object.keys(REAL_ADAPTERS).sort()).toEqual([...ALL_AXES].sort());
  });

  it('makeMockAdapter returns axis-matched adapter', () => {
    for (const axis of ALL_AXES) {
      const a: DesktopAdapter = makeMockAdapter(axis);
      expect(a.axis).toBe(axis);
    }
  });

  it('makeRealAdapter returns axis-matched adapter', () => {
    for (const axis of ALL_AXES) {
      const a: DesktopAdapter = makeRealAdapter(axis);
      expect(a.axis).toBe(axis);
    }
  });

  it('72 combination scan all complete (3 target × 12 axis × 2 mode)', async () => {
    let count = 0;
    for (const axis of ALL_AXES) {
      for (const target of ALL_TARGETS) {
        for (const mode of ALL_MODES) {
          const adapter = mode === 'mock' ? MOCK_ADAPTERS[axis] : REAL_ADAPTERS[axis];
          const result = await adapter.scan({ scanId: `t-${count}`, target, mode });
          expect(result.axis).toBe(axis);
          expect(result.target).toBe(target);
          expect(result.mode).toBe(mode);
          expect(result.completed).toBe(true);
          expect(result.eventCount).toBeGreaterThan(0);
          expect(result.history.length).toBe(result.eventCount);
          expect(result.neutralEvents.length).toBeGreaterThan(0);
          expect(result.durationMs).toBeGreaterThanOrEqual(0);
          count += 1;
        }
      }
    }
    expect(count).toBe(72);
  });

  it('mock and real produce identical neutralEvents (shape 契約 preserving)', async () => {
    for (const axis of ALL_AXES) {
      const mockRes = await MOCK_ADAPTERS[axis].scan({ scanId: 'shape', target: 'macos', mode: 'mock' });
      const realRes = await REAL_ADAPTERS[axis].scan({ scanId: 'shape', target: 'macos', mode: 'real' });
      expect(realRes.neutralEvents).toEqual(mockRes.neutralEvents);
      expect(realRes.eventCount).toBe(mockRes.eventCount);
    }
  });

  it('per-target provider dialect differs between macos / windows / linux', async () => {
    const macRes = await MOCK_ADAPTERS['clipboard'].scan({ scanId: 'dialect', target: 'macos', mode: 'mock' });
    const winRes = await MOCK_ADAPTERS['clipboard'].scan({ scanId: 'dialect', target: 'windows', mode: 'mock' });
    const linRes = await MOCK_ADAPTERS['clipboard'].scan({ scanId: 'dialect', target: 'linux', mode: 'mock' });
    expect(macRes.history[0]?.providerEvent).toContain('macos.NSPasteboard');
    expect(winRes.history[0]?.providerEvent).toContain('windows.User32.SetClipboardData');
    expect(linRes.history[0]?.providerEvent).toContain('linux.gtk.clipboard');
  });

  it('scan history preserves neutralEvent ordering per axis', async () => {
    const r = await MOCK_ADAPTERS['auto-updater'].scan({ scanId: 'order', target: 'macos', mode: 'mock' });
    expect(r.neutralEvents).toEqual([
      'auto-updater.check_started',
      'auto-updater.update_downloaded',
      'auto-updater.update_applied',
      'auto-updater.relaunch_scheduled',
    ]);
  });
});
