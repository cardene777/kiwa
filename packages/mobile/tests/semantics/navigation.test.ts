import { describe, expect, it } from 'vitest';
import {
  initNavigation,
  navigateDeepLink,
  openNavigationModal,
  pushNavigationStack,
  switchNavigationTab,
} from '../../src/index.js';

describe('v1.51 navigation semantics', () => {
  it('push + tab + modal + deep-link', () => {
    const s = initNavigation({ target: 'ios', navigatorId: 'root' });
    pushNavigationStack(s, 'HomeScreen');
    pushNavigationStack(s, 'DetailScreen');
    switchNavigationTab(s, 'Search');
    openNavigationModal(s, 'FilterModal');
    navigateDeepLink(s, 'myapp://user/1');
    expect(s.stackHistory).toEqual(['HomeScreen', 'DetailScreen']);
    expect(s.activeTab).toBe('Search');
    expect(s.activeModals).toContain('FilterModal');
    expect(s.state).toBe('deep-linked');
  });

  it('rejects empty inputs', () => {
    expect(() => initNavigation({ target: 'ios', navigatorId: '' })).toThrow(/navigatorId/);
    const s = initNavigation({ target: 'ios', navigatorId: 'x' });
    expect(() => pushNavigationStack(s, '')).toThrow(/screenName/);
    expect(() => switchNavigationTab(s, '')).toThrow(/tabName/);
    expect(() => openNavigationModal(s, '')).toThrow(/modalId/);
    expect(() => navigateDeepLink(s, '')).toThrow(/url/);
  });

  it('modal count accumulates', () => {
    const s = initNavigation({ target: 'android', navigatorId: 'root' });
    openNavigationModal(s, 'm1');
    openNavigationModal(s, 'm2');
    expect(s.activeModals).toHaveLength(2);
  });

  it('web dialect maps', () => {
    const s = initNavigation({ target: 'web', navigatorId: 'root' });
    pushNavigationStack(s, 'Home');
    expect(s.history[0]?.providerEvent).toBe('web.history.push');
  });
});
