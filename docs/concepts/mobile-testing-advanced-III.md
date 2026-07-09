---
title: Mobile testing advanced III — v1.52 11 axis SSOT + pair 深度 3 段記録 5 例目
---

# Mobile testing advanced III — v1.52 11 axis SSOT + pair 深度 3 段記録 5 例目

## What this covers

`@kiwa-lab/mobile` v0.3 の 11 axis target-neutral state machine SSOT (base 3 + advanced II 4 + advanced III 4)、 縦深化 pair 第 13 の 3 段目 (Phase 3、 pair 深度 3 段拡張達成 5 例目)。 v1.51 base + advanced II 7 axis に加えて v1.52 で fabric + turbo-modules + codegen + new-architecture を追加、 React Native 0.76+ New Architecture 領域を production layer に統合。

## 11 axis 一覧

### v1.50 base 3 axis

- **react-native** = component + native module + gesture + unmount (5 state)
- **expo** = build config + deep link + push + build complete (5 state)
- **metro** = bundle + resolve + HMR + complete (5 state)

### v1.51 advanced II 4 axis

- **navigation** = React Navigation / Expo Router (5 state)
- **reanimated** = Reanimated 3 (5 state)
- **async-storage** = AsyncStorage / MMKV / localStorage (5 state)
- **secure-storage** = Keychain / Keystore / CredMgmt + biometric (5 state)

### v1.52 advanced III 4 axis (New Architecture)

- **fabric** = React Native 0.76+ Fabric concurrent renderer + priority + shadow tree (5 state = idle / scheduled / shadow-committed / priority-updated / mounted)
- **turbo-modules** = typed native module + JSI binding + spec registration + method invocation (5 state = idle / spec-registered / jsi-bound / method-invoked / unregistered)
- **codegen** = schema-first typed bridge + spec generation + type file emission + build complete (5 state = idle / schema-loaded / spec-generated / type-emitted / build-completed)
- **new-architecture** = async init + concurrent React enable + legacy interop bridge + ready (5 state = idle / initializing / concurrent-enabled / interop-bridged / ready)

## 3 target × 11 axis fidelity harness

- 3 target × 11 axis = **33 row grid** (v1.51 21 row から拡張)
- 3 target × 44 event = **132 total dialect mapping** (v1.51 84 + v1.52 48 = 132)

## Provider dialect example (v1.52 追加分)

```
ios.fabric.render.schedule    ← fabric.render_scheduled (ios)
android.fabric.render.schedule ← fabric.render_scheduled (android)
web.rn-web.render.schedule    ← fabric.render_scheduled (web)
ios.turbo.jsi.bind            ← turbo-modules.jsi_bound (ios)
android.turbo.jsi.bind        ← turbo-modules.jsi_bound (android)
web.turbo-web.polyfill.bind   ← turbo-modules.jsi_bound (web)
ios.codegen.schema.load       ← codegen.schema_loaded (ios)
web.codegen-web.schema.load   ← codegen.schema_loaded (web)
ios.new-arch.concurrent.on    ← new-architecture.concurrent_enabled (ios)
web.concurrent-react.enable   ← new-architecture.concurrent_enabled (web、 React 18 concurrent への mapping)
```

## backward compat 絶対維持

- v0.1 3 axis + v0.2 4 axis API + real driver env-gate helper 全部変更 0
- v0.3 4 new axis は additive optional path
- v0.1 / v0.2 で書いた test は無修正で v0.3 でも継続動作

## 縦深化 pair 第 13 の 3 段目 (Phase 3、 3 段拡張達成 5 例目 pair 深度 3 段記録)

Mobile pair の 3 段構造完成。

- **v1.50 (base)** = mobile v0.1 + 3 axis base
- **v1.51 (2 段目 = Phase 2)** = mobile v0.2 + 4 advanced II axis + real driver env-gate
- **v1.52 (3 段目 = Phase 3、 3 段拡張達成 5 例目)** = mobile v0.3 + 4 advanced III axis (New Architecture)

**pair 深度 3 段記録 5 例目**、 Search v1.36 + Auth v1.44 + Realtime v1.45 + Frontend v1.49 の 4 例安定化に続く 5 例目、 **3 段拡張 pattern 5 例安定化** を実証。

## Phase 4 (v1.53+) 計画

- **Mobile v0.4 real driver 実装** = child_process.spawn (Metro real bundle + Expo EAS CLI + Fabric real renderer + New Architecture app boot)
- **Mobile v0.5 pair 深度 4 段拡張** = kiwa milestone 史上 4 例目 depth-4 record candidate (v1.40 AI/LLM + v1.41 Payment + v1.42 Observability の 3 例安定化に続く)
- **他 axis 追加** = OTA update + FastImage + ML Kit + Speech recognition 等の domain-specific extension
