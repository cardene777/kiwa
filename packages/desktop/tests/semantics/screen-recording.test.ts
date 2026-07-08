import { describe, expect, it } from 'vitest';
import {
  captureScreenChunk,
  requestScreenRecordingPermission,
  startScreenRecording,
  stopScreenRecording,
} from '../../src/index.js';

describe('screen-recording axis semantics (v0.3)', () => {
  it('permission → start → chunk → stop full path', () => {
    const s = requestScreenRecordingPermission({
      target: 'macos',
      sessionId: 'rec-1',
      displayId: 'display-primary',
    });
    startScreenRecording(s, true);
    captureScreenChunk(s, 1_048_576);
    captureScreenChunk(s, 2_097_152);
    stopScreenRecording(s);
    expect(s.state).toBe('stopped');
    expect(s.permissionGranted).toBe(true);
    expect(s.chunksCaptured).toBe(2);
    expect(s.totalBytes).toBe(3_145_728);
  });

  it('rejects start without permission granted', () => {
    const s = requestScreenRecordingPermission({
      target: 'windows',
      sessionId: 'rec-2',
      displayId: 'd1',
    });
    expect(() => startScreenRecording(s, false)).toThrow(/permission denied/);
  });

  it('rejects chunk / stop before start', () => {
    const s = requestScreenRecordingPermission({
      target: 'linux',
      sessionId: 'rec-3',
      displayId: 'd1',
    });
    expect(() => captureScreenChunk(s, 100)).toThrow(/not recording/);
    expect(() => stopScreenRecording(s)).toThrow(/not started/);
  });

  it('rejects empty / negative inputs', () => {
    expect(() =>
      requestScreenRecordingPermission({ target: 'macos', sessionId: '', displayId: 'd' }),
    ).toThrow(/sessionId/);
    expect(() =>
      requestScreenRecordingPermission({ target: 'macos', sessionId: 's', displayId: '' }),
    ).toThrow(/displayId/);
    const s = requestScreenRecordingPermission({ target: 'macos', sessionId: 's', displayId: 'd' });
    startScreenRecording(s, true);
    expect(() => captureScreenChunk(s, -1)).toThrow(/chunkBytes/);
  });

  it('provider dialect maps per target', () => {
    const mac = requestScreenRecordingPermission({ target: 'macos', sessionId: 's', displayId: 'd' });
    const win = requestScreenRecordingPermission({ target: 'windows', sessionId: 's', displayId: 'd' });
    const lin = requestScreenRecordingPermission({ target: 'linux', sessionId: 's', displayId: 'd' });
    expect(mac.history[0]?.providerEvent).toContain('macos.CGRequestScreenCaptureAccess');
    expect(win.history[0]?.providerEvent).toContain('windows.GraphicsCaptureAccess');
    expect(lin.history[0]?.providerEvent).toContain('linux.xdgPortal.ScreenCast');
  });

  it('rejects double stop', () => {
    const s = requestScreenRecordingPermission({ target: 'macos', sessionId: 's', displayId: 'd' });
    startScreenRecording(s, true);
    captureScreenChunk(s, 100);
    stopScreenRecording(s);
    expect(() => stopScreenRecording(s)).toThrow(/already stopped/);
  });
});
