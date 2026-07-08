import { describe, expect, it } from 'vitest';
import {
  clearClipboard,
  notifyClipboardChange,
  openClipboard,
  readClipboard,
  writeClipboard,
} from '../../src/index.js';

describe('clipboard axis semantics (v0.3)', () => {
  it('write → read → change → clear full path', () => {
    const s = openClipboard({ target: 'macos', clipboardId: 'cb-1' });
    writeClipboard(s, { contents: 'hello', format: 'text' });
    readClipboard(s);
    notifyClipboardChange(s, 'external new value');
    clearClipboard(s);
    expect(s.state).toBe('cleared');
    expect(s.contents).toBeNull();
    expect(s.changeCount).toBe(2);
  });

  it('rejects read of empty clipboard', () => {
    const s = openClipboard({ target: 'linux', clipboardId: 'cb' });
    expect(() => readClipboard(s)).toThrow(/empty/);
  });

  it('rejects double clear', () => {
    const s = openClipboard({ target: 'windows', clipboardId: 'cb' });
    writeClipboard(s, { contents: 'x', format: 'text' });
    clearClipboard(s);
    expect(() => clearClipboard(s)).toThrow(/already cleared/);
  });

  it('rejects empty inputs', () => {
    expect(() => openClipboard({ target: 'macos', clipboardId: '' })).toThrow(/clipboardId/);
    const s = openClipboard({ target: 'macos', clipboardId: 'cb' });
    expect(() => writeClipboard(s, { contents: '', format: 'text' })).toThrow(/contents/);
    expect(() => notifyClipboardChange(s, '')).toThrow(/externalContents/);
  });

  it('provider dialect maps per target', () => {
    const mac = openClipboard({ target: 'macos', clipboardId: 'cb' });
    writeClipboard(mac, { contents: 'x', format: 'text' });
    expect(mac.history[0]?.providerEvent).toContain('macos.NSPasteboard');
    const win = openClipboard({ target: 'windows', clipboardId: 'cb' });
    writeClipboard(win, { contents: 'x', format: 'text' });
    expect(win.history[0]?.providerEvent).toContain('windows.User32.SetClipboardData');
    const lin = openClipboard({ target: 'linux', clipboardId: 'cb' });
    writeClipboard(lin, { contents: 'x', format: 'text' });
    expect(lin.history[0]?.providerEvent).toContain('linux.gtk.clipboard');
  });

  it('supports 4 formats', () => {
    for (const format of ['text', 'html', 'image', 'file-list'] as const) {
      const s = openClipboard({ target: 'macos', clipboardId: `cb-${format}` });
      writeClipboard(s, { contents: 'x', format });
      expect(s.format).toBe(format);
    }
  });
});
