import { describe, expect, it } from 'vitest';
import {
  completeExpoBuild,
  loadExpoBuildConfig,
  receivePushNotification,
  resolveDeepLink,
} from '../../src/index.js';

describe('expo axis semantics', () => {
  it('load config → resolve link → push → build complete', () => {
    const s = loadExpoBuildConfig({ target: 'ios', appSlug: 'myapp', configHash: 'abc123' });
    resolveDeepLink(s, { scheme: 'myapp', path: 'user/42' });
    receivePushNotification(s, { notificationId: 'n1', category: 'chat' });
    completeExpoBuild(s);
    expect(s.state).toBe('build-completed');
    expect(s.resolvedLinks).toContain('myapp://user/42');
    expect(s.pushNotifications).toContain('n1');
  });

  it('rejects empty appSlug', () => {
    expect(() => loadExpoBuildConfig({ target: 'ios', appSlug: '', configHash: 'x' })).toThrow(/appSlug/);
  });

  it('rejects empty configHash', () => {
    expect(() => loadExpoBuildConfig({ target: 'ios', appSlug: 'x', configHash: '' })).toThrow(/configHash/);
  });

  it('multiple deep links accumulate', () => {
    const s = loadExpoBuildConfig({ target: 'android', appSlug: 'x', configHash: 'y' });
    resolveDeepLink(s, { scheme: 'x', path: 'a' });
    resolveDeepLink(s, { scheme: 'x', path: 'b' });
    expect(s.resolvedLinks).toHaveLength(2);
  });

  it('multiple push notifications accumulate', () => {
    const s = loadExpoBuildConfig({ target: 'web', appSlug: 'x', configHash: 'y' });
    receivePushNotification(s, { notificationId: 'n1', category: 'c' });
    receivePushNotification(s, { notificationId: 'n2', category: 'c' });
    expect(s.pushNotifications).toHaveLength(2);
  });
});
