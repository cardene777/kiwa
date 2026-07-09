# kiwa v1.52 released — Mobile 深化 III (pair 深度 3 段記録 5 例目、 30 milestone snippet streak 突入)

## Summary

kiwa v1.52 is out。 **Mobile 深化 III** (@kiwa-lab/mobile v0.3) 単軸 milestone、 **縦深化 pair 第 13 の 3 段目 (Phase 3、 pair 深度 3 段拡張達成 5 例目 pair 深度 3 段記録) 完成**。 React Native 0.76+ New Architecture 4 axis (fabric + turbo-modules + codegen + new-architecture) 追加。

## What's new

### `@kiwa-lab/mobile` v0.2 → v0.3

- **fabric axis 新規** = React Native 0.76+ Fabric concurrent renderer (schedule + shadow tree commit + priority + mount、 5 state)
- **turbo-modules axis 新規** = typed native module + JSI runtime + spec registration (5 state)
- **codegen axis 新規** = schema-first typed bridge + spec generation + type emission (5 state)
- **new-architecture axis 新規** = async init + concurrent React + legacy interop bridge (5 state)
- 3 target × 11 axis = 33 row fidelity grid + 132 total dialect mapping
- backward compat 絶対維持 = v0.1 + v0.2 API 変更 0

### 3 段構造完成

- **v1.50 (base)** = mobile v0.1 base 3 axis (RN + Expo + Metro)、 new-base pair 第 13 導入
- **v1.51 (2 段目 = Phase 2)** = mobile v0.2 + 4 advanced II axis + real driver env-gate
- **v1.52 (3 段目 = Phase 3、 3 段拡張達成 5 例目)** = mobile v0.3 + 4 advanced III axis (New Architecture)

### 1 new dogfood app

- `dogfood-mobile-new-arch-app` = Fabric + TurboModules + Codegen + New Architecture workflow、 8 test

### 1 new tutorial + migration + concept

- **[Tutorial 112 — Mobile New Architecture](https://cardene777.github.io/kiwa/tutorials/112-mobile-new-architecture)**
- Migration v1.51 → v1.52 additive + 4 pattern SSOT + pair 深度 3 段記録 5 例目
- Concept doc `mobile-testing-advanced-III.md` = 11 axis SSOT + 33 row fidelity + 132 dialect mapping + Phase 4 計画

### 30-milestone consecutive snippet validation streak 突入

v1.23 → v1.52 = 30 milestone streak、 kiwa 史上最長記録 30 milestone 突入。

### pair 深度 3 段記録 5 例目達成

Search v1.36 + Auth v1.44 + Realtime v1.45 + Frontend v1.49 の 4 例安定化に続く 5 例目、 **3 段拡張 pattern 5 例安定化を実証**。

## Install

```bash
pnpm add -D @kiwa-lab/mobile@^0.3
```

## Migration guide

[v1.51 → v1.52](https://cardene777.github.io/kiwa/migrations/v1.51-to-v1.52)

## What's next

- v1.53 前後 = Mobile v0.4 real driver (Metro real bundle + Expo EAS CLI + Fabric real renderer)、 Mobile v0.5 pair 深度 4 段拡張 candidate
- 他 pair 3 段化 or 横串 sweep 4 例目 or v2.0 Desktop adapter
