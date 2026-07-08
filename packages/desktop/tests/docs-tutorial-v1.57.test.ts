/**
 * v1.57-3 docs 補強 — tutorial 117 code snippet 検証。
 * 35 milestone 連続 snippet validation streak = v1.23 → v1.57。 kiwa 史上最長記録更新継続。
 * systematic pattern 32 度目適用 (v1.56 の 31 度目 = desktop v0.1 3 axis uniform を継承)。
 */
import { describe, expect, it } from 'vitest';
import {
  appendMenuBarItem,
  applyDownloadedUpdate,
  buildMenuBar,
  clickMenuBarItem,
  clickTrayIcon,
  createTrayIcon,
  destroyMenuBar,
  dismissNotification,
  displayNotification,
  grantFsPermission,
  invokeNotificationAction,
  logFsPermissionAudit,
  recordUpdateDownloaded,
  removeTrayIcon,
  requestFsPermission,
  revokeFsPermission,
  scheduleNotification,
  scheduleRelaunch,
  startAutoUpdaterCheck,
  updateTrayTooltip,
} from '../src/index.js';

describe('tutorial 117 — Auto-updater snippet', () => {
  it('check → download → apply → relaunch', () => {
    const s = startAutoUpdaterCheck({ target: 'macos', channel: 'stable' });
    recordUpdateDownloaded(s, { version: '1.2.3', bytes: 42_000_000 });
    applyDownloadedUpdate(s);
    scheduleRelaunch(s, 5_000);
    expect(s.state).toBe('relaunch-scheduled');
    expect(s.applied).toBe(true);
    expect(s.relaunchDelayMs).toBe(5_000);
  });
});

describe('tutorial 117 — File-system permissions snippet', () => {
  it('request → grant → revoke → audit', () => {
    const s = requestFsPermission({
      target: 'macos',
      path: '/Users/alice/Documents',
      scope: 'read-write',
    });
    grantFsPermission(s, 'read');
    grantFsPermission(s, 'write');
    revokeFsPermission(s, 'read');
    logFsPermissionAudit(s, 'user-revoke');
    expect(s.state).toBe('audited');
    expect(s.grantedScopes).toEqual(['write']);
  });
});

describe('tutorial 117 — Notification snippet', () => {
  it('schedule → display → action → dismiss', () => {
    const s = scheduleNotification({
      target: 'windows',
      notificationId: 'update-1',
      title: 'Update available',
      scheduledAtMs: 1_000,
    });
    displayNotification(s, 1_500);
    invokeNotificationAction(s, 'view-details');
    dismissNotification(s);
    expect(s.state).toBe('dismissed');
    expect(s.actions).toEqual(['view-details']);
  });
});

describe('tutorial 117 — Menu-bar snippet', () => {
  it('build → append → click → destroy', () => {
    const s = buildMenuBar({ target: 'linux', menuId: 'main-menu' });
    appendMenuBarItem(s, { id: 'file', label: 'File', accelerator: 'Cmd+F' });
    appendMenuBarItem(s, { id: 'edit', label: 'Edit', accelerator: null });
    clickMenuBarItem(s, 'file');
    destroyMenuBar(s);
    expect(s.state).toBe('destroyed');
    expect(s.items.length).toBe(2);
    expect(s.clickCount).toBe(1);
  });
});

describe('tutorial 117 — Tray-icon snippet', () => {
  it('create → tooltip → click → remove', () => {
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
    expect(s.clickCount).toBe(2);
  });
});
