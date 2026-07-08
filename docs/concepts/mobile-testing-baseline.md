---
title: Mobile testing baseline — v1.50 3 axis SSOT
---

# Mobile testing baseline — v1.50 3 axis SSOT

## What this covers

`@kiwa/mobile` v0.1 の 3 axis (React Native + Expo + Metro) target-neutral state machine SSOT。 v1.50 で kiwa 縦深化 pair 第 13 新規 base pair として導入、 **41 package 到達**。

## 3 axis 一覧

### React Native axis

- Component lifecycle = idle → mounted → native-invoked → gesture-recognized → unmounted (5 state)
- 4 method = mountReactNativeComponent + invokeNativeModule + recognizeGesture + unmountReactNativeComponent
- 4 neutral event = component_mounted + native_module_invoked + gesture_recognized + component_unmounted
- gesture 5 種 = tap + pan + pinch + rotation + swipe

### Expo axis

- Build config + linking + push flow = idle → config-loaded → link-resolved → push-received → build-completed (5 state)
- 4 method = loadExpoBuildConfig + resolveDeepLink + receivePushNotification + completeExpoBuild
- 4 neutral event = build_config_loaded + deep_link_resolved + push_notification_received + build_completed

### Metro axis

- Bundler + HMR + resolver flow = idle → bundling → resolved → hmr-applied → completed (5 state)
- 4 method = startMetroBundle + resolveMetroModule + applyMetroHmr + completeMetroBundle
- 4 neutral event = bundle_started + module_resolved + hmr_applied + bundle_completed

## 3 target × 3 axis fidelity harness

- target = ios + android + web (Expo Web) = 3 platform
- axis = react-native + expo + metro = 3
- 3 × 3 = 9 row grid、 `collectFidelityCoverage()` で collect
- 3 target × 12 event = 36 dialect mapping

## Provider dialect example

```
ios.rn.uikit.mount    ← rn.component_mounted (ios)
android.rn.uimanager.mount ← rn.component_mounted (android)
web.rn-web.mount      ← rn.component_mounted (web)
ios.expo.apns         ← expo.push_notification_received (ios)
android.expo.fcm      ← expo.push_notification_received (android)
web.expo.web-push     ← expo.push_notification_received (web)
ios.metro.transform.start ← metro.bundle_started (ios)
```

## backward compat 絶対維持

新 package `@kiwa/mobile` の追加は additive、 既存 40 package 全部 API 変更 0。 依存関係も `@kiwa/core` のみ、 他 package への影響なし。

## 縦深化 pair 第 13 新規 base pair 導入

kiwa 縦深化 pair pattern の 13 番目、 v1.43 Edge base 以来 6 milestone 経過で 5-milestone new-base cadence 完全到達。 pair 深度 3 段拡張 pattern (Search / Auth / Realtime / Frontend の 4 例安定化) と **広さ拡張 pattern (base pair 導入)** の 2 軸 rhythm を並行運用。

## Phase 2 (v1.51+) 計画

- **Mobile v0.2 real driver** = Expo EAS + Metro real bundle + RN new architecture (Fabric + TurboModules)
- **Mobile advanced 5-8 axis** = navigation + gesture handler advanced + Reanimated + async storage + secure storage
- **Desktop adapter (v2.0 milestone)** = Electron + Tauri、 v1.50 Mobile と pair で v2.0 の平面拡大
