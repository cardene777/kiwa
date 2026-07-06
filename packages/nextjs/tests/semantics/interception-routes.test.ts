import { describe, expect, it } from 'vitest';
import {
  interceptCurrentSegment,
  interceptParentSegment,
  interceptRootCatchall,
  openInterceptedModal,
  startInterceptionRoutes,
} from '../../src/index.js';

describe('interception-routes axis', () => {
  it('starts idle', () => {
    const session = startInterceptionRoutes({ target: 'app-router', routeId: '/feed' });
    expect(session.state).toBe('idle');
  });

  it('rejects empty route id', () => {
    expect(() => startInterceptionRoutes({ target: 'app-router', routeId: '' })).toThrow(
      /routeId must not be empty/,
    );
  });

  it('intercepts current segment', () => {
    const session = startInterceptionRoutes({ target: 'app-router', routeId: '/feed' });
    const step = interceptCurrentSegment(session, '/feed', '/photo/1');
    expect(step.neutralEvent).toBe('intercept.current_segment');
    expect(session.matches[0]?.matcher).toBe('(.)');
  });

  it('intercepts parent segment', () => {
    const session = startInterceptionRoutes({ target: 'pages-router', routeId: '/feed' });
    const step = interceptParentSegment(session, '/feed/items', '/photo/1');
    expect(step.providerEvent).toBe('pages.intercept.parent');
    expect(step.state).toBe('parent');
  });

  it('intercepts root catchall', () => {
    const session = startInterceptionRoutes({ target: 'edge-runtime', routeId: '/feed' });
    const step = interceptRootCatchall(session, '/feed/items', '/login');
    expect(step.providerEvent).toBe('edge.intercept.root');
    expect(session.matches[0]?.matcher).toBe('(...)');
  });

  it('rejects intercept without slash source', () => {
    const session = startInterceptionRoutes({ target: 'app-router', routeId: '/feed' });
    expect(() => interceptCurrentSegment(session, 'feed', '/photo')).toThrow(/start with \//);
  });

  it('rejects intercept without slash target', () => {
    const session = startInterceptionRoutes({ target: 'app-router', routeId: '/feed' });
    expect(() => interceptCurrentSegment(session, '/feed', 'photo')).toThrow(/start with \//);
  });

  it('opens intercepted modal after match', () => {
    const session = startInterceptionRoutes({ target: 'app-router', routeId: '/feed' });
    interceptCurrentSegment(session, '/feed', '/photo/1');
    const step = openInterceptedModal(session, '/photo/1');
    expect(step.neutralEvent).toBe('intercept.modal_opened');
    expect(step.metadata.matchCount).toBe(1);
  });

  it('rejects modal before match', () => {
    const session = startInterceptionRoutes({ target: 'app-router', routeId: '/feed' });
    expect(() => openInterceptedModal(session, '/photo/1')).toThrow(/match is required/);
  });

  it('rejects empty modal route', () => {
    const session = startInterceptionRoutes({ target: 'app-router', routeId: '/feed' });
    interceptCurrentSegment(session, '/feed', '/photo/1');
    expect(() => openInterceptedModal(session, '')).toThrow(/modalRoute must not be empty/);
  });

  it('records multiple match distances', () => {
    const session = startInterceptionRoutes({ target: 'app-router', routeId: '/feed' });
    interceptCurrentSegment(session, '/feed', '/photo/1');
    interceptParentSegment(session, '/feed/items', '/photo/2');
    interceptRootCatchall(session, '/feed/items', '/login');
    expect(session.matches.map((match) => match.matcher)).toEqual(['(.)', '(..)', '(...)']);
  });

  it('records history order including modal', () => {
    const session = startInterceptionRoutes({ target: 'app-router', routeId: '/feed' });
    interceptCurrentSegment(session, '/feed', '/photo/1');
    openInterceptedModal(session, '/photo/1');
    expect(session.history.map((step) => step.neutralEvent)).toEqual([
      'intercept.current_segment',
      'intercept.modal_opened',
    ]);
  });
});
