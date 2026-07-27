import { expect, it } from 'vitest';
import { createI18nClient, interpolate, selectPlural } from '../src/index.js';

it('documents primary translation, fallback, and an observable missing key', () => {
  const client = createI18nClient({
    provider: 'next-intl', locale: 'ja', fallbackLocale: 'en',
    messages: {
      ja: { login: { greeting: 'こんにちは {{name}}' } },
      en: { login: { greeting: 'Hello {{name}}', forgottenPassword: 'Forgot your password' } },
    },
  });
  expect(client.translate('login.greeting', { values: { name: 'kiwa' } })).toEqual({
    text: 'こんにちは kiwa', locale: 'ja', used: 'primary',
  });
  expect(client.translate('login.forgottenPassword')).toEqual({
    text: 'Forgot your password', locale: 'en', used: 'fallback',
  });
  expect(client.translate('login.submit')).toEqual({
    text: 'login.submit', locale: 'ja', used: 'missing', missing: ['login.submit'],
  });
});

it('documents interpolation failure, plural selection, and reproducible formatting', () => {
  expect(interpolate('Hi {{name}} at {{place}}', { name: 'kiwa' })).toEqual({
    text: 'Hi kiwa at ', variables: ['name', 'place'], missing: ['place'],
  });
  const cart = createI18nClient({
    locale: 'en', messages: { en: { cart: { one: '{{count}} item', other: '{{count}} items' } } },
  });
  expect(selectPlural('en', 1)).toBe('one');
  expect(cart.translate('cart', { count: 1 }).text).toBe('1 item');
  expect(cart.translate('cart', { count: 2 }).text).toBe('2 items');

  const display = createI18nClient({ locale: 'de-DE' });
  expect(display.formatNumber(1234.5)).toContain('1.234,5');
  expect(display.formatDate(new Date('2026-01-02T00:00:00.000Z'), {
    timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit',
  })).toBe('02.01.2026');
});
