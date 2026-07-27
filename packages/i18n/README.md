# @kiwa-lab/i18n

i18n (translation + locale + interpolation + plural) mock harness for kiwa — next-intl / vue-i18n / react-i18next / Lingui の 4 pattern を in-process で叩く test infra。

## Installation

```bash
pnpm add -D @kiwa-lab/i18n
# or
npm install -D @kiwa-lab/i18n
# or
yarn add -D @kiwa-lab/i18n
```

## Supported providers

| Provider | Status | Interpolation | Plural |
|---|---|---|---|
| next-intl | ✅ | `{{name}}` | Intl.PluralRules |
| vue-i18n | ✅ | `{{name}}` | Intl.PluralRules |
| react-i18next | ✅ | `{{name}}` | Intl.PluralRules |
| Lingui | ✅ | `{{name}}` | Intl.PluralRules |

## Quick start

```ts
import { createI18nClient, interpolate, selectPlural } from '@kiwa-lab/i18n';

const client = createI18nClient({
  provider: 'next-intl',
  locale: 'ja',
  fallbackLocale: 'en',
  messages: {
    ja: { greeting: 'こんにちは {{name}}', items: '{{count}} 個' },
    en: { greeting: 'hello {{name}}', items: '{{count}} items' },
  },
});

const r = client.translate('greeting', { values: { name: 'kiwa' } });
// r = { text: 'こんにちは kiwa', locale: 'ja', used: 'primary' }

client.setLocale('en');
const r2 = client.translate('items', { values: { count: 3 }, count: 3 });

const num = client.formatNumber(1234.5); // Intl.NumberFormat 経由
const cat = selectPlural('en', 1); // 'one'
```

## API reference

- `createI18nClient(options?: CreateI18nClientOptions): I18nClient` — provider + messages + locale で mock 生成
- `I18nClient.translate(key: string, options?: TranslateOptions): TranslateResult` — 翻訳 (missing / fallback / default 判定込み)
- `I18nClient.setLocale(locale: Locale): void` — locale 切替
- `I18nClient.formatNumber(value, options?) / formatDate(value, options?)` — Intl 経由 format
- `interpolate(template, values): InterpolateResult` — `{{key}}` 単独 interpolation
- `translate(input: TranslateInput): TranslateResult` — pure translator (client なし)
- `selectPlural(locale, count): PluralCategory` — Intl.PluralRules 相当

## Test integration

```ts
import { describe, expect, it } from 'vitest';
import { createI18nClient } from '@kiwa-lab/i18n';

describe('greeting locale', () => {
  it('ja locale = 日本語 message', () => {
    const c = createI18nClient({ locale: 'ja', messages: { ja: { hi: 'やあ' } } });
    expect(c.translate('hi').text).toBe('やあ');
  });
});
```

`/kiwa-i18n` skill を起動すると interpolation + plural + fallback + missing 4 経路の test を生成できる。

<!-- kiwa-docs:start -->
## Documentation

公開ドキュメントを正本として管理しています。

- [概要](https://cardene777.github.io/kiwa/libraries/application/i18n/)
- [はじめる](https://cardene777.github.io/kiwa/libraries/application/i18n/quickstart)
- [使い方](https://cardene777.github.io/kiwa/libraries/application/i18n/how-to)
- [リファレンス](https://cardene777.github.io/kiwa/libraries/application/i18n/reference)

編集元は [docs/libraries/application/i18n](../../docs/libraries/application/i18n/) です。
<!-- kiwa-docs:end -->

## License

UNLICENSED — see [cardene777/kiwa](https://github.com/cardene777/kiwa) for repo terms.
