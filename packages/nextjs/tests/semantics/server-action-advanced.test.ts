import { describe, expect, it } from 'vitest';
import {
  redirectAction,
  revalidateActionPath,
  revalidateActionTag,
  startServerActionAdvanced,
  submitFormAction,
} from '../../src/index.js';

describe('server-action-advanced axis', () => {
  it('starts idle', () => {
    const session = startServerActionAdvanced({ target: 'app-router', actionId: 'save' });
    expect(session.state).toBe('idle');
  });

  it('rejects empty action id', () => {
    expect(() => startServerActionAdvanced({ target: 'app-router', actionId: '' })).toThrow(
      /actionId must not be empty/,
    );
  });

  it('submits form action', () => {
    const session = startServerActionAdvanced({ target: 'app-router', actionId: 'save' });
    const step = submitFormAction(session, { title: 'Hello', body: 'World' });
    expect(step.neutralEvent).toBe('action.form_submitted');
    expect(step.metadata.fieldCount).toBe(2);
    expect(step.amountCents).toBe(0);
  });

  it('rejects duplicate submit', () => {
    const session = startServerActionAdvanced({ target: 'app-router', actionId: 'save' });
    submitFormAction(session, {});
    expect(() => submitFormAction(session, {})).toThrow(/not idle/);
  });

  it('revalidates path after submit', () => {
    const session = startServerActionAdvanced({ target: 'app-router', actionId: 'save' });
    submitFormAction(session, {});
    const step = revalidateActionPath(session, '/items');
    expect(step.providerEvent).toBe('app.cache.revalidatePath');
    expect(session.revalidatedPaths).toEqual(['/items']);
  });

  it('rejects path revalidation before submit', () => {
    const session = startServerActionAdvanced({ target: 'app-router', actionId: 'save' });
    expect(() => revalidateActionPath(session, '/items')).toThrow(/not submitted/);
  });

  it('rejects invalid path', () => {
    const session = startServerActionAdvanced({ target: 'app-router', actionId: 'save' });
    submitFormAction(session, {});
    expect(() => revalidateActionPath(session, 'items')).toThrow(/start with \//);
  });

  it('revalidates tag after path revalidation', () => {
    const session = startServerActionAdvanced({ target: 'edge-runtime', actionId: 'save' });
    submitFormAction(session, {});
    revalidateActionPath(session, '/items');
    const step = revalidateActionTag(session, 'items');
    expect(step.providerEvent).toBe('edge.cache.revalidateTag');
    expect(step.metadata.count).toBe(1);
  });

  it('rejects empty tag', () => {
    const session = startServerActionAdvanced({ target: 'app-router', actionId: 'save' });
    submitFormAction(session, {});
    expect(() => revalidateActionTag(session, '')).toThrow(/tag must not be empty/);
  });

  it('redirects after cache effects', () => {
    const session = startServerActionAdvanced({ target: 'pages-router', actionId: 'save' });
    submitFormAction(session, {});
    revalidateActionPath(session, '/items');
    const step = redirectAction(session, '/items/1');
    expect(step.providerEvent).toBe('pages.router.redirect');
    expect(session.redirectUrl).toBe('/items/1');
  });

  it('rejects redirect before submit', () => {
    const session = startServerActionAdvanced({ target: 'app-router', actionId: 'save' });
    expect(() => redirectAction(session, '/items')).toThrow(/not submitted/);
  });

  it('rejects empty redirect url', () => {
    const session = startServerActionAdvanced({ target: 'app-router', actionId: 'save' });
    submitFormAction(session, {});
    expect(() => redirectAction(session, '')).toThrow(/url must not be empty/);
  });

  it('records full history order', () => {
    const session = startServerActionAdvanced({ target: 'app-router', actionId: 'save' });
    submitFormAction(session, { title: 'x' });
    revalidateActionPath(session, '/items');
    revalidateActionTag(session, 'items');
    redirectAction(session, '/items/1');
    expect(session.history.map((step) => step.neutralEvent)).toEqual([
      'action.form_submitted',
      'action.revalidate_path',
      'action.revalidate_tag',
      'action.redirected',
    ]);
  });
});
