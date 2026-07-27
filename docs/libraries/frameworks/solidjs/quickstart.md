# @kiwa-lab/solidjs を始める

`@kiwa-lab/solidjs` は Signal と Effect の依存関係を in-memory で確認する test adapter です。この Quickstart では、count を更新すると effect が一度だけ再実行され、dispose 後の更新は観測されないことを test します。実 Solid runtime や DOM は起動しません。

## 準備

```bash
pnpm add -D @kiwa-lab/solidjs vitest
```

## 実行

```ts
import { expect, test } from "vitest";
import { mockEffect, mockSignal } from "@kiwa-lab/solidjs";

test("Signal の更新で Effect が再実行される", () => {
  const [count, setCount] = mockSignal(0);
  let observed = -1;
  const effect = mockEffect(() => { observed = count(); });
  setCount(5);

  expect(observed).toBe(5);
  expect(effect.runCount()).toBe(2);

  effect.dispose();
  setCount(6);
  expect(observed).toBe(5);
});
```

## 確認

この例を `tests/count.solidjs.test.ts` に保存して、次を実行します。

```bash
pnpm exec vitest run tests/count.solidjs.test.ts
```

成功時は一件の test が pass します。`observed` が `5` にならない場合は、effect の callback 内で `count()` を読んでいるかを確認してください。getter を読まない effect はその signal を購読しません。複数更新を一度の effect 実行にまとめるには `batch` を使います。

同じ値を setter に渡すと `Object.is` 判定で effect は再実行されません。`mockEffect` は作成直後に一回実行され、`trace` で各 run の読み取り値を確認できます。上の `effect.dispose()` はこの effect のみを停止します。

## テストを隔離する

Signal と Effect は作成順を持ちます。`mockEffect` の戻り値、または `createRoot` の戻り値にある `dispose()` をケースの終わりに呼び、観測結果を次のケースへ残さないでください。
<!-- skill-guide -->
## skill との使い分け

この library には package 固有の companion skill はありません。まずこの Quickstart の code を test に書き、入力から結果までの境界を直接確認してください。仕様から unit test の下書きを作る場合は、初回だけ Claude Code で plugin を導入します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

次に対象 module を指定して、設計と Vitest の下書きを作ります。

```text
/kiwa:kiwa-design --layer unit --module account
/kiwa:kiwa-vitest --module account
```

生成物を確認して `mockSignal` の入力、期待する effect の run 回数、dispose 後の結果を仕様に合わせて書き換えます。その後は `pnpm exec vitest run` で実行します。専用 skill がないことは、実サービスの挙動を推測する生成物より、この library の公開 API と実装した test を先に確認するためです。
