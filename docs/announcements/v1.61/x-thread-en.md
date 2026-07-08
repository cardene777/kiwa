# kiwa v1.61 x-thread (English)

## Tweet 1 — hook

kiwa v1.61 is out — Desktop deepening V. **@kiwa-test/desktop v0.6** adds real child_process.spawn execution, spawn-executor + 8 CLI per-command env allowlist + timeout 60s + buffer cap 10MB + shell:false + detached:false + SIGKILL + DI path + KIWA_DESKTOP_SPAWN=dry-run for v0.5 shape restoration. Inherits v1.55-v1.60 4-PR rhythm (**8 milestones consecutive = 32 PRs same rhythm**), **systematic pattern 36th application**, **depth-6 pattern new = kiwa milestone all-time first depth-6 record reached** + **depth-5 pattern 2nd case confirmed**.

## Tweet 2 — spawn-executor + safety layer 4 tiers

spawn-executor = SpawnExecutorInput + SpawnExecutorResult + SpawnFn 3 type SSOT + COMMAND_ENV_ALLOWLIST 8 CLI (electron-builder: CSC_LINK / electron-updater: GH_TOKEN / ffmpeg: FFMPEG_PATH / xclip: DISPLAY / osascript: LANG / notify-send: DBUS / defaults: USER / reg: USERPROFILE + APPDATA). Safety layer 4 tiers = per-command allowlist secret stripping + timeout SIGKILL + buffer cap SIGKILL + shell:false command injection prevention + detached:false zombie prevention. Shape contract preserving = SpawnResult 6 fields fully retained.

## Tweet 3 — dogfood + 39-milestone streak

dogfood-desktop-v06-spawn-app new, 3 pattern workflow (dry-run + DI + env sanitize), 10 tests all pass. kiwa package count reaches 45 (v1.60 44 + dogfood 1). **39-milestone consecutive snippet-validation streak** (v1.23-v1.61) achieved — kiwa's all-time record continues.

## Tweet 4 — install + Mobile v1.55 rhythm fully reproduced + v1.62 roadmap

`pnpm add -D @kiwa-test/desktop@^0.6`. Migration: https://cardene777.github.io/kiwa/migrations/v1.60-to-v1.61

**Mobile v1.50-v1.55 (base → advanced II → advanced III → adapter → spawn stub → real spawn) 6-milestone rhythm fully reproduced in Desktop pair (v1.56-v1.61)**, depth-6 reached (**kiwa milestone all-time first**) + depth-5 pattern 2nd case confirmed (2-case stabilization reached). v1.62+ will replace v0.4 real adapter with actual OS API calls (electron-updater / SCStream / NSPasteboard). Backward compat absolutely preserved — v0.1-v0.5 fully retained.

4 subs completed (v1.61-1 desktop v0.6 real spawn / v1.61-2 dogfood new / v1.61-3 docs 39 streak / v1.61-4 publish).

#kiwa #desktop #spawn #depth6 #depth5 #testing #vitest
