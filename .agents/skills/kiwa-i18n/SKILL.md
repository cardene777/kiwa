---
name: kiwa-i18n
description: |
  @kiwa-lab/i18n (next-intl / vue-i18n / react-i18next / Lingui 統一 mock harness) を使った i18n 経路の test 生成 skill。
  `createI18nClient` + `translate` で interpolation ({{name}}) + pluralization (one/other/few/many) + fallback locale、 `formatNumber` / `formatDate` で provider 別 formatting を in-process で叩ける。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-i18n — i18n translation / format test 生成

`@kiwa-lab/i18n` の 4 provider (next-intl / vue-i18n / react-i18next / Lingui) 統一 mock を使った i18n test を Vitest 形式で生成する。 real i18n SDK 不要で translation / interpolation / pluralization / locale switch の test を書く。

## 目的

multi-lang app で「translation key → locale 選択 → interpolation / plural 適用 → 出力文字列」 の path を verify する。 missing key の fallback locale 挙動、 date/number formatting の locale 差 (JP `¥1,000` / US `$1,000`) を吸収した抽象。

## 前提

- `pnpm add -D @kiwa-lab/i18n` install 済
- Vitest 環境
- 対象 module に i18n 経路 (React `useTranslations` / Vue `$t` / server render 等) が存在

## オプション

- `--module {name}` — test 対象 module (login-form / product-list / checkout 等)
- `--provider {next-intl|vue-i18n|react-i18next|lingui}` — 主要 provider (省略時 = 4 provider 全対応)
- `--output {path}` — 生成 test の path

## 実行フロー

### Step 1: translation + interpolation test 生成

`createI18nClient({ provider, locale: 'en', fallbackLocale: 'en', messages: { en: { greeting: 'Hello {{name}}' } } })` で client を作り、`client.translate('greeting', { values: { name: 'kiwa' } })` の `text` と `used` を assertion します。不足した補間値が `missing` に残ることも確認します。

### Step 2: pluralization test 生成

`client.translate('items', { count })` で message を選び、`selectPlural(locale, count)` と結果の text を `it.each` で確認します。対象 locale が返す plural category を message bundle に用意し、未定義の category は `other` で補います。

### Step 3: locale switch + formatting test 生成

`client.setLocale('ja')` の後に `client.translate` が日本語訳を返すことを確認します。数値と日付は locale を切り替えた client の `formatNumber(1234.5, { style: 'currency', currency: 'JPY' })` と `formatDate(date, { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' })` で検証します。日時 test では timezone を固定します。

## 使用例

```bash
/kiwa-i18n --module login-form --provider next-intl
/kiwa-i18n --module checkout --output tests/integration/checkout.i18n.test.ts
```
