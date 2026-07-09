# kiwa v1.55 released — Mobile 深化 VI (depth-5 pattern 実装完成 kiwa milestone 史上初 6 段拡張、 33 milestone snippet streak)

## Summary

kiwa v1.55 is out。 **Mobile 深化 VI** (@kiwa-lab/mobile v0.6) 単軸 milestone、 **縦深化 pair 第 13 の 6 段目 (Phase 6、 depth-5 pattern 実装完成) 完成**、 **kiwa milestone 史上初 6 段拡張 candidate**。 v1.54 spawn stub 契約層 → v1.55 実 child_process.spawn 実行、 v0.5 shape 契約 preserving。

## What's new

### `@kiwa-lab/mobile` v0.5 → v0.6

- **`invokeMobileCli` 実 spawn 実行** = stub → 実 child_process.spawn 実行、 v0.5 shape 契約 preserving (SpawnResult 構造無変更、 stdout/stderr/exitCode/durationMs は実測値)
- **`spawn-executor.ts` 新規** = env sanitize + timeout + buffer 上限 + allowlist per command
- **`KIWA_MOBILE_SPAWN=dry-run`** = 実 CLI 未 install 環境向け backward compat 経路
- **`invokeMobileCliWith(inv, spawnFn)`** = DI 経路、 SpawnFn 注入で決定的挙動
- **`sanitizeEnv(command, env)`** = per-command allowlist で secret 漏洩防止
- backward compat 絶対維持 = v0.1 + v0.2 + v0.3 + v0.4 + v0.5 API 変更 0

### 6 段構造完成 (Phase 6、 depth-5 pattern 実装完成、 kiwa milestone 史上初 6 段拡張)

- **v1.50 (base)** = mobile v0.1 + 3 axis semantics
- **v1.51 (2 段目)** = mobile v0.2 + 4 advanced II axis + env-gate helper
- **v1.52 (3 段目)** = mobile v0.3 + 4 advanced III axis (New Architecture)
- **v1.53 (4 段目 = depth-4 4 例目)** = mobile v0.4 + adapter layer
- **v1.54 (5 段目 = depth-5 pattern 新設 kiwa milestone 史上初 depth-5 record)** = mobile v0.5 + spawn stub 契約層
- **v1.55 (6 段目 = depth-5 pattern 実装完成)** = mobile v0.6 + 実 child_process.spawn 実行

### 6 CLI per-command env allowlist

- `expo build` = PATH / HOME / NODE_ENV / EXPO_TOKEN / EAS_TOKEN
- `metro bundle` = PATH / HOME / NODE_ENV / METRO_CACHE_DIR
- `codegen run` = PATH / HOME / NODE_ENV
- `react-native start` = PATH / HOME / NODE_ENV / RCT_METRO_PORT
- `pod install` = PATH / HOME / LANG / COCOAPODS_DISABLE_STATS
- `gradle build` = PATH / HOME / JAVA_HOME / ANDROID_HOME / ANDROID_SDK_ROOT / GRADLE_USER_HOME

secret 漏洩防止 = allowlist 未 include の env は必ず sanitize、 実 spawn 時に child process 環境から完全排除。

### 1 new dogfood app

- `dogfood-mobile-v06-spawn-app` = dry-run + DI + sanitize の 3 pattern workflow、 10 test

### 1 new tutorial + migration + concept

- **[Tutorial 115 — Mobile v0.6 real spawn](https://cardene777.github.io/kiwa/tutorials/115-mobile-v06-spawn)**
- Migration v1.54 → v1.55 additive + 3 pattern SSOT + depth-5 pattern 実装完成
- Concept doc `mobile-testing-v06-spawn.md` = spawn-executor SSOT + per-command allowlist 表 + safety guards + depth-5 pattern 実装完成 SSOT + Phase 7 計画

### 33-milestone consecutive snippet validation streak

v1.23 → v1.55 = 33 milestone streak、 kiwa 史上最長記録更新継続。 systematic root cause pattern SSOT **30 度突入**。

## Install

```bash
pnpm add -D @kiwa-lab/mobile@^0.6
```

## Migration guide

[v1.54 → v1.55](https://cardene777.github.io/kiwa/migrations/v1.54-to-v1.55)

## What's next

- v1.56 前後 = 他 pair depth-5 拡張 (v1.40 AI/LLM / v1.41 Payment / v1.42 Observability depth-4 record からの depth-5 拡張)、 depth-5 pattern 2 例目 → 3 例安定化 candidate
- 他 pair 4 段化 or 横串 sweep 4 例目 or v2.0 Desktop adapter
