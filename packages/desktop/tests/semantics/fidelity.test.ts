import { describe, expect, it } from 'vitest';
import {
  DESKTOP_AXIS_TO_EVENTS,
  collectFidelityCoverage,
  providerEventName,
  type DesktopAxis,
} from '../../src/index.js';

describe('desktop fidelity coverage', () => {
  it('collects 3 targets × 3 axes = 9 rows', () => {
    const coverage = collectFidelityCoverage();
    expect(coverage.providers).toEqual(['macos', 'windows', 'linux']);
    expect(coverage.axes).toHaveLength(3);
    expect(coverage.rows).toHaveLength(9);
  });

  it('maps every axis to 4 neutral events', () => {
    for (const events of Object.values(DESKTOP_AXIS_TO_EVENTS)) {
      expect(events).toHaveLength(4);
    }
  });

  it('combined 3-axis story (Electron + Tauri + Webview)', () => {
    const axes = Object.keys(DESKTOP_AXIS_TO_EVENTS) as DesktopAxis[];
    expect(axes).toEqual(['electron', 'tauri', 'webview']);
  });

  it('translates macos / windows / linux dialects differently', () => {
    expect(providerEventName('macos', 'webview.preload_loaded')).toBe('macos.webview.preload');
    expect(providerEventName('windows', 'webview.preload_loaded')).toBe('windows.webview2.preload');
    expect(providerEventName('linux', 'webview.preload_loaded')).toBe('linux.webkit.preload');
  });

  it('subset provider works', () => {
    const coverage = collectFidelityCoverage(['macos']);
    expect(coverage.rows).toHaveLength(3);
    expect(coverage.rows.every((r) => r.provider === 'macos')).toBe(true);
  });
});
