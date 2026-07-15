---
name: kiwa-react-native
description: |
  @kiwa-lab/react-native (AsyncStorage / React Navigation / Platform / Linking / Dimensions 統一 mock harness) を使った React Native app の platform-dependent test 生成 skill。
  `createRNTestEnv({ platform })` で RN test env を立て、 `mockAsyncStorage` / `mockNavigation` / `dispatchLinkingUrl` / `setPlatform` で platform 経路を in-process で叩ける。 real device / simulator 不要。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-react-native — React Native platform test 生成

`@kiwa-lab/react-native` の 5 primitive (AsyncStorage / React Navigation / Platform / Linking / Dimensions) mock を使った RN test を Vitest 形式で生成する。

## 目的

React Native app を real device なしで contract test する。 iOS / Android の Platform.OS 分岐、 deep link 経路、 async storage 永続化、 navigation stack 遷移を統一 interface で test 化する。

## 前提

- `pnpm add -D @kiwa-lab/react-native` install 済
- Vitest 環境
- 対象 module に RN primitive 依存 (AsyncStorage / Navigation 等) が存在

## オプション

- `--module {name}` — test 対象 module
- `--platform {ios|android}` — 主要 platform (省略時 = 両 platform)
- `--output {path}` — 生成 test path

## 実行フロー

### Step 1: AsyncStorage + Navigation workflow test 生成

`mockAsyncStorage({ token: 'abc' })` + `mockNavigation('/home')` で env を立て、 storage 読み書き → navigation.navigate('/profile') → route params 検証の統合 workflow を it で cover。

### Step 2: Linking + Platform test 生成

`dispatchLinkingUrl(env, 'myapp://open?id=1')` で deep link event 発火、 `setPlatform(env, { os: 'ios', version: '17' })` で platform 分岐、 iOS/Android 別挙動を it.each で cover。

### Step 3: Dimensions responsive test 生成

Dimensions.get('window') の値差替 (phone / tablet / landscape) で layout 分岐の failure path 検証。

## 使用例

```bash
/kiwa-react-native --module login --output tests/integration/login.rn.test.ts
/kiwa-react-native --module deep-link --platform ios
```
