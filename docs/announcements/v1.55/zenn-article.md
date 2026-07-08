# kiwa v1.55 リリース — Mobile 深化 VI (depth-5 pattern 実装完成 kiwa milestone 史上初 6 段拡張、 33 milestone snippet streak)

## 概要

kiwa v1.55 をリリースしました。 **Mobile 深化 VI** (@kiwa/mobile v0.6、 縦深化 pair 第 13 の 6 段目 Phase 6 完成、 **depth-5 pattern 実装完成、 kiwa milestone 史上初 6 段拡張 candidate**) 単軸 milestone。 v1.54 spawn stub 契約層 → v1.55 実 child_process.spawn 実行、 v0.5 shape 契約 preserving で backward compat 絶対維持。

## 何が変わったか

### `@kiwa/mobile` v0.5 → v0.6 (depth-5 pattern 実装完成)

- **`invokeMobileCli` 実 spawn 実行** = stub → 実 child_process.spawn 実行、 v0.5 shape 契約 preserving (SpawnResult 構造 = `command` / `args` / `invoked` / `exitCode` / `stdout` / `stderr` / `durationMs` 無変更)
- **stdout/stderr/exitCode/durationMs** = 実 spawn からの実測値
- **`spawn-executor.ts` 新規** = env sanitize + timeout enforcement + buffer 上限 + allowlist per command
- **`KIWA_MOBILE_SPAWN=dry-run`** = 実 CLI 未 install 環境向け v0.5 stub 相当 shape 復元
- **`invokeMobileCliWith(inv, spawnFn)`** = DI 経路、 SpawnFn 注入で決定的挙動、 CI 環境で 実 CLI 依存なし
- **`sanitizeEnv(command, env)`** = per-command allowlist で secret 漏洩防止
- backward compat 絶対維持 = v0.1 + v0.2 + v0.3 + v0.4 + v0.5 API 変更 0

### 6 段構造完成 = kiwa milestone 史上初 6 段拡張 candidate

Mobile pair の 6 段構造 (depth-5 pattern 実装完成)。

- **v1.50 (base)** = mobile v0.1 + 3 axis semantics
- **v1.51 (2 段目)** = mobile v0.2 + 4 advanced II axis + env-gate helper
- **v1.52 (3 段目)** = mobile v0.3 + 4 advanced III axis (New Architecture)
- **v1.53 (4 段目 = depth-4 4 例目)** = mobile v0.4 + adapter layer + fidelity harness
- **v1.54 (5 段目 = depth-5 pattern 新設 kiwa milestone 史上初 depth-5 record)** = mobile v0.5 + spawn stub 契約層
- **v1.55 (6 段目 = depth-5 pattern 実装完成)** = mobile v0.6 + 実 child_process.spawn 実行 + env sanitize + safety guards

**kiwa milestone 史上初 6 段拡張 candidate**、 v1.54 stub → v1.55 実 spawn の連続 minor bump で shape 契約 preserving、 backward compat 絶対維持で 6 段拡張完了。

### 3 経路 = 実 CLI 有無問わず決定的

- **Dry-run** = `KIWA_MOBILE_SPAWN=dry-run` で shape のみ、 実 spawn 未実行
- **DI** = SpawnFn を注入して決定的挙動、 CI 環境で 実 CLI 依存なし
- **実 spawn** = default 経路、 env sanitize + allowlist + timeout + buffer 上限で safe に実行

### safety guards

- **timeout enforcement** = default 60_000ms、 超過時 SIGKILL + timedOut=true
- **buffer 上限** = default 10MB、 超過時 `[buffer exceeded]` suffix + SIGKILL
- **args 上限** = 32 個、 超過で throw (shell injection surface 抑制)
- **shell 実行拒否** = spawn options で shell: false 固定
- **detached 実行拒否** = spawn options で detached: false 固定
- **env sanitize** = 6 CLI ごと per-command allowlist、 secret 漏洩防止

### 1 new dogfood app + 1 tutorial + migration + concept

- **dogfood-mobile-v06-spawn-app** = dry-run + DI + sanitize の 3 pattern workflow、 10 test
- **[Tutorial 115 — Mobile v0.6 real spawn](https://cardene777.github.io/kiwa/tutorials/115-mobile-v06-spawn)**
- Migration guide v1.54 → v1.55 additive + 3 pattern SSOT + depth-5 pattern 実装完成
- Concept doc `mobile-testing-v06-spawn.md` = spawn-executor SSOT + per-command allowlist 表 + safety guards + depth-5 pattern 実装完成 SSOT + Phase 7 計画

## 33 milestone 連続 snippet validation streak 達成、 systematic pattern SSOT 30 度突入

v1.23 → v1.55 = 33 milestone 連続、 kiwa 史上最長記録更新継続。 systematic root cause pattern SSOT (release script filter 存在確認) は **30 度目適用**、 30 度突入で「絶対的 rule」 として認知可能に到達。

## インストール

```bash
pnpm add -D @kiwa/mobile@^0.6
```

## Migration guide

[v1.54 → v1.55](https://cardene777.github.io/kiwa/migrations/v1.54-to-v1.55)

## 次に何が来るか

v1.56 前後 = 4 候補。

- **他 pair depth-5 拡張** = v1.40 AI/LLM (v1.12→v1.15→v1.25→v1.40) / v1.41 Payment (v1.14→v1.23→v1.33→v1.41) / v1.42 Observability (v1.14→v1.17→v1.35→v1.42) の depth-4 record から depth-5 拡張、 **depth-5 pattern 2 例目 → 3 例安定化 candidate**
- **他 pair 4 段化** = Search / Auth / Realtime / Frontend の 3 段記録から 4 段拡張、 depth-4 pattern 5 例目 candidate
- **横串 sweep 4 例目** = v1.30 a11y + v1.25 perf + v1.27 mutation の pair pattern、 kiwa 全 41 package 横串
- **v2.0 milestone Desktop adapter** (Electron + Tauri) = base pair 第 14、 平面拡大
