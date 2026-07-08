import { describe, expect, it } from 'vitest';
import {
  appendMenuBarItem,
  buildMenuBar,
  clickMenuBarItem,
  destroyMenuBar,
} from '../../src/index.js';

describe('menu-bar axis semantics (v0.2)', () => {
  it('build → append → click → destroy full path', () => {
    const s = buildMenuBar({ target: 'macos', menuId: 'main-menu' });
    appendMenuBarItem(s, { id: 'file', label: 'File', accelerator: 'Cmd+F' });
    appendMenuBarItem(s, { id: 'edit', label: 'Edit', accelerator: null });
    clickMenuBarItem(s, 'file');
    destroyMenuBar(s);
    expect(s.state).toBe('destroyed');
    expect(s.items.length).toBe(2);
    expect(s.clickCount).toBe(1);
    expect(s.destroyed).toBe(true);
  });

  it('rejects duplicate item ids', () => {
    const s = buildMenuBar({ target: 'windows', menuId: 'main' });
    appendMenuBarItem(s, { id: 'file', label: 'File', accelerator: null });
    expect(() =>
      appendMenuBarItem(s, { id: 'file', label: 'File 2', accelerator: null }),
    ).toThrow(/duplicate/);
  });

  it('rejects operations after destroy', () => {
    const s = buildMenuBar({ target: 'linux', menuId: 'x' });
    destroyMenuBar(s);
    expect(() =>
      appendMenuBarItem(s, { id: 'a', label: 'A', accelerator: null }),
    ).toThrow(/destroyed/);
    expect(() => clickMenuBarItem(s, 'a')).toThrow(/destroyed/);
    expect(() => destroyMenuBar(s)).toThrow(/already destroyed/);
  });

  it('rejects empty inputs', () => {
    expect(() => buildMenuBar({ target: 'macos', menuId: '' })).toThrow(/menuId/);
    const s = buildMenuBar({ target: 'macos', menuId: 'x' });
    expect(() => appendMenuBarItem(s, { id: '', label: 'A', accelerator: null })).toThrow(/id/);
    expect(() => appendMenuBarItem(s, { id: 'a', label: '', accelerator: null })).toThrow(/label/);
    expect(() => clickMenuBarItem(s, 'missing')).toThrow(/not found/);
  });

  it('provider dialect maps per target', () => {
    const mac = buildMenuBar({ target: 'macos', menuId: 'x' });
    const win = buildMenuBar({ target: 'windows', menuId: 'x' });
    const lin = buildMenuBar({ target: 'linux', menuId: 'x' });
    expect(mac.history[0]?.providerEvent).toContain('macos.NSMenu');
    expect(win.history[0]?.providerEvent).toContain('windows.menu');
    expect(lin.history[0]?.providerEvent).toContain('linux.gtk');
  });
});
