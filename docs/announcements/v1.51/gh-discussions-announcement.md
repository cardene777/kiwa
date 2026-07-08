# kiwa v1.51 released — Mobile 深化 II (pair 第 13 の 2 段目 Phase 2、 29 milestone snippet streak)

## Summary

kiwa v1.51 is out。 **Mobile 深化 II** (@kiwa-test/mobile v0.2) 単軸 milestone、 **縦深化 pair 第 13 の 2 段目 (Phase 2) 完成**。 advanced II 4 new axis (navigation + reanimated + async-storage + secure-storage) + real driver env-gate 追加。

## What's new

### `@kiwa-test/mobile` v0.1 → v0.2

- **navigation axis 新規** = React Navigation / Expo Router (stack + tab + modal + deep link、 5 state)
- **reanimated axis 新規** = Reanimated 3 (shared value + worklet + animation lifecycle、 5 state)
- **async-storage axis 新規** = AsyncStorage / MMKV / localStorage (set + read + remove + batch、 5 state)
- **secure-storage axis 新規** = Keychain / Keystore / CredMgmt + biometric (store + retrieve + biometric + remove、 5 state)
- 3 target × 7 axis = 21 row fidelity grid + 84 dialect mapping
- backward compat 絶対維持 = v0.1 3 axis API 変更 0

### real driver env-gate

- `KIWA_MOBILE_MODE=real` + 6 axis URL env (`KIWA_EXPO_EAS_URL` / `KIWA_METRO_URL` / `KIWA_NAVIGATION_URL` / `KIWA_REANIMATED_URL` / `KIWA_ASYNC_STORAGE_URL` / `KIWA_SECURE_STORAGE_URL`)
- env 未設定時 explicit throw で fail-closed
- v1.52+ で child_process.spawn 実装予定

### 1 new dogfood app

- `dogfood-mobile-advanced-app` = 4 axis × 3 target workflow + real driver env-gate 3 pattern、 11 test

### 1 new tutorial + migration + concept

- **[Tutorial 111 — Mobile advanced II](https://cardene777.github.io/kiwa/tutorials/111-mobile-advanced)**
- Migration v1.50 → v1.51 additive-only + 4 pattern SSOT + Mobile 深化 II 2 段目
- Concept doc `mobile-testing-advanced.md` = 7 axis SSOT + 21 row fidelity + 84 dialect mapping + Phase 3 計画

### 29-milestone consecutive snippet validation streak

v1.23 → v1.51 = 29 milestone、 kiwa 史上最長記録更新継続。

## Install

```bash
pnpm add -D @kiwa-test/mobile@^0.2
```

## Migration guide

[v1.50 → v1.51](https://cardene777.github.io/kiwa/migrations/v1.50-to-v1.51)

## What's next

- v1.52 前後 = Mobile 深化 III (v0.3 Fabric + TurboModules + Codegen + New Architecture)、 pair 深度 3 段拡張達成 (5 例目 pair 深度 3 段記録) candidate
- 他 pair 3 段化 or 横串 sweep 4 例目 or v2.0 Desktop adapter
