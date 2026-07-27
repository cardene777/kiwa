# 生成した仕様と実装を検証する

状態機械を運用するときは、表が完全か、Lean がその表を検査できたか、実装が表どおりかを分けて確認します。三つを一つの成功フラグにまとめると、Lean が未導入だったことや実装だけが変わったことを見落とします。

次の内容全体を `tests/checkout-machine.test.ts` に保存します。全セルを明記した表、実装を観測する reducer、表との conformance を一つの file に置きます。Lean を使う CI job では、末尾の test のコメントを外して実行してください。

```ts
import { expect, it } from "vitest";
import {
  checkConformance,
  formatConformance,
  generateLeanSpec,
  verifyLeanSpec,
} from "@kiwa-lab/lean";

const checkout = {
  moduleName: "Checkout",
  namespace: "Checkout",
  states: ["draft", "paid", "cancelled"],
  events: ["pay", "cancel"],
  transitions: [
    { from: "draft", event: "pay", to: "paid" },
    { from: "draft", event: "cancel", to: "cancelled" },
    { from: "paid", event: "pay", invalid: true },
    { from: "paid", event: "cancel", invalid: true },
    { from: "cancelled", event: "pay", invalid: true },
    { from: "cancelled", event: "cancel", invalid: true },
  ],
  initial: "draft",
  terminal: ["paid", "cancelled"],
} as const;

function reduceCheckout(
  state: { status: string },
  event: { type: string },
): { status: string; rejected?: boolean } {
  if (state.status === "draft" && event.type === "pay") return { status: "paid" };
  if (state.status === "draft" && event.type === "cancel") return { status: "cancelled" };
  return { status: state.status, rejected: true };
}

it("requires a complete table and matches every implementation cell", () => {
  const generated = generateLeanSpec(checkout);
  expect(generated.meta).toMatchObject({
    cellCount: 6,
    validTransitionCount: 2,
    invalidTransitionCount: 4,
  });

  const report = checkConformance(checkout, (state, event) => {
    const result = reduceCheckout({ status: state }, { type: event });
    return result.rejected
      ? { kind: "rejected" }
      : { kind: "to", state: result.status };
  });

  if (!report.ok) throw new Error(formatConformance(checkout, report));
  expect(report).toMatchObject({ ok: true, checked: 6 });
});

// Run this test only in a CI job where `lean --version` succeeds.
it.skip("asks Lean to elaborate the generated specification", () => {
  const result = verifyLeanSpec([generateLeanSpec(checkout)], {
    leanToolchain: "leanprover/lean4:v4.15.0",
    timeoutMs: 60_000,
  });

  expect(result.status).toBe("ok");
});
```

## 表の書き漏れを止める

既定の `unspecified` は `error` です。状態または event を増やしたら、全 cell を遷移または `invalid: true` として記述します。たとえば `paid + cancel` を省くと `generateLeanSpec(checkout)` は未決定の cell を示して失敗します。多くの cell を拒否する大きな表では `unspecified: "invalid"` を選べますが、未記入をすべて拒否するという設計判断になります。変更頻度の高い機械では既定の `error` のほうが安全です。

`initial` は到達性も検査します。状態へ移る遷移を消したまま名前だけを残すと、生成時に到達できない状態として止まります。`terminal` は単なる label ではなく、すべての event を拒否するという表の性質との照合です。受理する自己遷移が一つでもあれば終端状態ではありません。

## Lean の CI job を分ける

`verifyLeanSpec` は例外ではなく status を返します。必須の Lean job では `ok` だけを通します。`lean-not-installed` は toolchain 不在、`skipped-by-env` は `KIWA_LEAN_SKIP_VERIFY=1` または `skip: true`、`timed-out` と `output-too-large` は結果を取得できなかった状態です。これらを `ok` の代わりに許可してはいけません。offline job が必要なら、skip する job と `ok` を必須にする job を分けます。

`verification-failed` では `result.diagnostics` を build log に出してください。Lean の診断は stdout に出ることがあるため、stderr だけでは原因を特定できません。timeout を無制限に増やす前に、状態数、event 数、生成している仕様数を見直します。

`checkConformance` は `states × events` 回 observer を呼びます。前の cell の状態を使い回さず、例のように各呼び出しで新しい state を渡してください。`disagreements` には `impl-rejects`、`impl-accepts`、`different-target`、`unknown-state` が入ります。状態表の網羅性と reducer の一致は確認できますが、並行実行、永続化失敗、認可、UI 操作性は別の test で扱います。

## 実行する

```bash
pnpm exec vitest run tests/checkout-machine.test.ts
```
