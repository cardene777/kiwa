import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import type { AuthPlatform } from '../src/adapters/interface.js';

const platforms: AuthPlatform[] = ['chromium', 'webkit', 'firefox'];

describe('conditional-ui axis — mock adapter', () => {
  it.each(platforms)('%s: startConditionalUiFlow assigns session', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startConditionalUiFlow({ platform, userId: 'u-1', formId: 'login' });
    expect(s.sessionId).toMatch(/^ui-\d+$/);
  });

  it.each(platforms)('%s: showAutofillHint emits hint-shown', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startConditionalUiFlow({ platform, userId: 'u-1', formId: 'login' });
    const step = await adapter.showAutofillHint(s);
    expect(step.metadata.neutralEvent).toBe('conditional-ui.hint-shown');
  });

  it('completeAutofill records credential + elapsed', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startConditionalUiFlow({
      platform: 'chromium',
      userId: 'u-1',
      formId: 'login',
    });
    await adapter.showAutofillHint(s);
    const step = await adapter.completeAutofill(s, { credentialId: 'cred-1', elapsedMs: 500 });
    expect(step.metadata.credentialId).toBe('cred-1');
    expect(step.metadata.elapsedMs).toBe(500);
    expect(step.metadata.neutralEvent).toBe('conditional-ui.autofill-selected');
  });

  it('showAutofillHint rejects unknown session', async () => {
    const adapter = makeMockAdapter();
    await expect(
      adapter.showAutofillHint({ sessionId: 'nope', platform: 'chromium', userId: 'u' }),
    ).rejects.toThrow(/unknown sessionId/);
  });

  it('closeConditionalUi removes session', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startConditionalUiFlow({
      platform: 'webkit',
      userId: 'u-1',
      formId: 'login',
    });
    await adapter.closeConditionalUi(s);
    await expect(adapter.showAutofillHint(s)).rejects.toThrow(/unknown sessionId/);
  });
});

describe('conditional-ui axis — real adapter env-gate', () => {
  it.each(platforms)('%s: showAutofillHint reports env-missing', async (platform) => {
    const adapter = makeRealAdapter();
    const s = await adapter.startConditionalUiFlow({ platform, userId: 'u-1', formId: 'login' });
    const step = await adapter.showAutofillHint(s);
    expect(step.outcome).toBe('env-missing');
  });

  it('completeAutofill reports env-missing', async () => {
    const adapter = makeRealAdapter();
    const s = await adapter.startConditionalUiFlow({
      platform: 'chromium',
      userId: 'u-1',
      formId: 'login',
    });
    const step = await adapter.completeAutofill(s, { credentialId: 'c', elapsedMs: 100 });
    expect(step.outcome).toBe('env-missing');
  });
});
