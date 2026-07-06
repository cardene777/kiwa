import { describe, expect, it } from 'vitest';
import {
  applyOptimisticUpdate,
  enableProgressiveEnhancement,
  markFormStatusPending,
  rejectFormAction,
  resolveFormAction,
  startFormActionSession,
} from '../../src/index.js';

describe('form-action-advanced axis', () => {
  it('starts idle with initial form', () => {
    const session = startFormActionSession({
      target: 'storybook8',
      formId: 'form-1',
      initial: { name: 'Ada' },
    });
    expect(session.state).toBe('idle');
    expect(session.form.name).toBe('Ada');
  });

  it('rejects empty form id', () => {
    expect(() =>
      startFormActionSession({ target: 'storybook8', formId: '', initial: {} }),
    ).toThrow(/formId must not be empty/);
  });

  it('marks useFormStatus pending', () => {
    const session = startFormActionSession({ target: 'storybook8', formId: 'form-2', initial: {} });
    const step = markFormStatusPending(session, 'save');
    expect(step.neutralEvent).toBe('form.status_pending');
    expect(step.metadata.submitter).toBe('save');
  });

  it('rejects duplicate pending status', () => {
    const session = startFormActionSession({ target: 'storybook8', formId: 'form-3', initial: {} });
    markFormStatusPending(session, 'save');
    expect(() => markFormStatusPending(session, 'save')).toThrow(/already pending/);
  });

  it('applies optimistic update while pending', () => {
    const session = startFormActionSession({
      target: 'storybook8',
      formId: 'form-4',
      initial: { title: 'Old' },
    });
    markFormStatusPending(session, 'save');
    const step = applyOptimisticUpdate(session, { title: 'New' });
    expect(step.neutralEvent).toBe('form.optimistic_applied');
    expect(session.form.title).toBe('New');
  });

  it('rejects optimistic update before pending', () => {
    const session = startFormActionSession({ target: 'storybook8', formId: 'form-5', initial: {} });
    expect(() => applyOptimisticUpdate(session, { title: 'New' })).toThrow(/not pending/);
  });

  it('applies multiple optimistic patches', () => {
    const session = startFormActionSession({ target: 'storybook8', formId: 'form-6', initial: {} });
    markFormStatusPending(session, 'save');
    applyOptimisticUpdate(session, { a: '1' });
    const step = applyOptimisticUpdate(session, { b: '2' });
    expect(step.metadata.patchCount).toBe(2);
    expect(step.metadata.patchKeys).toBe('b');
  });

  it('enables progressive enhancement', () => {
    const session = startFormActionSession({ target: 'playwright-ct', formId: 'form-7', initial: {} });
    const step = enableProgressiveEnhancement(session, { actionUrl: '/actions/save' });
    expect(step.providerEvent).toBe('pwct.form.enhanced');
    expect(step.metadata.method).toBe('post');
  });

  it('rejects empty action url', () => {
    const session = startFormActionSession({ target: 'storybook8', formId: 'form-8', initial: {} });
    expect(() => enableProgressiveEnhancement(session, { actionUrl: '' })).toThrow(
      /actionUrl must not be empty/,
    );
  });

  it('resolves action with result patch', () => {
    const session = startFormActionSession<Record<string, unknown>>({
      target: 'chromatic',
      formId: 'form-9',
      initial: {},
    });
    enableProgressiveEnhancement(session, { method: 'get', actionUrl: '/search' });
    const step = resolveFormAction(session, { query: 'kiwa' });
    expect(step.providerEvent).toBe('chromatic.form.resolved');
    expect(session.form['query']).toBe('kiwa');
  });

  it('rejects resolve before submission', () => {
    const session = startFormActionSession({ target: 'storybook8', formId: 'form-10', initial: {} });
    expect(() => resolveFormAction(session, { ok: true })).toThrow(/not submitted/);
  });

  it('rejects form action with error metadata', () => {
    const session = startFormActionSession({ target: 'storybook8', formId: 'form-11', initial: {} });
    markFormStatusPending(session, 'save');
    const step = rejectFormAction(session, 'validation failed');
    expect(step.state).toBe('rejected');
    expect(step.metadata.rejected).toBe(true);
  });

  it('rejects rejection after resolved', () => {
    const session = startFormActionSession({ target: 'storybook8', formId: 'form-12', initial: {} });
    markFormStatusPending(session, 'save');
    resolveFormAction(session, { ok: true });
    expect(() => rejectFormAction(session, 'late')).toThrow(/cannot reject/);
  });

  it('records history in order', () => {
    const session = startFormActionSession({ target: 'storybook8', formId: 'form-13', initial: {} });
    markFormStatusPending(session, 'save');
    applyOptimisticUpdate(session, { name: 'Ada' });
    resolveFormAction(session, { saved: true });
    expect(session.history.map((step) => step.neutralEvent)).toEqual([
      'form.status_pending',
      'form.optimistic_applied',
      'form.action_resolved',
    ]);
  });
});
