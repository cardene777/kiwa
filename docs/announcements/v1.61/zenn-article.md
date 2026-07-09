---
title: "kiwa v1.61 リリース — Desktop 深化 V (@kiwa-lab/desktop v0.6 実 child_process.spawn 実行、 depth-5 pattern 2 例目確定 + depth-6 pattern 新設 kiwa milestone 史上初、 systematic pattern 36 度目、 39 milestone streak、 Mobile v1.55 rhythm 完全再現)"
emoji: "⚙"
type: "tech"
topics: ["testing", "vitest", "electron", "tauri", "desktop"]
published: false
---

# kiwa v1.61 リリース — Desktop 深化 V

## Summary

**Desktop 深化 V** 単軸 milestone、 v1.56-v1.60 で構築した Desktop 12 axis + adapter + fidelity + v0.5 spawn stub 契約層に **v0.6 で 実 child_process.spawn 実行を追加**、 v1.55-v1.60 4 PR rhythm 継承 (**8 milestone 連続 = 32 PR 連続同 rhythm**)、 **systematic pattern 36 度目適用**、 **39 milestone 連続 snippet validation streak** 達成、 **Mobile v1.50-v1.55 6 milestone rhythm 完全再現**、 **depth-5 pattern 2 例目確定** (Mobile v1.54-v1.55 + Desktop v1.60-v1.61 で 2 例安定化到達) + **depth-6 pattern 新設** = **kiwa milestone 史上初 depth-6 record 到達**。

## What's new

### `@kiwa-lab/desktop` v0.6 minor bump

