# kiwa v1.51 リリース — Mobile 深化 II (pair 第 13 の 2 段目 Phase 2 完成、 real driver env-gate、 29 milestone snippet streak)

## 概要

kiwa v1.51 をリリースしました。 **Mobile 深化 II** (@kiwa-test/mobile v0.2、 pair 第 13 の 2 段目 Phase 2 完成) 単軸 milestone。 v1.50 base に加えて advanced II 4 new axis (navigation + reanimated + async-storage + secure-storage) + real driver env-gate を追加。

## 何が変わったか

### `@kiwa-test/mobile` v0.1 → v0.2 (Phase 2 完成)

- **navigation axis** = React Navigation / Expo Router (stack push + tab switch + modal + deep-link)
- **reanimated axis** = Reanimated 3 (shared value update + worklet + animation lifecycle)
- **async-storage axis** = AsyncStorage / MMKV / web localStorage 統一
- **secure-storage axis** = iOS Keychain / Android Keystore / web CredMgmt + biometric challenge (Face ID / Touch ID / Fingerprint / WebAuthn)
- 3 target × 7 axis = 21 row fidelity grid、 84 dialect mapping
- backward compat 絶対維持 = v0.1 API 変更 0

### real driver env-gate

- `KIWA_MOBILE_MODE=real` + 6 axis URL env で real 呼出 opt-in
- 未設定時 explicit throw で fail-closed (「production で mock が silent に走る」 事故を構造的に防ぐ)
- v1.52+ で child_process.spawn 実装予定

### 縦深化 pair 第 13 の 2 段目 (Phase 2) 完成

Mobile pair の 2 段構造。

- **v1.50 (base)** = mobile v0.1 + 3 axis base semantics、 new-base pair 第 13 導入
- **v1.51 (2 段目 = Phase 2)** = mobile v0.2 + 4 advanced II axis + real driver env-gate

v1.52+ で Phase 3 (advanced III Fabric + TurboModules + Codegen + New Architecture) で 3 段拡張達成 (5 例目 pair 深度 3 段記録) を狙う。

### 1 new dogfood app + 1 tutorial + migration + concept

- **dogfood-mobile-advanced-app** = 4 axis × 3 target workflow + real driver env-gate 3 pattern、 11 test
- **[Tutorial 111 — Mobile advanced II](https://cardene777.github.io/kiwa/tutorials/111-mobile-advanced)**
- Migration guide v1.50 → v1.51 additive-only + 4 pattern SSOT + Mobile 深化 II 2 段目
- Concept doc `mobile-testing-advanced.md` = 7 axis SSOT + 21 row fidelity + 84 dialect mapping + Phase 3 計画

## 29 milestone 連続 snippet validation streak 達成

v1.23 → v1.51 = 29 milestone 連続、 kiwa 史上最長記録更新継続。

## インストール

```bash
pnpm add -D @kiwa-test/mobile@^0.2
```

## Migration guide

[v1.50 → v1.51](https://cardene777.github.io/kiwa/migrations/v1.50-to-v1.51)

## 次に何が来るか

v1.52 前後 = 4 候補。

- **Mobile 深化 III (v0.3 advanced III)** = Fabric + TurboModules + Codegen + New Architecture、 pair 深度 3 段拡張達成 candidate (Search / Auth / Realtime / Frontend に続く 5 例目 pair 深度 3 段記録)
- **他 pair 2 3 段化** = Streaming / Database / Security から 1 選択、 5 例目に相当する 6 例目 pair 深度 3 段記録
- **横串 sweep 4 例目** = v1.30 a11y + v1.25 perf + v1.27 mutation の pair pattern、 kiwa 全 41 package 横串適用
- **v2.0 milestone Desktop adapter** = Electron + Tauri、 v1.50 Mobile と pair で v2.0 の平面拡大
