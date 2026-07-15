# @kiwa-lab/state API reference

## Overview

`@kiwa-lab/state` は Zustand / Redux / Jotai / Valtio / MobX 5 store を統一 interface で mock する state management test infra。 action dispatch + subscribe + selector を統一 shape で verify する。

## Supported providers

| provider | store model | action pattern | reactivity |
|---|---|---|---|
| zustand | plain object + setter | function call | selector-based |
| redux | reducer + action | typed action | connect / useSelector |
| jotai | atom (getter/setter) | atom.set | atom subscription |
| valtio | proxy | direct mutation | proxy trap |
| mobx | observable class | @action | autorun / computed |

## Main API

### `createStore(options: StateStoreOptions): StateStore`

provider 別 mock store、 `{ provider, initialState, reducer?, actions? }` config。

### `dispatch(store, action: Action): DispatchResult`

action を dispatch、 `{ before, after, elapsedMs }`。 Redux = reducer 実行、 Zustand = setter 呼出、 Jotai = atom.set、 Valtio = proxy write、 MobX = @action invoke。

### `subscribe(store, listener): Subscription`

state 変更を subscribe、 `.unsubscribe()` で断。 各 provider の native subscription を統一 shape で。

### `selectState<T>(store, selector: Selector<T>): T`

state 部分を select、 provider 別 selector pattern を吸収。

### `mockAction(type, payload?): MockActionCreator`

action creator を mock 化、 test で「特定 action が dispatch された」 を verify するために使う。

## Types

- `StateProvider = 'zustand' | 'redux' | 'jotai' | 'valtio' | 'mobx'`
- `Action` = `{ type: string, payload?: any }`
- `Selector<T>` = `(state: any) => T`
- `StateSnapshot` = `{ provider, state, timestamp }`
- `StateListener` = `(state, prevState) => void`

## Usage examples

### Zustand store test

```typescript
import { createStore, dispatch, selectState } from '@kiwa-lab/state';
import { describe, expect, it } from 'vitest';

describe('cart store (zustand)', () => {
  it('addItem action で items が increment', () => {
    const store = createStore({ provider: 'zustand', initialState: { items: [] } });
    dispatch(store, { type: 'addItem', payload: { id: 'p-1', qty: 2 } });
    const items = selectState(store, (s) => s.items);
    expect(items).toEqual([{ id: 'p-1', qty: 2 }]);
  });
});
```

### Redux + subscribe

```typescript
import { createStore, dispatch, subscribe } from '@kiwa-lab/state';

const store = createStore({
  provider: 'redux',
  initialState: { count: 0 },
  reducer: (state, action) => (action.type === 'inc' ? { count: state.count + 1 } : state),
});
const changes: number[] = [];
const sub = subscribe(store, (s) => changes.push(s.count));
dispatch(store, { type: 'inc' });
dispatch(store, { type: 'inc' });
sub.unsubscribe();
expect(changes).toEqual([1, 2]);
```

## Related skills

- [`/kiwa-state`](../skills/kiwa-state) — state store test 生成 skill
