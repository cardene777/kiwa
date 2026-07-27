# @kiwa-lab/i18n をはじめる

`@kiwa-lab/i18n` は、画面を起動せずに翻訳 lookup の契約を test する harness です。この Quickstart では、ログイン画面の挨拶を日本語で表示し、日本語にない key は英語へ fallback することを確認します。翻訳が見つからなかった経路も戻り値に残るため、表示された文字だけでは見落としやすい翻訳漏れを CI で検出できます。

next-intl、vue-i18n、react-i18next、Lingui の SDK を起動する package ではありません。provider 名は採用している SDK を表すタグです。SSR の locale negotiation、翻訳ファイルの読み込み、React や Vue の component は統合テストで検証します。

## 用意するもの

package と Vitest を追加します。すでに Vitest があるプロジェクトでは、i18n package だけを追加してください。

```bash
pnpm add -D @kiwa-lab/i18n vitest
```

次に `tests/login-i18n.test.ts` を作ります。メッセージは locale ごとの object で渡し、入れ子の key は dot notation で参照できます。

## 翻訳と fallback を test する

```ts
import { expect, it } from "vitest";
import { createI18nClient } from "@kiwa-lab/i18n";

it("日本語を優先し、なければ英語を使う", () => {
  const client = createI18nClient({
    provider: "next-intl",
    locale: "ja",
    fallbackLocale: "en",
    messages: {
      ja: { login: { greeting: "こんにちは \{\{name\}\}" } },
      en: {
        login: {
          greeting: "Hello \{\{name\}\}",
          forgottenPassword: "Forgot your password",
        },
      },
    },
  });

  expect(client.translate("login.greeting", { values: { name: "kiwa" } })).toEqual({
    text: "こんにちは kiwa",
    locale: "ja",
    used: "primary",
  });
  expect(client.translate("login.forgottenPassword")).toEqual({
    text: "Forgot your password",
    locale: "en",
    used: "fallback",
  });
  expect(client.translate("login.submit")).toEqual({
    text: "login.submit",
    locale: "ja",
    used: "missing",
    missing: ["login.submit"],
  });
});
```

最初の呼び出しは `ja` のメッセージを使います。二つ目は `ja` に key がないため `en` を使い、`used` は `fallback` になります。三つ目はどちらにもない key です。画面には key が表示されますが、`missing` を assertion に含めることで、翻訳漏れを意図した状態として扱えます。

## 実行して結果を確認する

```bash
pnpm exec vitest run tests/login-i18n.test.ts
```

成功すると一件の test が pass します。期待と異なる locale が返るときは、`locale`、`fallbackLocale`、メッセージ object の階層が key と一致しているかを順に見ます。`setLocale` はこの client の状態だけを変え、URL、Cookie、router、サーバー request の locale は変えません。

## skill で test の下書きを作る

`/kiwa:kiwa-i18n` で test の下書きを生成できます。初回だけ kiwa plugin を導入してから使います。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

plugin の導入方法と更新方法は [kiwa の skill を使う](../../../guides/skills) にもまとめています。

```text
/kiwa:kiwa-i18n --module login-form --provider next-intl --output tests/integration/login-form.i18n.test.ts
```

生成された test には、実際にサポートする locale、fallback の有無、許可する default message を反映してください。次の command で実行し、missing key を意図せず default message で隠していないことを確認します。

```bash
pnpm exec vitest run tests/integration/login-form.i18n.test.ts
```

## 次に進む

補間漏れ、複数形、`Intl` による数値と日付の表示は [使い方](./how-to) で扱います。すべての戻り値は [リファレンス](./reference) にあります。
