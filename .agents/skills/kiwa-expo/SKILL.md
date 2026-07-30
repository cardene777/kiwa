---
name: kiwa-expo
description: |
  @kiwa-lab/expo (Expo Router / SecureStore / Notifications / FileSystem / Camera 統一 mock harness) を使った Expo app の SDK-dependent test 生成 skill。
  `createExpoTestEnv` で Expo runtime mock を立て、 `mockExpoRouter` / `mockSecureStore` / `dispatchNotification` / `mockFileSystem` / `mockCamera` を統一 interface で叩ける。 real Expo Go / EAS 不要。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-expo — Expo SDK test 生成

`@kiwa-lab/expo` の 5 SDK (Expo Router / SecureStore / Notifications / FileSystem / Camera) mock を使った Expo app test を Vitest 形式で生成する。

## 目的

Expo app を real Expo runtime なしで contract test する。 expo-router の push/replace/params、 SecureStore の credential 永続化、 expo-notifications の schedule/listener、 FileSystem I/O、 Camera 権限を統一 interface で test 化する。

## 前提

- `pnpm add -D @kiwa-lab/expo` install 済
- Vitest 環境
- 対象 module に Expo SDK 依存が存在

## オプション

- `--module {name}` — test 対象 module
- `--sdk {router|secure-store|notifications|file-system|camera}` — 主要 SDK
- `--output {path}` — 生成 test path

## 実行フロー

### Step 1: Router + SecureStore workflow test 生成

`mockExpoRouter({ initial: '/login' })` + `mockSecureStore({})` で env を立て、 login → SecureStore.setItemAsync('token') → router.replace('/home') の workflow を verify。

### Step 2: Notifications + FileSystem test 生成

`dispatchNotification(env, { title, body })` で scheduleNotificationAsync + addNotificationReceivedListener の連鎖、 `mockFileSystem({})` で readAsStringAsync / writeAsStringAsync / getInfoAsync / deleteAsync の I/O 経路 verify。

### Step 3: Camera 権限 + capture test 生成

`mockCamera({ permission: 'granted' })` で takePictureAsync / recordAsync の返却 + permission denied failure path を it.each で cover。

## 使用例

```bash
/kiwa-expo --module onboarding --output tests/integration/onboarding.expo.test.ts
/kiwa-expo --module upload-photo --sdk camera
```
