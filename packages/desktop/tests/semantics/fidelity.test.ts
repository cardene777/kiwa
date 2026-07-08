import { describe, expect, it } from 'vitest';
import {
  DESKTOP_AXIS_TO_EVENTS,
  collectFidelityCoverage,
  providerEventName,
  type DesktopAxis,
} from '../../src/index.js';

describe('desktop fidelity coverage (v0.3 — 3 target × 12 axis)', () => {
  it('collects 3 targets × 12 axes = 36 rows', () => {
    const coverage = collectFidelityCoverage();
    expect(coverage.providers).toEqual(['macos', 'windows', 'linux']);
    expect(coverage.axes).toHaveLength(12);
    expect(coverage.rows).toHaveLength(36);
  });

  it('maps every axis to 4 neutral events', () => {
    for (const events of Object.values(DESKTOP_AXIS_TO_EVENTS)) {
      expect(events).toHaveLength(4);
    }
  });

  it('combined 12-axis story (v0.1 3 axis + v0.2 5 axis + v0.3 4 axis)', () => {
    const axes = Object.keys(DESKTOP_AXIS_TO_EVENTS) as DesktopAxis[];
    expect(axes).toEqual([
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
    ]);
  });

  it('translates v0.1 axis dialects (webview)', () => {
    expect(providerEventName('macos', 'webview.preload_loaded')).toBe('macos.webview.preload');
    expect(providerEventName('windows', 'webview.preload_loaded')).toBe('windows.webview2.preload');
    expect(providerEventName('linux', 'webview.preload_loaded')).toBe('linux.webkit.preload');
  });

  it('translates v0.2 auto-updater dialect', () => {
    expect(providerEventName('macos', 'auto-updater.check_started')).toBe(
      'macos.autoUpdater.checkForUpdates',
    );
    expect(providerEventName('windows', 'auto-updater.check_started')).toBe(
      'windows.autoUpdater.checkForUpdates',
    );
    expect(providerEventName('linux', 'auto-updater.check_started')).toBe(
      'linux.autoUpdater.checkForUpdates',
    );
  });

  it('translates v0.2 fs-permissions dialect (TCC / UAC / xdg-portal)', () => {
    expect(providerEventName('macos', 'fs-permissions.request_submitted')).toBe(
      'macos.tcc.requestAccess',
    );
    expect(providerEventName('windows', 'fs-permissions.request_submitted')).toBe(
      'windows.uac.request',
    );
    expect(providerEventName('linux', 'fs-permissions.request_submitted')).toBe(
      'linux.xdgPortal.request',
    );
  });

  it('translates v0.2 notification dialect (UserNotifications / Toast / libnotify)', () => {
    expect(providerEventName('macos', 'notification.displayed')).toBe(
      'macos.userNotifications.display',
    );
    expect(providerEventName('windows', 'notification.displayed')).toBe(
      'windows.toastNotification.show',
    );
    expect(providerEventName('linux', 'notification.displayed')).toBe(
      'linux.libnotify.show',
    );
  });

  it('translates v0.2 menu-bar dialect (NSMenu / WM_MENU / GTK)', () => {
    expect(providerEventName('macos', 'menu-bar.built')).toBe('macos.NSMenu.setMainMenu');
    expect(providerEventName('windows', 'menu-bar.built')).toBe('windows.menu.SetMenu');
    expect(providerEventName('linux', 'menu-bar.built')).toBe('linux.gtk.menubar.new');
  });

  it('translates v0.2 tray-icon dialect (NSStatusItem / NotifyIcon / StatusNotifierItem)', () => {
    expect(providerEventName('macos', 'tray-icon.created')).toBe('macos.NSStatusItem.create');
    expect(providerEventName('windows', 'tray-icon.created')).toBe('windows.notifyIcon.NIM_ADD');
    expect(providerEventName('linux', 'tray-icon.created')).toBe(
      'linux.statusNotifierItem.Register',
    );
  });

  it('translates v0.3 screen-recording dialect (ScreenCaptureKit / Windows.Graphics.Capture / xdg-portal ScreenCast)', () => {
    expect(providerEventName('macos', 'screen-recording.started')).toBe('macos.SCStream.start');
    expect(providerEventName('windows', 'screen-recording.started')).toBe(
      'windows.GraphicsCaptureSession.startCapture',
    );
    expect(providerEventName('linux', 'screen-recording.started')).toBe(
      'linux.xdgPortal.ScreenCast.Start',
    );
  });

  it('translates v0.3 global-shortcut dialect (Carbon / User32 / xdg-portal GlobalShortcuts)', () => {
    expect(providerEventName('macos', 'global-shortcut.registered')).toBe(
      'macos.RegisterEventHotKey',
    );
    expect(providerEventName('windows', 'global-shortcut.registered')).toBe(
      'windows.User32.RegisterHotKey',
    );
    expect(providerEventName('linux', 'global-shortcut.registered')).toBe(
      'linux.xdgPortal.GlobalShortcuts.BindShortcut',
    );
  });

  it('translates v0.3 clipboard dialect (NSPasteboard / SetClipboardData / gtk_clipboard)', () => {
    expect(providerEventName('macos', 'clipboard.written')).toBe('macos.NSPasteboard.setString');
    expect(providerEventName('windows', 'clipboard.written')).toBe(
      'windows.User32.SetClipboardData',
    );
    expect(providerEventName('linux', 'clipboard.written')).toBe('linux.gtk.clipboard.set_text');
  });

  it('translates v0.3 dark-mode dialect (AppleInterfaceTheme / ImmersiveColorSet / xdg-portal Settings)', () => {
    expect(providerEventName('macos', 'dark-mode.theme_changed')).toBe(
      'macos.AppleInterfaceThemeChangedNotification',
    );
    expect(providerEventName('windows', 'dark-mode.theme_changed')).toBe(
      'windows.ImmersiveColorSet',
    );
    expect(providerEventName('linux', 'dark-mode.theme_changed')).toBe(
      'linux.xdgPortal.Settings.color-scheme.changed',
    );
  });

  it('subset provider works (macos only = 12 rows)', () => {
    const coverage = collectFidelityCoverage(['macos']);
    expect(coverage.rows).toHaveLength(12);
    expect(coverage.rows.every((r) => r.provider === 'macos')).toBe(true);
  });

  it('v0.3 axis order preserves 8 → 12 append convention (no reorder)', () => {
    const coverage = collectFidelityCoverage(['macos']);
    expect(coverage.rows.map((r) => r.axis)).toEqual([
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
    ]);
  });
});
