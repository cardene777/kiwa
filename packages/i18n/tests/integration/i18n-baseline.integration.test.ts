/**
 * integration test — i18n domain の end-to-end workflow (client 作成 → locale 切替 →
 * translate + interpolation + plural + fallback → recorded 確認) を 5 case で cover。
 */
import { describe, expect, it } from 'vitest';
import { createI18nClient } from '../../src/index.js';

const MESSAGES = {
  en: {
    greeting: 'Hello, {{name}}!',
    cart: { one: '1 item in cart', other: '{{count}} items in cart' },
    nested: { deep: { key: 'deep value {{v}}' } },
  },
  ja: {
    greeting: 'こんにちは、 {{name}}さん!',
    cart: { other: 'カートに {{count}} 個' },
  },
};

describe('i18n integration — client → locale switch → translate workflow', () => {
  it('T-INT-I-001 client 作成 → translate → recorded に result が積まれる', () => {
    const client = createI18nClient({ provider: 'next-intl', locale: 'en', messages: MESSAGES });
    const res = client.translate('greeting', { values: { name: 'kiwa' } });
    expect(res.text).toBe('Hello, kiwa!');
    expect(res.used).toBe('primary');
    expect(client.listRecorded().length).toBe(1);
  });

  it('T-INT-I-002 setLocale で translate 出力が切り替わる', () => {
    const client = createI18nClient({ provider: 'vue-i18n', locale: 'en', messages: MESSAGES });
    expect(client.translate('greeting', { values: { name: 'k' } }).text).toBe('Hello, k!');
    client.setLocale('ja');
    expect(client.translate('greeting', { values: { name: 'k' } }).text).toBe('こんにちは、 kさん!');
  });

  it('T-INT-I-003 pluralization で count に応じた bundle が選ばれる', () => {
    const client = createI18nClient({ provider: 'react-i18next', locale: 'en', messages: MESSAGES });
    expect(client.translate('cart', { count: 1 }).text).toBe('1 item in cart');
    expect(client.translate('cart', { count: 3 }).text).toBe('3 items in cart');
  });

  it('T-INT-I-004 nested key ("nested.deep.key") が dotted access で解決', () => {
    const client = createI18nClient({ provider: 'lingui', locale: 'en', messages: MESSAGES });
    const res = client.translate('nested.deep.key', { values: { v: '42' } });
    expect(res.text).toBe('deep value 42');
    expect(res.used).toBe('primary');
  });

  it('T-INT-I-005 fallback + missing + clear の連鎖', () => {
    const client = createI18nClient({
      provider: 'next-intl',
      locale: 'ja',
      fallbackLocale: 'en',
      messages: { en: { only: 'only en' } },
    });
    const fallback = client.translate('only');
    expect(fallback.used).toBe('fallback');
    const missing = client.translate('nope');
    expect(missing.used).toBe('missing');
    expect(client.listRecorded().length).toBe(2);
    client.clear();
    expect(client.listRecorded().length).toBe(0);
  });
});

describe('v2.1 resilience integration', () => {
  it('T-INT-V21-001 batchOperate runs items in parallel with per-item error isolation', async () => {
    const { batchOperate } = await import('../../src/index.js');
    const results = await batchOperate(
      [{ name: 'a', input: 1 }, { name: 'b', input: 2 }, { name: 'c', input: 3 }],
      async (item) => {
        if (item.name === 'b') throw new Error('bad');
        return (item.input as number) * 10;
      },
    );
    expect(results.filter((r) => r.ok).length).toBe(2);
    expect(results.filter((r) => !r.ok).length).toBe(1);
  });

  it('T-INT-V21-002 withRetry + withTimeout can be composed', async () => {
    const { withRetry, withTimeout } = await import('../../src/index.js');
    let calls = 0;
    const slow = async () => {
      calls += 1;
      await new Promise((r) => setTimeout(r, 20));
      return 'done';
    };
    const wrapped = withRetry(withTimeout(slow, { ms: 5 }), { maxAttempts: 2 });
    await expect(wrapped()).rejects.toThrow(/timeout/);
    expect(calls).toBe(2);
  });

  it('T-INT-V21-003 withObservability fires start/success hooks in order', async () => {
    const { withObservability } = await import('../../src/index.js');
    const events: string[] = [];
    const wrapped = withObservability('op', async () => 'ok', {
      onStart: () => events.push('start'),
      onSuccess: () => events.push('success'),
    });
    await wrapped();
    expect(events).toEqual(['start', 'success']);
  });

  it('T-INT-V21-004 withObservability captures error path', async () => {
    const { withObservability } = await import('../../src/index.js');
    const events: string[] = [];
    const wrapped = withObservability('op', async () => { throw new Error('nope'); }, {
      onStart: () => events.push('start'),
      onError: () => events.push('error'),
    });
    await expect(wrapped()).rejects.toThrow('nope');
    expect(events).toEqual(['start', 'error']);
  });

  it('T-INT-V21-005 withRetry retryOn callback conditionally suppresses retry', async () => {
    const { withRetry } = await import('../../src/index.js');
    let calls = 0;
    const wrapped = withRetry(async () => {
      calls += 1;
      throw new Error('fatal');
    }, { maxAttempts: 5, retryOn: (err) => (err as Error).message !== 'fatal' });
    await expect(wrapped()).rejects.toThrow('fatal');
    expect(calls).toBe(1);
  });
});
