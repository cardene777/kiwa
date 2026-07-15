/**
 * fidelity test — createI18nClient (kiwa mock) が reference impl と同じ挙動を示すことを検証。
 * 5 case で translate / interpolation / plural / fallback / missing の 5 観点を cover。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import { createI18nClient } from '../../src/index.js';

function referenceI18n(messages: Record<string, Record<string, string>>) {
  return {
    translate(key: string, locale: string, values: Record<string, string> = {}) {
      const bundle = messages[locale] ?? messages.en ?? {};
      const raw = bundle[key] ?? key;
      return raw.replace(/\{\{(\w+)\}\}/g, (_, k: string) => values[k] ?? '');
    },
  };
}

describe('i18n client fidelity vs reference impl', () => {
  it('translate api = 基本 lookup が reference と一致', async () => {
    const mock = createI18nClient({
      provider: 'next-intl',
      locale: 'en',
      messages: { en: { greeting: 'Hello, {{name}}!' } },
    });
    const real = referenceI18n({ en: { greeting: 'Hello, {{name}}!' } });
    const result = await assertFidelity({
      mockFn: async (name: string) => mock.translate('greeting', { values: { name } }).text,
      realFn: async (name: string) => real.translate('greeting', 'en', { name }),
      cases: [{ name: 'basic translate', args: ['kiwa'] }],
    });
    expect(result.ratio).toBe(100);
  });

  it('interpolation で {{name}} が正しく置換される', () => {
    const mock = createI18nClient({
      provider: 'vue-i18n',
      locale: 'en',
      messages: { en: { hi: 'Hi {{who}}' } },
    });
    expect(mock.translate('hi', { values: { who: 'kiwa' } }).text).toBe('Hi kiwa');
  });

  it('pluralization で one/other が count で切り替わる', () => {
    const mock = createI18nClient({
      provider: 'react-i18next',
      locale: 'en',
      messages: { en: { items: { one: '1 item', other: '{{count}} items' } } },
    });
    expect(mock.translate('items', { count: 1 }).text).toBe('1 item');
    expect(mock.translate('items', { count: 5 }).text).toBe('5 items');
  });

  it('fallback locale で primary 不在時に fallback が使われる', () => {
    const mock = createI18nClient({
      provider: 'lingui',
      locale: 'ja',
      fallbackLocale: 'en',
      messages: { en: { hello: 'Hello' } },
    });
    const res = mock.translate('hello');
    expect(res.text).toBe('Hello');
    expect(res.used).toBe('fallback');
  });

  it('missing key で default / missing marker が正しく返る', () => {
    const mock = createI18nClient({ provider: 'next-intl', locale: 'en', messages: {} });
    const withDefault = mock.translate('nope', { defaultMessage: 'fallback text' });
    expect(withDefault.text).toBe('fallback text');
    expect(withDefault.used).toBe('default');
    const withoutDefault = mock.translate('nope');
    expect(withoutDefault.used).toBe('missing');
    expect(withoutDefault.missing).toEqual(['nope']);
  });
});

describe('v2.1 resilience primitives (generic)', () => {
  it('withRetry recovers after transient failure and eventually succeeds', async () => {
    const { withRetry } = await import('../../src/index.js');
    let attempts = 0;
    const wrapped = withRetry(async () => {
      attempts += 1;
      if (attempts < 3) throw new Error('flaky');
      return 'ok';
    }, { maxAttempts: 5 });
    expect(await wrapped()).toBe('ok');
    expect(attempts).toBe(3);
  });

  it('withTimeout rejects after ms elapsed', async () => {
    const { withTimeout } = await import('../../src/index.js');
    const wrapped = withTimeout(async () => {
      await new Promise((r) => setTimeout(r, 50));
      return 'never';
    }, { ms: 5 });
    await expect(wrapped()).rejects.toThrow(/timeout/);
  });

  it('withRateLimit throws when exceeding maxRequests', async () => {
    const { withRateLimit } = await import('../../src/index.js');
    const wrapped = withRateLimit(async () => 'ok', { maxRequests: 2, windowMs: 1000 });
    await wrapped();
    await wrapped();
    await expect(wrapped()).rejects.toThrow(/rate limit/);
  });

  it('withCircuitBreaker opens after failureThreshold and rejects further calls', async () => {
    const { withCircuitBreaker } = await import('../../src/index.js');
    const wrapped = withCircuitBreaker(async () => { throw new Error('down'); }, {
      failureThreshold: 2, resetMs: 1000,
    });
    await expect(wrapped()).rejects.toThrow('down');
    await expect(wrapped()).rejects.toThrow('down');
    await expect(wrapped()).rejects.toThrow('circuit breaker open');
  });

  it('withIdempotencyKey returns cached result on duplicate key', async () => {
    const { withIdempotencyKey } = await import('../../src/index.js');
    let counter = 0;
    const wrapped = withIdempotencyKey(async (_key: string) => {
      counter += 1;
      return { id: counter };
    });
    const a = await wrapped('K');
    const b = await wrapped('K');
    expect(a.id).toBe(b.id);
    expect(counter).toBe(1);
  });
});
