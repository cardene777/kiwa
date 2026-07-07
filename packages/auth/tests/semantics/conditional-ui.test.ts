import { describe, expect, it } from 'vitest';
import {
  markTimeout,
  platformEventName,
  selectAutofill,
  showHint,
  startConditionalUi,
  triggerFallback,
  type AuthPlatform,
} from '../../src/semantics/index.js';

const platforms: AuthPlatform[] = ['chromium', 'webkit', 'firefox'];

describe('conditional-ui axis — 3 platform', () => {
  it.each(platforms)('%s: showHint moves to hint-shown', (platform) => {
    const s = startConditionalUi({ platform, formId: 'login' });
    const step = showHint(s);
    expect(step.state).toBe('hint-shown');
    expect(step.neutralEvent).toBe('conditional-ui.hint-shown');
    expect(step.platformEvent).toBe(platformEventName(platform, 'conditional-ui.hint-shown'));
  });

  it('selectAutofill records credentialId and elapsed', () => {
    const s = startConditionalUi({ platform: 'chromium', formId: 'login' });
    showHint(s);
    const step = selectAutofill(s, { credentialId: 'cred-1', elapsedMs: 500 });
    expect(step.state).toBe('autofill-selected');
    expect(step.metadata).toMatchObject({ credentialId: 'cred-1', elapsedMs: 500 });
  });

  it('triggerFallback records reason', () => {
    const s = startConditionalUi({ platform: 'webkit', formId: 'login' });
    showHint(s);
    const step = triggerFallback(s, { reason: 'user-cancel', elapsedMs: 200 });
    expect(step.state).toBe('fallback-triggered');
    expect(step.metadata.reason).toBe('user-cancel');
  });

  it('markTimeout rejects when nowMs < timeoutMs', () => {
    const s = startConditionalUi({ platform: 'firefox', formId: 'login', timeoutMs: 60_000 });
    showHint(s);
    expect(() => markTimeout(s, { nowMs: 30_000 })).toThrow(/< timeoutMs/);
  });

  it('markTimeout succeeds at threshold', () => {
    const s = startConditionalUi({ platform: 'chromium', formId: 'login', timeoutMs: 30_000 });
    showHint(s);
    const step = markTimeout(s, { nowMs: 30_000 });
    expect(step.state).toBe('timeout-exceeded');
  });

  it('showHint rejects double-invocation', () => {
    const s = startConditionalUi({ platform: 'chromium', formId: 'x' });
    showHint(s);
    expect(() => showHint(s)).toThrow(/expected idle/);
  });

  it('selectAutofill rejects when not hint-shown', () => {
    const s = startConditionalUi({ platform: 'chromium', formId: 'x' });
    expect(() => selectAutofill(s, { credentialId: 'c', elapsedMs: 0 })).toThrow(/expected hint/);
  });

  it('default timeoutMs is 60000', () => {
    const s = startConditionalUi({ platform: 'firefox', formId: 'x' });
    expect(s.timeoutMs).toBe(60_000);
  });

  it('history accumulates in order', () => {
    const s = startConditionalUi({ platform: 'webkit', formId: 'login' });
    showHint(s);
    triggerFallback(s, { reason: 'no-credentials', elapsedMs: 100 });
    expect(s.history.map((step) => step.neutralEvent)).toEqual([
      'conditional-ui.hint-shown',
      'conditional-ui.fallback-triggered',
    ]);
  });
});
