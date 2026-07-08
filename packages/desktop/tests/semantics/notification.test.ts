import { describe, expect, it } from 'vitest';
import {
  dismissNotification,
  displayNotification,
  invokeNotificationAction,
  scheduleNotification,
} from '../../src/index.js';

describe('notification axis semantics (v0.2)', () => {
  it('schedule → display → action → dismiss full path', () => {
    const s = scheduleNotification({
      target: 'macos',
      notificationId: 'notif-1',
      title: 'Update available',
      scheduledAtMs: 1_000,
    });
    displayNotification(s, 1_500);
    invokeNotificationAction(s, 'view-details');
    dismissNotification(s);
    expect(s.state).toBe('dismissed');
    expect(s.displayedAtMs).toBe(1_500);
    expect(s.actions).toEqual(['view-details']);
    expect(s.dismissed).toBe(true);
  });

  it('rejects display before scheduledAt', () => {
    const s = scheduleNotification({
      target: 'windows',
      notificationId: 'n',
      title: 't',
      scheduledAtMs: 2_000,
    });
    expect(() => displayNotification(s, 1_000)).toThrow(/scheduledAtMs/);
  });

  it('rejects action before display', () => {
    const s = scheduleNotification({
      target: 'linux',
      notificationId: 'n',
      title: 't',
      scheduledAtMs: 0,
    });
    expect(() => invokeNotificationAction(s, 'x')).toThrow(/not displayed/);
    expect(() => dismissNotification(s)).toThrow(/not displayed/);
  });

  it('rejects empty inputs', () => {
    expect(() =>
      scheduleNotification({ target: 'macos', notificationId: '', title: 't', scheduledAtMs: 0 }),
    ).toThrow(/notificationId/);
    expect(() =>
      scheduleNotification({ target: 'macos', notificationId: 'n', title: '', scheduledAtMs: 0 }),
    ).toThrow(/title/);
    expect(() =>
      scheduleNotification({ target: 'macos', notificationId: 'n', title: 't', scheduledAtMs: -1 }),
    ).toThrow(/scheduledAtMs/);
    const s = scheduleNotification({ target: 'macos', notificationId: 'n', title: 't', scheduledAtMs: 0 });
    displayNotification(s, 100);
    expect(() => invokeNotificationAction(s, '')).toThrow(/actionId/);
  });

  it('provider dialect maps per target', () => {
    const mac = scheduleNotification({ target: 'macos', notificationId: 'n', title: 't', scheduledAtMs: 0 });
    const win = scheduleNotification({ target: 'windows', notificationId: 'n', title: 't', scheduledAtMs: 0 });
    const lin = scheduleNotification({ target: 'linux', notificationId: 'n', title: 't', scheduledAtMs: 0 });
    expect(mac.history[0]?.providerEvent).toContain('macos.userNotifications');
    expect(win.history[0]?.providerEvent).toContain('windows.toastNotification');
    expect(lin.history[0]?.providerEvent).toContain('linux.libnotify');
  });

  it('multiple actions accumulate before dismiss', () => {
    const s = scheduleNotification({
      target: 'macos',
      notificationId: 'multi',
      title: 't',
      scheduledAtMs: 0,
    });
    displayNotification(s, 10);
    invokeNotificationAction(s, 'a1');
    invokeNotificationAction(s, 'a2');
    invokeNotificationAction(s, 'a3');
    expect(s.actions).toEqual(['a1', 'a2', 'a3']);
    dismissNotification(s);
    expect(s.dismissed).toBe(true);
  });
});
