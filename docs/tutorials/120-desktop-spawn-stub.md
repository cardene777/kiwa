# Desktop spawn stub 契約層 — child_process.spawn stub + env-gate + fail-closed in 15 min

## What you'll build

A vitest suite wired to `@kiwa-test/desktop` v0.5 (spawn stub 契約層、 v1.60 で kiwa 縦深化 pair 第 14 の第 5 段、 **depth-5 pattern 2 例目 candidate**、 **systematic pattern 35 度目適用**、 **Mobile v1.54 rhythm 再現**、 38 milestone streak)、 12 axis から抽出した 8 CLI-backed axis (electron-builder / electron-updater / ffmpeg / xclip / osascript / notify-send / defaults / reg) を `invokeDesktopCli` + `cliForAxis` + `buildSpawnInvocation` で扱う pattern、 KIWA_DESKTOP_MODE env-gate + args 上限 32 + fail-closed の 3 pattern workflow。

## Prerequisites

- Node.js ≥ 20
- `pnpm`
- `@kiwa-test/desktop` v0.5 (`pnpm add -D @kiwa-test/desktop@^0.5`)

## Step-by-step build

### 1. Bootstrap

```bash
mkdir kiwa-desktop-v05 && cd kiwa-desktop-v05
pnpm init
pnpm add -D @kiwa-test/desktop@^0.5 vitest typescript @types/node
```

### 2. Spawn-driver 契約層 (invokeDesktopCli)

```ts
import { describe, expect, it } from 'vitest';
import { invokeDesktopCli, type SpawnInvocation } from '@kiwa-test/desktop';

describe('invokeDesktopCli v0.5 stub', () => {
  it('ffmpeg 呼出 with KIWA_DESKTOP_MODE=real', async () => {
    const inv: SpawnInvocation = {
      command: 'ffmpeg',
      args: ['-i', 'input.mp4', 'output.webm'],
      env: { KIWA_DESKTOP_MODE: 'real' },
    };
    const result = await invokeDesktopCli(inv);
    expect(result.invoked).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('[v0.5 stub]');
  });

  it('fail-closed when KIWA_DESKTOP_MODE 未設定', async () => {
    await expect(invokeDesktopCli({ command: 'ffmpeg', args: [], env: {} })).rejects.toThrow(/KIWA_DESKTOP_MODE/);
  });
});
```

### 3. cliForAxis mapping (12 axis → 8 CLI + 4 null)

```ts
import { describe, expect, it } from 'vitest';
import { cliForAxis } from '@kiwa-test/desktop';

describe('cliForAxis mapping', () => {
  it('CLI-backed axis (8 axes)', () => {
    expect(cliForAxis('auto-updater')).toBe('electron-updater');
    expect(cliForAxis('screen-recording')).toBe('ffmpeg');
    expect(cliForAxis('clipboard')).toBe('xclip');
    expect(cliForAxis('notification')).toBe('notify-send');
  });

  it('non-CLI axis (4 axes) returns null', () => {
    expect(cliForAxis('electron')).toBeNull();
    expect(cliForAxis('tauri')).toBeNull();
    expect(cliForAxis('webview')).toBeNull();
    expect(cliForAxis('dark-mode')).toBeNull();
  });
});
```

### 4. buildSpawnInvocation factory

```ts
import { describe, expect, it } from 'vitest';
import { buildSpawnInvocation } from '@kiwa-test/desktop';

describe('buildSpawnInvocation', () => {
  it('default args + env', () => {
    const inv = buildSpawnInvocation({ command: 'xclip' });
    expect(inv.command).toBe('xclip');
    expect(inv.args).toEqual([]);
  });

  it('explicit args + env + cwd', () => {
    const inv = buildSpawnInvocation({
      command: 'ffmpeg',
      args: ['-i', 'in.mp4'],
      env: { KIWA_DESKTOP_MODE: 'real' },
      cwd: '/tmp',
    });
    expect(inv.args).toEqual(['-i', 'in.mp4']);
    expect(inv.cwd).toBe('/tmp');
  });
});
```

