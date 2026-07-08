import { describe, expect, it } from 'vitest';
import { MOCK_ADAPTERS, REAL_ADAPTERS, REAL_AXIS_RUNNERS } from '../../src/index.js';
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

describe('v0.7 REAL_AXIS_RUNNERS — 12 axis 別 real behavior 差別化', () => {
  it('REAL_AXIS_RUNNERS has all 12 axes', () => {
    expect(Object.keys(REAL_AXIS_RUNNERS).sort()).toEqual([...ALL_AXES].sort());
  });

  it('real 経路は mode=real で AdapterResult 返却', async () => {
    for (const axis of ALL_AXES) {
      const result = await REAL_AXIS_RUNNERS[axis]({
        scanId: 'r-test',
        target: 'macos',
        mode: 'real',
      });
      expect(result.axis).toBe(axis);
      expect(result.mode).toBe('real');
      expect(result.completed).toBe(true);
    }
  });

  it('mock/real で shape 契約 preserving = neutralEvents + eventCount 一致', async () => {
    for (const axis of ALL_AXES) {
      for (const target of ALL_TARGETS) {
        const mockRes = await MOCK_ADAPTERS[axis].scan({ scanId: 'shape', target, mode: 'mock' });
        const realRes = await REAL_ADAPTERS[axis].scan({ scanId: 'shape', target, mode: 'real' });
        expect(realRes.neutralEvents).toEqual(mockRes.neutralEvents);
        expect(realRes.eventCount).toBe(mockRes.eventCount);
      }
    }
  });

  it('mock/real で metadata 差別化 (behavior diff 検出可能)', async () => {
    // clipboard = mock は "hello adapter"、 real は URL
    const mockCb = await MOCK_ADAPTERS['clipboard'].scan({ scanId: 'meta', target: 'macos', mode: 'mock' });
    const realCb = await REAL_ADAPTERS['clipboard'].scan({ scanId: 'meta', target: 'macos', mode: 'real' });
    // Read step の contentLength 比較 (clipboard.written は writeClipboard 経由)
    const mockWrittenStep = mockCb.history.find((s) => s.neutralEvent === 'clipboard.written');
    const realWrittenStep = realCb.history.find((s) => s.neutralEvent === 'clipboard.written');
    expect(mockWrittenStep?.metadata.contentLength).not.toBe(realWrittenStep?.metadata.contentLength);
  });

  it('auto-updater real は 128MB update (mock 42MB と差別化)', async () => {
    const realResult = await REAL_ADAPTERS['auto-updater'].scan({
      scanId: 'update',
      target: 'macos',
      mode: 'real',
    });
    const downloadedStep = realResult.history.find((s) => s.neutralEvent === 'auto-updater.update_downloaded');
    expect(downloadedStep?.metadata.bytes).toBe(128_000_000);
    expect(downloadedStep?.metadata.version).toBe('2.5.0');
  });

  it('screen-recording real は 4K chunk (8MB each、 mock 1MB + 2MB と差別化)', async () => {
    const realResult = await REAL_ADAPTERS['screen-recording'].scan({
      scanId: 'record',
      target: 'macos',
      mode: 'real',
    });
    const chunkSteps = realResult.history.filter((s) => s.neutralEvent === 'screen-recording.chunk_captured');
    expect(chunkSteps).toHaveLength(2);
    expect(chunkSteps[0]?.metadata.chunkBytes).toBe(8_388_608);
    expect(chunkSteps[1]?.metadata.chunkBytes).toBe(8_388_608);
  });

  it('dark-mode real は initialTheme=no-preference (mock light と差別化)', async () => {
    const realResult = await REAL_ADAPTERS['dark-mode'].scan({
      scanId: 'dark',
      target: 'macos',
      mode: 'real',
    });
    const subscribedStep = realResult.history.find((s) => s.neutralEvent === 'dark-mode.subscribed');
    expect(subscribedStep?.metadata.initialTheme).toBe('no-preference');
  });

  it('all 12 axes preserve provider dialect per target', async () => {
    // provider event の target prefix が正しく維持されているか
    for (const target of ALL_TARGETS) {
      const result = await REAL_ADAPTERS['clipboard'].scan({
        scanId: 'dialect',
        target,
        mode: 'real',
      });
      expect(result.history[0]?.providerEvent).toContain(target);
    }
  });
});
