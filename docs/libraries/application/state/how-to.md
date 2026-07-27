# @kiwa-lab/state の使い方

Quickstart の store 作成に続き、reducer による複数 action、subscription の後始末、in-memory persistence を一つの file で確認します。store の更新と通知は同期的で、UI framework の render を待つ機能はありません。

## 更新、解除、復元を確認する

`tests/cart.state.how-to.test.ts` を作り、次の内容をそのまま保存します。

```ts
import { describe, expect, it } from "vitest";
import {
  createMemoryPersistence,
  createPersistedStore,
  createStore,
  dispatch,
  mockAction,
  subscribe,
} from "@kiwa-lab/state";

describe("state lifecycle", () => {
  it("keeps actions separate in a reducer", () => {
    const setUser = mockAction<{ name: string }>("setUser");
    const setTheme = mockAction<string>("setTheme");
    const store = createStore({
      provider: "redux",
      initialState: { user: "", theme: "light" },
      reducer: (state, action) => {
        if (setUser.match(action)) {
          const payload = action.payload as { name: string };
          return { ...state, user: payload.name };
        }
        if (setTheme.match(action)) return { ...state, theme: String(action.payload) };
        return state;
      },
    });

    dispatch(store, setUser({ name: "kiwa" }));
    dispatch(store, setTheme("dark"));

    expect(store.getState()).toEqual({ user: "kiwa", theme: "dark" });
  });

  it("does not notify an unsubscribed listener", () => {
    const store = createStore({ provider: "zustand", initialState: { count: 0 } });
    const calls: number[] = [];
    const subscription = subscribe(store, (state) => calls.push(state.count));

    store.setState({ count: 1 });
    subscription.unsubscribe();
    store.setState({ count: 2 });

    expect(calls).toEqual([1]);
    expect(subscription.callCount()).toBe(1);
  });

  it("restores and clears an in-memory persisted value", async () => {
    const persistence = createMemoryPersistence();
    const cart = createPersistedStore<{ count: number }>("cart", persistence);

    await cart.save({ count: 2 });
    expect(await cart.restore()).toEqual({ count: 2 });
    await cart.clear();
    expect(await cart.restore()).toBeUndefined();
  });
});
```

次の command は、作成した file だけを実行します。

```bash
pnpm exec vitest run tests/cart.state.how-to.test.ts
```

reducer がない store は object payload だけを shallow merge します。nested object は deep merge されないため、nested field を変える場合は新しい object を返します。`subscribe` は登録時には listener を呼ばず、state が変わった瞬間に同期で通知します。同じ callback を複数回登録するとそれぞれが通知されるため、test ごとに store を作るか、すべての subscription を解除してください。

memory adapter は browser storage へ保存しません。LocalStorage、AsyncStorage、暗号化や migration が必要な場合は、同じ interface を実装する adapter とその統合 test を用意します。`selectState` は現在 state に selector を一度適用するだけで、memoization や UI 再描画は担当しません。provider の selector hook は component test で確認してください。
