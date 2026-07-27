---
name: kiwa-state
description: |
  @kiwa-lab/state (Zustand / Redux / Jotai / Valtio / MobX 統一 mock harness) を使った state store test 生成 skill。
  `createStore({ provider, initialState })` で 5 provider mock store を立て、 `dispatch` / `subscribe` / `selectState` / `mockAction` で 5 provider 別 store 挙動 (Redux reducer / Zustand setter / Jotai atom / Valtio proxy / MobX action) を統一 shape で verify できる。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-state — state store test 生成

`@kiwa-lab/state` の 5 provider (Zustand / Redux / Jotai / Valtio / MobX) 統一 mock を使った state test を Vitest 形式で生成する。

## 目的

state store を「provider を差し替えても同じ挙動を担保する」 test で書く。 provider 別 API (Redux reducer / Zustand setter / Jotai atom / Valtio proxy / MobX action) を吸収した抽象で test 化する。

## 前提

- `pnpm add -D @kiwa-lab/state` install 済
- Vitest 環境
- 対象 module に state store 依存が存在

## オプション

- `--module {name}` — test 対象 module
- `--provider {zustand|redux|jotai|valtio|mobx}` — 主要 provider
- `--output {path}` — 生成 test path

## 実行フロー

### Step 1: dispatch + subscribe workflow test 生成

`createStore({ provider, initialState: { count: 0 } })` で store を作り、`const increment = mockAction<number>('increment')` で action creator を用意します。`subscribe(store, listener)` を登録してから `dispatch(store, increment(1))` を実行し、通知、更新前後の state、version を assertion します。必要なら 5 provider を `it.each` で確認します。

### Step 2: selectState slice test 生成

`selectState(store, s => s.user.name)` で現在 state の slice を一度取得します。`selectState` は memoization や listener の依存追跡を行わないため、selector reference の安定性や依存しない更新での再描画抑止は実 provider の component test で確認します。

### Step 3: unsubscribe + cleanup test 生成

subscribe 返却 unsubscribe を呼出後、 dispatch しても listener 未呼出 = 正しくクリーンアップされた verify。

## 使用例

```bash
/kiwa-state --module cart --output tests/integration/cart.state.test.ts
/kiwa-state --module theme --provider zustand
```
