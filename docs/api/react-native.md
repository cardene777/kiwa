# @kiwa-lab/react-native API reference

## Overview

`@kiwa-lab/react-native` は React Native の platform API (AsyncStorage / React Navigation / Platform / Linking / Dimensions) を統一 interface で mock する test infra。 real device / simulator 不要でRN app 経路を in-process 叩ける。

## Supported primitives

| primitive | RN equivalent | mock scope |
|---|---|---|
| AsyncStorage | `@react-native-async-storage/async-storage` | key-value store |
| Navigation | `@react-navigation/native` | stack / tab / drawer |
| Platform | `react-native/Platform` | OS / Version |
| Linking | `react-native/Linking` | URL 経由 deep link |
| Dimensions | `react-native/Dimensions` | screen w/h |

## Main API

### `createRNTestEnv(options: CreateRNTestEnvOptions): RNTestEnv`

`{ platform: 'ios'|'android', version?, dimensions? }` で RN test env 生成。 primitive 全 mock を包含。

### `mockAsyncStorage(env, initial?: AsyncStorageInitial): AsyncStorageMock`

`get / set / remove / clear / getAllKeys / multiGet` の Promise-based API mock、 initial data を pre-populate。

### `mockNavigation(env, initialRoute?): NavigationMock`

`navigate / goBack / push / pop / reset / setParams / addListener` を mock、 state 変更を snapshot。

### `dispatchLinkingUrl(env, url: string): LinkingEvent`

deep link URL を dispatch、 registered listener を発火。 test で「特定 URL で router が動く」 を verify。

### `setPlatform(env, state: Partial<PlatformState>) / setDimensions(env, state: Partial<DimensionsState>)`

Platform / Dimensions state を test 中に変更、 orientation change 等の test に使う。

## Types

- `RNPlatformOS = 'ios' | 'android' | 'web' | 'windows' | 'macos'`
- `AsyncStorageInitial = Record<string, string>`
- `NavigationRoute` = `{ name, params? }`
- `LinkingListener = (event: LinkingEvent) => void`
- `PlatformState` = `{ OS, Version, isTV?, constants? }`
- `DimensionsState` = `{ window: { width, height, scale, fontScale } }`

## Usage examples

### AsyncStorage + Navigation

```typescript
import { createRNTestEnv, mockAsyncStorage, mockNavigation } from '@kiwa-lab/react-native';
import { describe, expect, it } from 'vitest';

describe('sign in flow', () => {
  it('sign in 成功で token 保存 + Home へ navigate', async () => {
    const env = createRNTestEnv({ platform: 'ios', version: '17.0' });
    const storage = mockAsyncStorage(env);
    const nav = mockNavigation(env, { name: 'SignIn' });
    await signIn({ email: 'a@x', password: 'p' }, { storage, nav });
    expect(await storage.get('token')).toBe('tok_abc');
    expect(nav.currentRoute().name).toBe('Home');
  });
});
```

### Deep link routing

```typescript
import { createRNTestEnv, dispatchLinkingUrl, mockNavigation } from '@kiwa-lab/react-native';

const env = createRNTestEnv({ platform: 'android' });
const nav = mockNavigation(env);
dispatchLinkingUrl(env, 'myapp://post/42');
expect(nav.currentRoute().name).toBe('PostDetail');
expect(nav.currentRoute().params).toEqual({ postId: '42' });
```

## Related skills

- [`/kiwa-react-native`](../skills/kiwa-react-native) — React Native test 生成 skill
- [`/kiwa-expo`](../skills/kiwa-expo) — Expo SDK test (related)
