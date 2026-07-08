# Desktop v0.6 実 child_process.spawn 実行 — spawn-executor + per-command env allowlist + timeout + buffer 上限 + DI + dry-run in 15 min

## What you'll build

A vitest suite wired to `@kiwa-test/desktop` v0.6 (実 spawn 実装完成、 v1.61 で kiwa 縦深化 pair 第 14 の第 6 段、 **depth-5 pattern 2 例目確定** + **depth-6 pattern 新設 candidate** (kiwa milestone 史上初 depth-6 record)、 **systematic pattern 36 度目適用**、 **Mobile v1.55 rhythm 再現**、 39 milestone streak)、 8 CLI-backed axis (electron-builder / electron-updater / ffmpeg / xclip / osascript / notify-send / defaults / reg) を per-command env allowlist + timeout + buffer 上限 + shell:false + detached:false + SIGKILL の安全性 pattern + DI 経路 + KIWA_DESKTOP_SPAWN=dry-run で backward compat。

## Prerequisites

- Node.js ≥ 20
- `pnpm`
- `@kiwa-test/desktop` v0.6 (`pnpm add -D @kiwa-test/desktop@^0.6`)

## Step-by-step build

### 1. Bootstrap

```bash
mkdir kiwa-desktop-v06 && cd kiwa-desktop-v06
pnpm init
pnpm add -D @kiwa-test/desktop@^0.6 vitest typescript @types/node
```

### 2. dry-run 経路 (実 CLI 未 install 環境向け backward compat)

```ts
import { describe, expect, it } from 'vitest';
import { invokeDesktopCli, type DesktopCliCommand } from '@kiwa-test/desktop';

describe('v0.6 dry-run', () => {
  it('KIWA_DESKTOP_SPAWN=dry-run で v0.5 shape 契約復元', async () => {
    const commands: DesktopCliCommand[] = ['ffmpeg', 'xclip', 'osascript'];
    for (const cmd of commands) {
      const result = await invokeDesktopCli({
        command: cmd,
        args: [],
        env: { KIWA_DESKTOP_MODE: 'real', KIWA_DESKTOP_SPAWN: 'dry-run', PATH: '/usr/bin' },
      });
      expect(result.invoked).toBe(true);
      expect(result.stdout).toContain('[v0.6 dry-run]');
    }
  });
});
```

### 3. DI 経路 (SpawnFn 注入で決定的 CI test)

```ts
import { EventEmitter } from 'node:events';
import { describe, expect, it } from 'vitest';
import { invokeDesktopCliWith, type SpawnFn } from '@kiwa-test/desktop';

class DummyChild extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
  kill(_signal?: NodeJS.Signals | number) {}
}

const makeSpawn = (stdoutText: string, exitCode: number): SpawnFn =>
  ((_c: string, _a: readonly string[]) => {
    const child = new DummyChild();
    setTimeout(() => {
      child.stdout.emit('data', Buffer.from(stdoutText));
      child.emit('close', exitCode, null);
    }, 0);
    return child as unknown as ReturnType<SpawnFn>;
  }) as unknown as SpawnFn;

describe('v0.6 DI 経路', () => {
  it('SpawnFn 注入で決定的挙動', async () => {
    const result = await invokeDesktopCliWith(
      {
        command: 'ffmpeg',
        args: ['-version'],
        env: { KIWA_DESKTOP_MODE: 'real', PATH: '/usr/bin' },
      },
      makeSpawn('ffmpeg version 6.1.1', 0),
    );
    expect(result.stdout).toBe('ffmpeg version 6.1.1');
    expect(result.exitCode).toBe(0);
  });
});
```

### 4. sanitizeEnv 経路 (per-command allowlist で secret 削ぎ落とし)

