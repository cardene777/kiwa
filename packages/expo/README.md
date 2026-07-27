# @kiwa-lab/expo

Expo SDK mock harness for kiwa — Expo Router / SecureStore / Notifications / FileSystem / Camera を統一 interface で in-process から叩ける test infra。

## Installation

```bash
pnpm add -D @kiwa-lab/expo
# or
npm install -D @kiwa-lab/expo
# or
yarn add -D @kiwa-lab/expo
```

## Supported providers

| SDK | Status | Primary API |
|---|---|---|
| Expo Router | ✅ Ready | `mockExpoRouter` |
| SecureStore | ✅ Ready | `mockSecureStore` |
| Notifications | ✅ Ready | `dispatchNotification` |
| FileSystem | ✅ Ready | `mockFileSystem` |
| Camera | ✅ Ready | `mockCamera` |

## Quick start

```ts
import { describe, expect, it } from 'vitest';
import {
  createExpoTestEnv,
  mockExpoRouter,
  mockSecureStore,
  dispatchNotification,
} from '@kiwa-lab/expo';

describe('expo push flow', () => {
  it('secure token 保存 + notification tap で /orders へ遷移', async () => {
    const env = createExpoTestEnv();
    const store = mockSecureStore({});
    const router = mockExpoRouter({ initial: '/' });
    await store.setItemAsync('sessionToken', 's-1');
    dispatchNotification({ title: 'Order', body: 'ready', data: { path: '/orders' } });
    router.push('/orders');
    expect(router.current).toBe('/orders');
    expect(await store.getItemAsync('sessionToken')).toBe('s-1');
  });
});
```

## API reference

- `createExpoTestEnv(): ExpoTestEnv` — Expo runtime mock (app config + manifest)
- `mockExpoRouter({ initial }): ExpoRouterMock` — push/back/replace + navigation stack
- `mockSecureStore(initial): SecureStoreMock` — setItemAsync / getItemAsync / deleteItemAsync
- `dispatchNotification(payload): NotificationDispatchResult` — 通知経路発火 + scheduled trace
- `mockFileSystem(options): FileSystemMock` — read/write/exists/delete
- `mockCamera(options): CameraMock` — takePicture / recordVideo / permission trace

## Test integration

vitest + `/kiwa-expo` skill で real Expo Go / EAS build 不要、 SDK 依存 flow を全 in-process で verify。

<!-- kiwa-docs:start -->
## Documentation

公開ドキュメントを正本として管理しています。

- [概要](https://cardene777.github.io/kiwa/libraries/application/expo/)
- [はじめる](https://cardene777.github.io/kiwa/libraries/application/expo/quickstart)
- [使い方](https://cardene777.github.io/kiwa/libraries/application/expo/how-to)
- [リファレンス](https://cardene777.github.io/kiwa/libraries/application/expo/reference)

編集元は [docs/libraries/application/expo](../../docs/libraries/application/expo/) です。
<!-- kiwa-docs:end -->

## License

UNLICENSED — see [github.com/cardene777/kiwa](https://github.com/cardene777/kiwa).
