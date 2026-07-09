# kiwa v1.50 released — Mobile new-base pair 第 13 導入 (41 package 到達、 28 milestone snippet streak)

## Summary

kiwa v1.50 is out。 **Mobile 新規 base pair 第 13 導入** 単軸 milestone、 **41 package 到達** (v1.49 40 + mobile 1)、 縦深化 pair pattern の広さ拡張。 v1.43 Edge base 以来 6 milestone 経過、 5-milestone new-base cadence 完全到達で 12 pair → 13 pair 拡張。

## What's new

### `@kiwa-lab/mobile` v0.1 新規

- 3 axis semantics = React Native (component + native module + gesture) + Expo (build config + deep link + push) + Metro (bundler + HMR + resolver)
- 3 target (ios + android + web) × 3 axis = 9 row fidelity grid
- 36 dialect mapping (3 target × 12 neutral event)
- backward compat 絶対維持 = 既存 40 package API 変更 0

### 1 new dogfood app

- `dogfood-mobile-rn-app` = RN + Expo + Metro 3 axis workflow、 11 test

### 1 new tutorial + migration + concept

- **[Tutorial 110 — Mobile testing baseline](https://cardene777.github.io/kiwa/tutorials/110-mobile-testing)**
- Migration v1.49 → v1.50 additive-only + 3 pattern SSOT + Mobile 新規 base pair 導入
- Concept doc `mobile-testing-baseline.md` = 3 axis SSOT + 9 row fidelity grid + Phase 2 計画

### 28-milestone consecutive snippet validation streak

v1.23 → v1.50 = 28 milestone、 kiwa 史上最長記録更新継続。

### systematic root cause pattern SSOT 25 度目適用

release script filter に `@kiwa-lab/mobile` 追加、 systematic pattern の 25 度目連続適用。

## Install

```bash
pnpm add -D @kiwa-lab/mobile@^0.1
```

## Migration guide

[v1.49 → v1.50](https://cardene777.github.io/kiwa/migrations/v1.49-to-v1.50)

## What's next

- v1.51 前後 = Mobile 深化 (v0.2 real driver) or 他 pair 3 段化 or 横串 sweep 4 例目
- v2.0 milestone Desktop adapter (Electron + Tauri)
