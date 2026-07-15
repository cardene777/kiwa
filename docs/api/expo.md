# @kiwa-lab/expo API reference

## Overview

`@kiwa-lab/expo` は Expo SDK (Expo Router / SecureStore / Notifications / FileSystem / Camera) を統一 interface で mock する test infra。 real Expo Go / EAS build 不要で SDK-dependent 経路を in-process 叩ける。

## Supported SDK

| SDK | Expo package | mock scope |
|---|---|---|
| Router | expo-router | file-based routing |
| SecureStore | expo-secure-store | keychain / keystore key-value |
| Notifications | expo-notifications | schedule / present / respond |
| FileSystem | expo-file-system | documentDir / cache read/write |
| Camera | expo-camera | permission + capture |

## Main API

### `createExpoTestEnv(options: CreateExpoTestEnvOptions): ExpoTestEnv`

Expo runtime mock env 生成、 5 SDK 全 mock 包含。 `{ initialRoute?, permissions? }` config。

### `mockExpoRouter(env, options?): ExpoRouterMock`

file-based routing mock、 `push / replace / back / setParams / usePathname` 相当を提供、 route stack を snapshot。

### `mockSecureStore(env, options?): SecureStoreMock`

`getItemAsync / setItemAsync / deleteItemAsync` mock、 keychain / keystore の永続化を in-memory で再現。

### `dispatchNotification(env, payload: NotificationPayload): NotificationDispatchResult`

notification schedule + present + respond の event を発火、 `{ notificationId, presented, response? }` を返す。

### `mockFileSystem(env, options?): FileSystemMock`

documentDir / cacheDir 相当を in-memory FS で mock、 `readAsStringAsync / writeAsStringAsync / deleteAsync / getInfoAsync`。

### `mockCamera(env, options?): CameraMock`

permission request + takePictureAsync + recordAsync + stopRecording を mock、 `CapturedPicture / CapturedVideo` を返す。

## Types

- `ExpoRouterOptions` = `{ initialUrl?, initialParams? }`
- `SecureStoreOptions` = `{ initial?: Record<string, string> }`
- `NotificationPayload` = `{ title, body, data?, categoryId?, badge? }`
- `FileInfo` = `{ exists: boolean, size?, modificationTime?, uri }`
- `CameraPermissionStatus = 'granted' | 'denied' | 'undetermined'`

## Usage examples

### SecureStore + Notifications

```typescript
import { createExpoTestEnv, mockSecureStore, dispatchNotification } from '@kiwa-lab/expo';
import { describe, expect, it } from 'vitest';

describe('token storage + reminder notification', () => {
  it('token 保存 + 1 時間後の reminder schedule', async () => {
    const env = createExpoTestEnv();
    const secure = mockSecureStore(env);
    await secure.setItemAsync('token', 'tok_abc');
    const result = dispatchNotification(env, {
      title: 'Reminder',
      body: 'Time to check kiwa docs!',
      data: { deepLink: 'myapp://docs' },
    });
    expect(await secure.getItemAsync('token')).toBe('tok_abc');
    expect(result.presented).toBe(true);
  });
});
```

### Camera permission flow

```typescript
import { createExpoTestEnv, mockCamera } from '@kiwa-lab/expo';

const env = createExpoTestEnv({ permissions: { camera: 'undetermined' } });
const cam = mockCamera(env);
const permission = await cam.requestPermissionsAsync();
expect(permission.status).toBe('granted'); // 承認 mock
const picture = await cam.takePictureAsync();
expect(picture.uri).toBeTruthy();
```

## Related skills

- [`/kiwa-expo`](../skills/kiwa-expo) — Expo SDK test 生成 skill
- [`/kiwa-react-native`](../skills/kiwa-react-native) — RN base test (related)
