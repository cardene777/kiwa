# @kiwa-lab/i18n の使い方

この手順では、checkout の文言を例に、補間値の欠落を検出し、購入点数で plural を選び、locale を変えた数値と日付を再現可能に format します。翻訳ファイルに文字列があるだけでは不十分です。表示値を作る入力が足りないとき、どの category を選んだとき、locale を変えたときに、利用者が受け取る文字列を固定します。

## checkout の翻訳契約を test にする

次の内容を `tests/checkout.i18n.test.ts` にそのまま保存してください。`interpolate` は不足した変数を空文字へ置き換え、その変数名を `missing` に残します。plural message は `Intl.PluralRules` が返す category を使い、`count` が `values` にないときは自動で補間します。日付では `timeZone` を UTC に固定し、CI の実行場所で値が変わらないようにします。

```ts
import { expect, it } from "vitest";
import {
  createI18nClient,
  interpolate,
  selectPlural,
} from "@kiwa-lab/i18n";

it("checkout の補間、plural、locale 表示を確認する", () => {
  const missingValue = interpolate("Hi \{\{name\}\} at \{\{place\}\}", { name: "kiwa" });
  expect(missingValue).toEqual({
    text: "Hi kiwa at ",
    variables: ["name", "place"],
    missing: ["place"],
  });

  const cart = createI18nClient({
    provider: "react-i18next",
    locale: "en",
    messages: {
      en: {
        cart: { one: "\{\{count\}\} item", other: "\{\{count\}\} items" },
      },
    },
  });
  expect(selectPlural("en", 1)).toBe("one");
  expect(cart.translate("cart", { count: 1 }).text).toBe("1 item");
  expect(cart.translate("cart", { count: 2 }).text).toBe("2 items");

  const display = createI18nClient({ locale: "de-DE" });
  expect(display.formatNumber(1234.5)).toContain("1.234,5");
  expect(display.formatDate(new Date("2026-01-02T00:00:00.000Z"), {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })).toBe("02.01.2026");
});
```

保存後は、この file だけを実行します。

```bash
pnpm exec vitest run tests/checkout.i18n.test.ts
```

成功時には、`place` の不足が見え、英語の一点と複数点で文言が切り替わり、数値と日付がドイツ語 locale で表示されます。補間値が不足したまま画面を出すか、API を reject するかはアプリケーションの責務です。この helper はその判断に必要な不足変数を返すだけです。

## 実際の provider に任せること

`setLocale` はこの client の状態だけを変えます。URL、Cookie、router、server request、翻訳ファイルの lazy load、SSR negotiation、provider component は変更しません。これらは next-intl、vue-i18n、react-i18next、Lingui を実際に起動する統合 test で扱ってください。

locale によって plural category は異なります。対象 locale の message bundle には利用し得る category と少なくとも `other` を用意してください。`\{\{user.name\}\}` のような placeholder は object を辿らないため、`{ "user.name": "Ada" }` のように完全な key を渡します。message の形と戻り値の全契約は [リファレンス](./reference) を参照してください。