- **[Tutorial 121 — Desktop v0.6 実 spawn 実装完成](https://cardene777.github.io/kiwa/tutorials/121-desktop-v06-spawn)**
- Migration v1.60 → v1.61 additive + 4 pattern SSOT + depth-6 pattern 新設 SSOT + depth-5 pattern 2 例目確定 SSOT
- Concept doc `desktop-v06-spawn.md` = spawn-executor 3 type SSOT + per-command env allowlist 8 CLI × env 表 + safety layer 4 段 + Mobile v1.55 rhythm 再現 + depth-6 新設 + depth-5 2 例目確定 pattern SSOT

### spawn-executor 3 type SSOT

| type | 用途 |
|---|---|
| SpawnExecutorInput | command + args + env + optional cwd + timeoutMs + maxBufferBytes |
| SpawnExecutorResult | stdout + stderr + exitCode + signal + timedOut + durationMs |
| SpawnFn | typeof nodeSpawn (DI 経路の signature) |

### COMMAND_ENV_ALLOWLIST 8 CLI × per-command env

| CLI | env allowlist |
|---|---|
| electron-builder | PATH + HOME + NODE_ENV + ELECTRON_MIRROR + BUILD_TARGET + CSC_LINK + CSC_KEY_PASSWORD |
| electron-updater | PATH + HOME + NODE_ENV + GH_TOKEN + ELECTRON_UPDATER_CACHE |
| ffmpeg | PATH + HOME + FFMPEG_PATH + FFREPORT |
| xclip | PATH + HOME + DISPLAY + WAYLAND_DISPLAY |
| osascript | PATH + HOME + LANG + USER |
| notify-send | PATH + HOME + DISPLAY + DBUS_SESSION_BUS_ADDRESS + XDG_RUNTIME_DIR |
| defaults | PATH + HOME + USER |
| reg | PATH + HOME + USERPROFILE + APPDATA + LOCALAPPDATA |

### safety layer 4 段

1. per-command env allowlist で secret 削ぎ落とし
2. timeout 60_000ms で hang child SIGKILL
3. maxBufferBytes 10 * 1024 * 1024 で buffer 上限、 exceed で SIGKILL + [buffer exceeded]
4. shell:false + detached:false で command injection + zombie process 防止

### shape 契約 preserving

Desktop v0.6 SpawnResult = Mobile v0.6 SpawnResult と 6 field 完全一致、 「stub → real の shape 契約 preserving」 pattern 2 例安定化到達。

### backward compat 絶対維持

v0.6 実 spawn 実行の追加は additive、 v0.1-v0.5 の 12 axis / 48 method + adapter + fidelity + spawn stub 契約層完全保持。 KIWA_DESKTOP_SPAWN=dry-run で v0.5 shape 復元。

### dogfood 新規

`dogfood-desktop-v06-spawn-app` = dry-run + DI + env sanitize の 3 pattern workflow、 10 test 全 PASS。 kiwa package 45 個到達 (v1.60 44 + dogfood 1)。

### 39 milestone 連続 snippet validation streak

v1.23 → v1.61 = **39 milestone**、 kiwa 史上最長記録更新継続。

### systematic pattern 36 度目適用

v1.60 35 度目 (spawn stub uniform) を継承、 desktop v0.6 spawn-executor に uniform 適用。

### Mobile v1.50-v1.55 6 milestone rhythm 完全再現

Mobile v1.50 → v1.55 の 6 milestone rhythm を Desktop pair (v1.56-v1.61) で完全再現、 depth-6 到達。

### depth-5 pattern 2 例目確定 = 2 例安定化到達

- depth-5 pattern 1 例目 = Mobile v1.54 stub + v1.55 実 spawn
- **depth-5 pattern 2 例目確定 = Desktop v1.60 stub + v1.61 実 spawn** ← v1.61

### depth-6 pattern 新設 = kiwa milestone 史上初 depth-6 record 到達

pair 深度 6 段拡張 (v0.1 → v0.2 → v0.3 → v0.4 → v0.5 → v0.6) の kiwa milestone 史上初 depth-6 record。

## Install

```bash
pnpm add -D @kiwa-lab/desktop@^0.6
```

## Code sample (4 patterns)

### Pattern 1 — dry-run 経路 (backward compat)

```ts
import { invokeDesktopCli } from '@kiwa-lab/desktop';

const result = await invokeDesktopCli({
  command: 'ffmpeg',
  args: ['-version'],
  env: { KIWA_DESKTOP_MODE: 'real', KIWA_DESKTOP_SPAWN: 'dry-run', PATH: '/usr/bin' },
});
```

### Pattern 2 — DI 経路

```ts
import { invokeDesktopCliWith, type SpawnFn } from '@kiwa-lab/desktop';

const result = await invokeDesktopCliWith(
  { command: 'ffmpeg', args: ['-version'], env: { KIWA_DESKTOP_MODE: 'real', PATH: '/usr/bin' } },
  dummySpawn,
);
```

### Pattern 3 — sanitizeEnv

```ts
import { sanitizeEnv } from '@kiwa-lab/desktop';

const clean = sanitizeEnv('electron-builder', { PATH: '/usr/bin', CSC_LINK: 'ok', SECRET_TOKEN: 'nope' });
```

### Pattern 4 — executeSpawn 低レベル API

```ts
import { executeSpawn } from '@kiwa-lab/desktop';

const result = await executeSpawn({
  command: 'ffmpeg',
  args: ['-version'],
  env: { PATH: '/usr/bin' },
  timeoutMs: 30_000,
  maxBufferBytes: 5 * 1024 * 1024,
});
```

## Migration guide

[v1.60 → v1.61](https://cardene777.github.io/kiwa/migrations/v1.60-to-v1.61)

## What's next

- v1.62+ = v0.4 real adapter を実 OS API 呼出に置換
- 他 pair depth-5 拡張 (depth-5 pattern 3 例目 candidate)
- 他 pair depth-6 拡張 (depth-6 pattern 3 例安定化 candidate)
- v2.0 milestone coverage 100% goal

## 4 sub 完遂

- v1.61-1 = desktop v0.6 spawn-executor + spawn-driver 更新 (1 new file + 4 modified、 13 test 追加、 149 test 全 PASS)
- v1.61-2 = dogfood-desktop-v06-spawn-app 新規 (5 file、 dry-run + DI + sanitize の 3 pattern、 10 test 全 PASS)
- v1.61-3 = tutorial 121 + migration + concept + snippet 39 streak (153 test 全 PASS)
- v1.61-4 = publish (plugin 1.61.0 + desktop v0.6 + announcement 9 + release-smoke + docs-e2e)
