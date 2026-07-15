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

`createStore({ provider, initialState: { count: 0 } })` で store を立て、 `dispatch(store, mockAction('increment', 1))` → `subscribe(store, listener)` で state 変更通知 + 前後 state を assert。 5 provider を it.each で回す。

### Step 2: selectState slice test 生成

`selectState(store, s => s.user.name)` で slice 抽出、 memoization 挙動 (selector reference 安定) + 依存しない state 変更で listener 未発火の verify。

### Step 3: unsubscribe + cleanup test 生成

subscribe 返却 unsubscribe を呼出後、 dispatch しても listener 未呼出 = 正しくクリーンアップされた verify。

## 使用例

```bash
/kiwa-state --module cart --output tests/integration/cart.state.test.ts
/kiwa-state --module theme --provider zustand
```
