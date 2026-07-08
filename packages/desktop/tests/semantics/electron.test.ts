import { describe, expect, it } from 'vitest';
import {
  createBrowserWindow,
  dispatchIpcMessage,
  quitElectronApp,
  startElectronApp,
} from '../../src/index.js';

describe('electron axis semantics', () => {
  it('start → window → ipc → quit', () => {
    const s = startElectronApp({ target: 'macos', appId: 'com.example.app' });
    createBrowserWindow(s, 'main');
    dispatchIpcMessage(s, { channel: 'ping', payload: 'hello' });
    quitElectronApp(s);
    expect(s.state).toBe('quit');
    expect(s.windowIds).toContain('main');
    expect(s.ipcMessages).toBe(1);
  });

  it('rejects operations after quit', () => {
    const s = startElectronApp({ target: 'windows', appId: 'x' });
    quitElectronApp(s);
    expect(() => createBrowserWindow(s, 'ghost')).toThrow(/quit/);
    expect(() => dispatchIpcMessage(s, { channel: 'x', payload: '' })).toThrow(/quit/);
    expect(() => quitElectronApp(s)).toThrow(/already quit/);
  });

  it('rejects empty inputs', () => {
    expect(() => startElectronApp({ target: 'macos', appId: '' })).toThrow(/appId/);
    const s = startElectronApp({ target: 'macos', appId: 'x' });
    expect(() => createBrowserWindow(s, '')).toThrow(/windowId/);
    expect(() => dispatchIpcMessage(s, { channel: '', payload: 'x' })).toThrow(/channel/);
  });

  it('provider dialect maps per target', () => {
    const s = startElectronApp({ target: 'linux', appId: 'x' });
    expect(s.history[0]?.providerEvent).toContain('linux');
  });

  it('multiple windows accumulate', () => {
    const s = startElectronApp({ target: 'macos', appId: 'x' });
    createBrowserWindow(s, 'w1');
    createBrowserWindow(s, 'w2');
    expect(s.windowIds).toEqual(['w1', 'w2']);
  });
});
