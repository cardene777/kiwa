# @kiwa-lab/state

State store mock harness for kiwa — Zustand / Redux / Jotai / Valtio / MobX を統一 interface で invoke する in-process mock。

## API

- `createStore({ provider, initialState })` = 5 provider mock store (get / set / subscribe)
- `dispatch(store, action)` = provider 別 dispatch (Redux reducer / Zustand setter / Jotai atom write / Valtio proxy / MobX action)
- `subscribe(store, listener)` = state 変更通知登録、 unsubscribe 関数返却
- `selectState(store, selector)` = state slice 抽出 (Zustand selector / Redux useSelector 相当)
- `mockAction(name, payload)` = action creator mock (Redux Toolkit createAction 相当)
