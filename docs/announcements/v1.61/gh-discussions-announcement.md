# kiwa v1.61 released — Desktop 深化 V (v0.6 実 child_process.spawn 実行、 depth-5 pattern 2 例目確定 + depth-6 pattern 新設 candidate kiwa milestone 史上初、 systematic pattern 36 度目、 39 milestone streak、 Mobile v1.55 rhythm 完全再現)

## Summary

kiwa v1.61 is out。 **Desktop 深化 V** 単軸 milestone、 v1.56-v1.60 で構築した Desktop 12 axis + adapter + fidelity + v0.5 spawn stub 契約層に **v0.6 で 実 child_process.spawn 実行を追加**、 8 CLI × per-command env allowlist (electron-builder / electron-updater / ffmpeg / xclip / osascript / notify-send / defaults / reg) + timeout 60s + buffer 上限 10MB + shell:false + detached:false + SIGKILL + DI 経路 + KIWA_DESKTOP_SPAWN=dry-run で v0.5 shape 復元。 v1.55-v1.60 4 PR rhythm 継承 (**8 milestone 連続 = 32 PR 連続同 rhythm**)、 **systematic pattern 36 度目適用**、 **39 milestone snippet streak 達成**、 **Mobile v1.50-v1.55 6 milestone rhythm 完全再現**、 **depth-5 pattern 2 例目確定** (Mobile v1.54-v1.55 + Desktop v1.60-v1.61 で 2 例安定化到達) + **depth-6 pattern 新設** = **kiwa milestone 史上初 depth-6 record 到達**。

## What's new

### `@kiwa/desktop` v0.6 minor bump

- **spawn-executor.ts 新設** = SpawnExecutorInput + SpawnExecutorResult + SpawnFn type SSOT + COMMAND_ENV_ALLOWLIST 8 CLI 分 SSOT + sanitizeEnv + executeSpawn (timeout 60s + buffer 上限 10MB + shell:false + detached:false + SIGKILL)
- **spawn-driver.ts 更新** = invokeDesktopCli 実 spawn 実行 (executeSpawn 経由) + invokeDesktopCliWith DI 経路 + KIWA_DESKTOP_SPAWN=dry-run で v0.5 stub 相当 shape 復元
- **shape 契約 preserving** = SpawnResult 構造無変更、 stdout/stderr/exitCode/durationMs は 実 spawn からの実測値
- backward compat 絶対維持 = 既存 44 package + v0.1-v0.5 の 12 axis / 48 method + adapter + fidelity + spawn stub 契約層 完全保持

### dogfood 新規

- `dogfood-desktop-v06-spawn-app` 新規、 dry-run + DI + env sanitize の **3 pattern workflow**、 **10 test 全 PASS**
- kiwa package 45 個到達 (v1.60 44 + dogfood 1)

### 1 new tutorial + migration + concept

- **[Tutorial 121 — Desktop v0.6 実 spawn 実装完成](https://cardene777.github.io/kiwa/tutorials/121-desktop-v06-spawn)** = v0.6 実 spawn + dry-run + DI + sanitize × 15 min
- Migration v1.60 → v1.61 additive + 4 pattern SSOT + depth-6 pattern 新設 SSOT + depth-5 pattern 2 例目確定 SSOT
- Concept doc `desktop-v06-spawn.md` = spawn-executor 3 type SSOT + per-command env allowlist 8 CLI × env 表 + safety layer 4 段 + Mobile v1.55 rhythm 再現 + depth-6 新設 + depth-5 2 例目確定 pattern SSOT

### 39-milestone consecutive snippet validation streak

v1.23 → v1.61 = **39 milestone**、 kiwa 史上最長記録更新継続。

### systematic root cause pattern SSOT 36 度目適用

desktop v0.6 spawn-executor に uniform 適用、 v1.60 の 35 度目 (desktop v0.5 spawn stub uniform) を継承。

### Mobile v1.50-v1.55 6 milestone rhythm 完全再現

Mobile v1.50 (base 3 axis) → v1.51 (advanced II 4 axis) → v1.52 (advanced III 4 axis) → v1.53 (v0.4 adapter layer + fidelity harness) → v1.54 (v0.5 spawn stub 契約層) → v1.55 (v0.6 実 spawn 実装完成) の 6 milestone rhythm を Desktop pair (v1.56-v1.61) で完全再現、 **depth-6 到達**。

### depth-5 pattern 2 例目確定 = 2 例安定化到達

- depth-5 pattern 1 例目 = Mobile v1.54 stub + v1.55 実 spawn
- **depth-5 pattern 2 例目確定 = Desktop v1.60 stub + v1.61 実 spawn** ← v1.61
- 2 例安定化到達、 「pattern 化 candidate → 確定 pattern」 昇格

### depth-6 pattern 新設 = kiwa milestone 史上初 depth-6 record 到達

pair 深度 6 段拡張 (v0.1 → v0.2 → v0.3 → v0.4 → v0.5 → v0.6) の kiwa milestone 史上初 depth-6 record 到達。 3 例安定化まで v1.70+ 前後で candidate。

## Install

```bash
pnpm add -D @kiwa/desktop@^0.6
```

## Migration guide

[v1.60 → v1.61](https://cardene777.github.io/kiwa/migrations/v1.60-to-v1.61)

## What's next

- v1.62+ = v0.4 real adapter を実 OS API 呼出 (electron-updater / SCStream / NSPasteboard) に置換、 fidelity harness の behavior diff early warning 実運用開始
- 他 pair 5 段拡張 (v1.40 AI/LLM / v1.41 Payment / v1.42 Observability depth-4 → depth-5、 depth-5 pattern 3 例目 candidate)
- 他 pair 6 段拡張 (Mobile + Desktop 以外の depth-6 拡張、 depth-6 pattern 3 例安定化 candidate)
- v2.0 milestone coverage 100% goal
