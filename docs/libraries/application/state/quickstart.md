# @kiwa-lab/state をはじめる

このチュートリアルでは Redux 形式の reducer を持つ store を作り、dispatch 前後の state、subscription、action creator を同じ test file で確認します。

## インストール

```bash
pnpm add -D @kiwa-lab/state vitest
```

## reducer と通知を確認する

`tests/kiwa/state.test.ts` を作り、次の内容をそのまま保存します。

```ts
import { describe, expect, it } from "vitest";
import { createStore, dispatch, mockAction, subscribe } from "@kiwa-lab/state";

describe("counter state", () => {
  it("updates state, notifies once, and recognizes a reset action", () => {
    const add = mockAction<number>("add");
    const reset = mockAction("reset");
    const store = createStore({
      provider: "redux",
      initialState: { count: 0 },
      reducer: (state, action) =>
        action.type === add.type ? { count: state.count + Number(action.payload) } : state,
    });
    const seen: number[] = [];
    const subscription = subscribe(store, (state) => seen.push(state.count));

    const result = dispatch(store, add(3));
    subscription.unsubscribe();

    expect(result).toMatchObject({
      action: { type: "add", payload: 3 },
      prevState: { count: 0 },
      nextState: { count: 3 },
      version: 1,
    });
    expect(seen).toEqual([3]);
    expect(subscription.callCount()).toBe(1);
    expect(reset()).toEqual({ type: "reset" });
    expect(reset.match({ type: "reset" })).toBe(true);
  });
});
```

次の command は作成した file だけを実行します。

```bash
pnpm exec vitest run tests/kiwa/state.test.ts
```

reducer は受け取った prev state から次の state を返します。store はその戻り値を shallow merge するため、reducer の戻り値が partial object でも既存の top-level field を保持します。`mockAction(name)` は type、action creator、type を比較する `match` を返します。payload を省略すると action には payload field がありません。

実 provider の hook、proxy、devtools、render 回数はこの harness の対象外です。reducer なしの更新、解除漏れ、persistence は [使い方](./how-to) を確認してください。

## skill で test を作る

この library には `/kiwa:kiwa-state` という companion skill があります。初回だけ kiwa plugin を導入し、この Quickstart の package 導入も済ませてください。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

skill は library の挙動を実行時に置き換えるものではなく、確認したい state 境界を test の形にする入口です。

```text
/kiwa:kiwa-state --module cart --output tests/integration/cart.state.test.ts
```

生成後は `tests/integration/cart.state.test.ts` を読み、Quickstart と同じ成功条件・失敗条件が期待値になっていることを確認してから、その file だけを実行します。

```bash
pnpm exec vitest run tests/integration/cart.state.test.ts
```

provider や対象の種類、出力先を変える引数は [skill の仕様](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-state/SKILL.md) を参照してください。
