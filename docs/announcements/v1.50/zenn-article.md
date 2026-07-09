# kiwa v1.50 リリース — Mobile 新規 base pair 第 13 導入 (41 package 到達、 縦深化 pair 12 → 13 拡張、 28 milestone snippet streak)

## 概要

kiwa v1.50 をリリースしました。 **Mobile 新規 base pair 第 13 導入** 単軸 milestone、 **41 package 到達** (v1.49 40 + mobile 1)、 kiwa 縦深化 pair pattern の広さ拡張。 v1.43 Edge base 以来 6 milestone 経過、 5-milestone new-base cadence 完全到達で pair 12 → 13 拡張。

## 何が変わったか

### `@kiwa-lab/mobile` v0.1 新規

- 3 axis semantics = React Native (component + native module + gesture) + Expo (build config + deep link + push notification) + Metro (bundler + HMR + resolver)
- 3 target (ios + android + web) × 3 axis = 9 row fidelity grid
- 36 dialect mapping (3 target × 12 neutral event)、 target-neutral な test の裏に platform-specific dialect を保持
- backward compat 絶対維持 = 既存 40 package API 変更 0

### 3 axis 詳細

- **React Native axis** = 5 state (idle → mounted → native-invoked → gesture-recognized → unmounted)、 gesture 5 種 (tap / pan / pinch / rotation / swipe)
- **Expo axis** = 5 state (idle → config-loaded → link-resolved → push-received → build-completed)、 EAS build + universal link + APNs/FCM/web-push 対応
- **Metro axis** = 5 state (idle → bundling → resolved → hmr-applied → completed)、 bundle + HMR + module resolver 統一

### 1 new dogfood app + 1 tutorial + migration + concept

- **dogfood-mobile-rn-app** = 3 axis × 3 target workflow、 11 test
- **[Tutorial 110 — Mobile testing baseline](https://cardene777.github.io/kiwa/tutorials/110-mobile-testing)**
- Migration guide v1.49 → v1.50 additive-only + 3 pattern (RN lifecycle + Expo build + Metro bundle) SSOT + Mobile 新規 base pair 導入
- Concept doc `mobile-testing-baseline.md` = 3 axis SSOT + 9 row fidelity grid + Phase 2 (v1.51+) 計画

## 縦深化 pair pattern の広さ拡張

v1.50 で kiwa 縦深化 pair pattern の 13 番目、 v1.43 Edge base 以来 6 milestone 経過で 5-milestone new-base cadence 完全到達。 pair 深度 3 段拡張 pattern (Search / Auth / Realtime / Frontend の 4 例安定化) と **広さ拡張 pattern (base pair 導入)** の 2 軸 rhythm を並行運用、 kiwa の柔軟な拡張戦略を実証。

## 28 milestone 連続 snippet validation streak 達成

v1.23 → v1.50 = 28 milestone 連続、 kiwa 史上最長記録更新継続。 累積 28 週相当の documentation quality investment。

## インストール

```bash
pnpm add -D @kiwa-lab/mobile@^0.1
```

## Migration guide

[v1.49 → v1.50](https://cardene777.github.io/kiwa/migrations/v1.49-to-v1.50)

## 次に何が来るか

v1.51 前後 = 4 候補。

- **Mobile 深化 (v0.2 real driver)** = Expo EAS + Metro real bundle + RN new architecture (Fabric + TurboModules)、 Phase 2 完成
- **他 pair 2 3 段化** = Streaming / Database / Security から 1 選択、 5 例目 pair 深度 3 段記録
- **横串 sweep 4 例目** = v1.30 a11y + v1.25 perf + v1.27 mutation の pair pattern、 kiwa 全 41 package 横串適用
- **v2.0 milestone Desktop adapter** = Electron + Tauri、 v1.50 Mobile と pair で v2.0 の平面拡大