### 5. args 上限 32 + fail-closed

```ts
import { describe, expect, it } from 'vitest';
import { invokeDesktopCli } from '@kiwa-test/desktop';

describe('args 上限 + fail-closed', () => {
  it('args 33 で throw', async () => {
    const inv = {
      command: 'electron-builder' as const,
      args: new Array<string>(33).fill('a'),
      env: { KIWA_DESKTOP_MODE: 'real' },
    };
    await expect(invokeDesktopCli(inv)).rejects.toThrow(/args exceeds max 32/);
  });

  it('args 32 ちょうどは pass', async () => {
    const inv = {
      command: 'electron-builder' as const,
      args: new Array<string>(32).fill('a'),
      env: { KIWA_DESKTOP_MODE: 'real' },
    };
    const result = await invokeDesktopCli(inv);
    expect(result.invoked).toBe(true);
  });
});
```

### 6. 実行

```bash
pnpm exec vitest run
# ✓ 6 tests pass (v0.5 spawn stub 契約層)
```

## Spawn stub 契約層の 3 type SSOT

- **DesktopCliCommand** = 8 CLI 種類 (electron-builder / electron-updater / ffmpeg / xclip / osascript / notify-send / defaults / reg)
- **SpawnInvocation** = `{ command: DesktopCliCommand, args: string[], env: Record<string, string>, cwd?: string }`
- **SpawnResult** = `{ command, args, invoked, exitCode, stdout, stderr, durationMs }` (Mobile v0.5 と 1:1 shape 契約)

## 12 axis → 8 CLI + 4 non-CLI mapping (AXIS_TO_CLI)

| axis | CLI | 用途 |
|---|---|---|
| auto-updater | electron-updater | Squirrel.Mac / Squirrel.Windows / AppImage update |
| fs-permissions | osascript | macOS TCC 系 (Windows/Linux は別 CLI 候補) |
| notification | notify-send | Linux libnotify (macOS/Windows は別 CLI 候補) |
| menu-bar | electron-builder | packaging 時 template |
| tray-icon | electron-builder | packaging 時 template |
| screen-recording | ffmpeg | cross-platform screen capture |
| global-shortcut | defaults | macOS accessibility 系 |
| clipboard | xclip | Linux (macOS = pbcopy、 Windows = clip、 別 CLI 候補) |
| electron | null | native process、 CLI 不要 |
| tauri | null | native process、 CLI 不要 |
| webview | null | native process、 CLI 不要 |
| dark-mode | null | OS notification 経路、 CLI なし |

## env-gate `KIWA_DESKTOP_MODE=real` の意義

- `real` = 実 spawn 実行前提の signal、 CI 環境で 実 CLI が install されている想定
- 未設定 / `mock` = throw で fail-closed、 mock adapter (v0.4) 経路と混同を防ぐ
- v1.61+ v0.6 実 spawn 実装後は `KIWA_DESKTOP_MODE=real` かつ CLI install 済で 実 child_process.spawn 実行、 未 install 環境は `KIWA_DESKTOP_SPAWN=dry-run` (v0.6 で追加予定) で v0.5 shape 契約 復元

## args 上限 32 + fail-closed の安全性

- args 上限 32 = 実 CLI 呼出時の buffer overflow / command injection 対策
- fail-closed = env / args 不正時に silently skip でなく throw、 test で必ず検知される設計

## backward compat 絶対維持

v0.5 spawn stub 契約層の追加は additive、 v0.1 + v0.2 + v0.3 + v0.4 の 12 axis / 48 method / 48 event / 144 mapping + adapter interface + fidelity harness は完全保持。 既存 code は無修正で v0.4 → v0.5 に upgrade 可能。

## 次の Step

- v1.60-2 dogfood-desktop-spawn-app で 8 CLI stub workflow + env-gate 3 pattern の実利用例
- `docs/concepts/desktop-spawn-stub.md` で spawn-driver 契約層 SSOT
- v1.61+ で Desktop 深化 V (v0.6 実 spawn 実装完成、 depth-5 pattern 2 例目確定) 検討
