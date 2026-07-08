---
title: Mobile testing advanced II — v1.51 7 axis SSOT
---

# Mobile testing advanced II — v1.51 7 axis SSOT

## What this covers

`@kiwa-test/mobile` v0.2 の 7 axis target-neutral state machine SSOT (base 3 + advanced II 4)、 pair 第 13 の 2 段目 (Phase 2)。 v1.50 base に加えて v1.51 で navigation + reanimated + async-storage + secure-storage を追加、 3 target × 7 axis = 21 row fidelity grid + 48 dialect mapping。

## 7 axis 一覧

### v1.50 base 3 axis

- **react-native** = component + native module + gesture + unmount (5 state)
- **expo** = build config + deep link + push + build complete (5 state)
- **metro** = bundle + resolve + HMR + complete (5 state)

### v1.51 advanced II 4 axis

- **navigation** = React Navigation / Expo Router (stack push + tab switch + modal + deep link、 5 state)
- **reanimated** = Reanimated 3 (shared value + worklet + animation lifecycle、 5 state)
- **async-storage** = AsyncStorage / MMKV / localStorage (set + read + remove + batch、 5 state)
- **secure-storage** = Keychain / Keystore / CredMgmt + biometric (store + retrieve + biometric + remove、 5 state)

## 3 target × 7 axis fidelity harness

- 3 target × 7 axis = **21 row grid** (v1.50 9 row から拡張)
- 3 target × 16 v1.51 event = 48 new dialect mapping
- v1.50 36 mapping と合わせて **84 dialect mapping**

## Provider dialect example (v1.51 追加分)

```
ios.rn-nav.stack.push      ← navigation.stack_pushed (ios)
android.rn-nav.stack.push  ← navigation.stack_pushed (android)
web.history.push           ← navigation.stack_pushed (web)
ios.reanimated.sv.update   ← reanimated.shared_value_updated (ios)
android.reanimated.sv.update ← reanimated.shared_value_updated (android)
web.reanimated-web.sv.update ← reanimated.shared_value_updated (web)
ios.mmkv.set               ← async-storage.item_set (ios)
android.mmkv.set           ← async-storage.item_set (android)
web.localStorage.setItem   ← async-storage.item_set (web)
ios.biometry.face-id       ← secure-storage.biometric_challenged (ios)
android.biometry.fingerprint ← secure-storage.biometric_challenged (android)
web.webauthn.challenge     ← secure-storage.biometric_challenged (web)
```

## Real driver env-gate SSOT

- `KIWA_MOBILE_MODE=real` = 必須 = real 経路発動 SSOT
- 6 axis URL env = required per axis 実行時
  - `KIWA_EXPO_EAS_URL` (for expo-eas)
  - `KIWA_METRO_URL` (for metro)
  - `KIWA_NAVIGATION_URL` (for navigation)
  - `KIWA_REANIMATED_URL` (for reanimated)
  - `KIWA_ASYNC_STORAGE_URL` (for async-storage)
  - `KIWA_SECURE_STORAGE_URL` (for secure-storage)
- env 未設定時 explicit throw で fail-closed (「production で mock が silent に走る」 事故を構造的に防ぐ)

## backward compat 絶対維持

- v0.1 3 axis API (RN + Expo + Metro) 変更 0
- 4 new axis は additive optional path
- v0.1 で書いた test は無修正で v0.2 でも継続動作

## 縦深化 pair 第 13 の 2 段目 (Phase 2)

- **v1.50 base (v0.1)** = 3 axis + 3 target × 3 axis = 9 row fidelity + 36 dialect mapping
- **v1.51 advanced II (v0.2)** = base に加えて 4 new axis + 3 target × 7 axis = 21 row fidelity + 84 dialect mapping + real driver env-gate

## Phase 3 (v1.52+) 計画

- **Mobile v0.3 advanced III** = Fabric (concurrent renderer) + TurboModules (new native module system) + Codegen (typed bridge) + New Architecture (async)
- pair 深度 3 段拡張達成 candidate (Search / Auth / Realtime / Frontend に続く 5 例目 pair 深度 3 段記録)
- real driver child_process.spawn 実装 (Expo EAS CLI + Metro real bundle + native tooling 呼出)
