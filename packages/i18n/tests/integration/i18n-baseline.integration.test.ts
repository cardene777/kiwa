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
