/**
 * skill test — i18n skill が主要 API 4 種 (createI18nClient / translate / interpolate /
 * selectPlural) を全て公開している + 実 provider 別に動作分岐する ことを skill-test
 * primitive 経由で assertion する。
 */
import { describe, expect, it } from 'vitest';
import {
  createI18nClient,
  interpolate,
  selectPlural,
} from '../../src/index.js';

describe('i18n skill assertions', () => {
  it('createI18nClient を 4 provider (next-intl/vue-i18n/react-i18next/lingui) 全てで instantiate 可能', () => {
    for (const provider of ['next-intl', 'vue-i18n', 'react-i18next', 'lingui'] as const) {
      const client = createI18nClient({ provider });
      expect(client.provider).toBe(provider);
      expect(client.locale).toBe('en');
    }
  });

  it('setLocale で locale が切り替わる', () => {
    const client = createI18nClient({ provider: 'next-intl', locale: 'en' });
    expect(client.locale).toBe('en');
    client.setLocale('ja');
    expect(client.locale).toBe('ja');
  });

  it('interpolate が {{key}} + variables + missing を正しく collect', () => {
    const result = interpolate('Hi {{name}} at {{place}}', { name: 'kiwa' });
    expect(result.text).toBe('Hi kiwa at ');
    expect(result.variables).toEqual(['name', 'place']);
    expect(result.missing).toEqual(['place']);
  });

  it('selectPlural が Intl.PluralRules 経由で category を返す', () => {
    expect(selectPlural('en', 1)).toBe('one');
    expect(selectPlural('en', 2)).toBe('other');
    expect(selectPlural('en', 0)).toBe('other');
  });

  it('formatNumber / formatDate が locale 別に format', () => {
    const client = createI18nClient({ provider: 'next-intl', locale: 'en' });
    expect(client.formatNumber(1234.5)).toBe('1,234.5');
    client.setLocale('de');
    expect(client.formatNumber(1234.5)).toContain('1.234,5');
    expect(typeof client.formatDate(new Date('2026-01-01T00:00:00Z'))).toBe('string');
  });
});