```ts
import { describe, expect, it } from 'vitest';
import { sanitizeEnv } from '@kiwa-test/desktop';

describe('v0.6 sanitizeEnv', () => {
  it('electron-builder は CSC_LINK + BUILD_TARGET を通す', () => {
    const out = sanitizeEnv('electron-builder', {
      PATH: '/usr/bin',
      CSC_LINK: 'ok',
      SECRET_TOKEN: 'nope',
    });
    expect(out.CSC_LINK).toBe('ok');
    expect(out.SECRET_TOKEN).toBeUndefined();
  });

  it('ffmpeg は FFMPEG_PATH のみ、 xclip は DISPLAY のみ', () => {
    const ffmpegOut = sanitizeEnv('ffmpeg', {
      PATH: '/usr/bin',
      FFMPEG_PATH: '/opt/ffmpeg',
      DISPLAY: ':0',
    });
    expect(ffmpegOut.FFMPEG_PATH).toBe('/opt/ffmpeg');
    expect(ffmpegOut.DISPLAY).toBeUndefined();

    const xclipOut = sanitizeEnv('xclip', {
      PATH: '/usr/bin',
      FFMPEG_PATH: '/opt/ffmpeg',
      DISPLAY: ':0',
    });
    expect(xclipOut.DISPLAY).toBe(':0');
    expect(xclipOut.FFMPEG_PATH).toBeUndefined();
  });
});
```

### 5. 実行

```bash
pnpm exec vitest run
# ✓ 4 tests pass (v0.6 実 spawn + dry-run + DI + sanitize)
```

## per-command env allowlist SSOT

| CLI | 主要 env (secret 除外) |
|---|---|
| electron-builder | PATH + HOME + NODE_ENV + ELECTRON_MIRROR + BUILD_TARGET + CSC_LINK + CSC_KEY_PASSWORD |
| electron-updater | PATH + HOME + NODE_ENV + GH_TOKEN + ELECTRON_UPDATER_CACHE |
| ffmpeg | PATH + HOME + FFMPEG_PATH + FFREPORT |
| xclip | PATH + HOME + DISPLAY + WAYLAND_DISPLAY |
| osascript | PATH + HOME + LANG + USER |
| notify-send | PATH + HOME + DISPLAY + DBUS_SESSION_BUS_ADDRESS + XDG_RUNTIME_DIR |
| defaults | PATH + HOME + USER |
| reg | PATH + HOME + USERPROFILE + APPDATA + LOCALAPPDATA |

## safety layer 4 段

1. **per-command env allowlist** = secret 漏洩防止、 command 別 env のみ通す
2. **timeout 60_000ms** = 長時間 hang child を SIGKILL、 CI stall 防止
3. **maxBufferBytes 10 * 1024 * 1024** = stdout/stderr buffer 上限、 memory 枯渇防止、 exceed で SIGKILL + [buffer exceeded] 印字
4. **shell:false + detached:false** = command injection 防止 + zombie process 防止

## shape 契約 preserving (Mobile v0.6 と 1:1)

Desktop v0.6 SpawnResult = Mobile v0.6 SpawnResult と 6 field 完全一致 (command / args / invoked / exitCode / stdout / stderr / durationMs)。 v0.5 stub + v0.6 実 spawn の shape 契約 preserving は Mobile pair (v1.54 → v1.55) + Desktop pair (v1.60 → v1.61) の 2 pair で実証、 stub → real の shape 契約 preserving pattern 2 例安定化到達。

## backward compat 絶対維持

v0.6 実 spawn 実行の追加は additive、 v0.1 + v0.2 + v0.3 + v0.4 + v0.5 の 12 axis / 48 method + adapter + fidelity + spawn stub 契約層 (invokeDesktopCli signature + SpawnResult 構造) は完全保持。 既存 code は無修正で v0.5 → v0.6 に upgrade 可能、 KIWA_DESKTOP_SPAWN=dry-run で v0.5 stub 経路の shape 契約復元。

## 次の Step

- v1.61-2 dogfood-desktop-v06-spawn-app で 3 pattern workflow (dry-run + DI + sanitize) の実利用例
- `docs/concepts/desktop-v06-spawn.md` で spawn-executor SSOT + per-command allowlist 表 + safety layer 4 段 SSOT
- v1.62+ で v0.4 real adapter を実 OS API 呼出 (electron-updater / SCStream / NSPasteboard 等) に置換、 fidelity harness の behavior diff early warning 実運用開始
