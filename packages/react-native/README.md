# @kiwa-lab/react-native

React Native platform API mock harness for kiwa — AsyncStorage / React Navigation / Platform / Linking / Dimensions を統一 interface で in-process から叩ける test infra。

## Installation

```bash
pnpm add -D @kiwa-lab/react-native
# or
npm install -D @kiwa-lab/react-native
# or
yarn add -D @kiwa-lab/react-native
```

## Supported providers

| Primitive | Status | Primary API |
|---|---|---|
| AsyncStorage | ✅ Ready | `mockAsyncStorage` |
| React Navigation | ✅ Ready | `mockNavigation` |
| Platform | ✅ Ready | `setPlatform` |
| Linking | ✅ Ready | `dispatchLinkingUrl` |
| Dimensions | ✅ Ready | `setDimensions` |

## Quick start

```ts
import { describe, expect, it } from 'vitest';
import {
  createRNTestEnv,
  mockAsyncStorage,
  mockNavigation,
} from '@kiwa-lab/react-native';

describe('login flow', () => {
  it('token を storage に保存 + Home へ遷移', async () => {
    const env = createRNTestEnv({ platform: 'ios' });
    const storage = mockAsyncStorage({});
    const nav = mockNavigation({ initial: 'Login' });
    await storage.setItem('token', 't-1');
    nav.navigate('Home');
    expect(await storage.getItem('token')).toBe('t-1');
    expect(nav.current).toBe('Home');
  });
});
```

## API reference

- `createRNTestEnv({ platform: 'ios' | 'android' | 'web' }): RNTestEnv` — platform 別 mock env
- `mockAsyncStorage(initial: AsyncStorageInitial): AsyncStorageMock` — get/set/remove/clear の in-memory mock
- `mockNavigation({ initial: string }): NavigationMock` — stack push/pop/reset trace
- `dispatchLinkingUrl(url: string, listener: LinkingListener): void` — deep link 経路発火
- `setPlatform(os: RNPlatformOS): PlatformState` — Platform.OS 書換
- `setDimensions({ width, height }): DimensionsState` — Dimensions.get 書換

## Test integration

vitest + `/kiwa-react-native` skill で real device / simulator 不要で platform-dependent test を機械生成、 CI で headless に実行。

<!-- kiwa-docs:start -->
## Documentation

公開ドキュメントを正本として管理しています。

- [概要](https://cardene777.github.io/kiwa/libraries/application/react-native/)
- [はじめる](https://cardene777.github.io/kiwa/libraries/application/react-native/quickstart)
- [使い方](https://cardene777.github.io/kiwa/libraries/application/react-native/how-to)
- [リファレンス](https://cardene777.github.io/kiwa/libraries/application/react-native/reference)

編集元は [docs/libraries/application/react-native](../../docs/libraries/application/react-native/) です。
<!-- kiwa-docs:end -->

## License

UNLICENSED — see [github.com/cardene777/kiwa](https://github.com/cardene777/kiwa).
