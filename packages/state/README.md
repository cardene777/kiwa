# @kiwa-lab/state

State store mock harness for kiwa — Zustand / Redux / Jotai / Valtio / MobX を統一 interface で in-process から叩ける test infra。

## Installation

```bash
pnpm add -D @kiwa-lab/state
# or
npm install -D @kiwa-lab/state
# or
yarn add -D @kiwa-lab/state
```

## Supported providers

| Provider | Status | Model |
|---|---|---|
| Zustand | ✅ Ready | setter closure |
| Redux | ✅ Ready | reducer + action |
| Jotai | ✅ Ready | atom |
| Valtio | ✅ Ready | proxy |
| MobX | ✅ Ready | observable + action |

## Quick start

```ts
import { describe, expect, it } from 'vitest';
import {
  createStore,
  dispatch,
  subscribe,
  selectState,
} from '@kiwa-lab/state';

describe('counter store', () => {
  it('increment action で count が 1 増える', () => {
    const store = createStore({ provider: 'redux', initialState: { count: 0 } });
    const listener = subscribe(store, (s) => s);
    dispatch(store, { type: 'increment', payload: 1 });
    expect(selectState(store, (s) => s.count)).toBe(1);
    expect(listener.calls.length).toBe(1);
  });
});
```

## API reference

- `createStore({ provider: StateProvider, initialState }): StateStore` — provider 別 store instance
- `dispatch(store, action: Action): DispatchResult` — Redux/Zustand/MobX action 発火
- `subscribe(store, listener: StateListener): Subscription` — state 変更 subscribe + trace
- `selectState(store, selector: Selector): unknown` — Jotai/Valtio selector 相当
- `mockAction(store, creator: MockActionCreator): Action` — test fixture action 生成

## Test integration

vitest + `/kiwa-state` skill で 5 provider の store 挙動差 (reducer / setter / atom / proxy / observable) を統一 shape で verify。

## License

UNLICENSED — see [github.com/cardene777/kiwa](https://github.com/cardene777/kiwa).
