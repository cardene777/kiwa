# Desktop v0.8 native binding availability probe + skip 経路 in 15 min

## What you'll build

A vitest suite wired to `@kiwa/desktop` v0.8 (probe layer、 v1.63 で kiwa 縦深化 pair 第 14 の第 8 段 = **depth-8 pattern 新設 candidate**、 **systematic pattern 38 度目適用**、 41 milestone streak)、 8 CLI availability probe + platform gate + 12 axis 別 skip strategy + fidelity harness probe 統合、 実 CLI 未 install 環境でも決定的 test 成立。

## Prerequisites

- Node.js ≥ 20 + pnpm
- `@kiwa/desktop` v0.8 (`pnpm add -D @kiwa/desktop@^0.8`)

## Step-by-step build

### 1. CLI availability probe

```ts
import { describe, expect, it } from 'vitest';
import { probeCliAvailable } from '@kiwa/desktop';

describe('probe CLI', () => {
  it('ffmpeg 存在確認 (which/where)', async () => {
    const result = await probeCliAvailable({ command: 'ffmpeg' });
    // 現 platform に ffmpeg が install されていれば available=true、 probePath 取得
    expect(typeof result.available).toBe('boolean');
    expect(typeof result.durationMs).toBe('number');
  });
});
```

### 2. Platform gate + skip 判定

```ts
import { describe, expect, it } from 'vitest';
import { shouldSkipAxis, platformGate } from '@kiwa/desktop';

describe('platform gate + skip', () => {
  it('electron / tauri / webview / dark-mode = semantics-only、 skip なし', () => {
    for (const axis of ['electron', 'tauri', 'webview', 'dark-mode'] as const) {
      for (const target of ['macos', 'windows', 'linux'] as const) {
        expect(shouldSkipAxis(axis, target).skip).toBe(false);
      }
    }
  });
});
```

### 3. Fidelity harness probe 統合

```ts
import { describe, expect, it } from 'vitest';
import { runFidelityCheckWithProbe } from '@kiwa/desktop';

describe('probe-aware fidelity check', () => {
  it('diffs + skippedPairs 両方返却、 総和 = 36 pair', async () => {
    const { diffs, skippedPairs } = await runFidelityCheckWithProbe({});
    expect(diffs.length + skippedPairs.length).toBe(36);
  });
});
```

### 4. 実行

```bash
pnpm exec vitest run
```

## probe layer 5 type SSOT

| type | 用途 |
|---|---|
| ProbeInput | command + platform (optional) + spawnFn (optional DI) |
| ProbeResult | command + platform + available + probePath + durationMs |
| PlatformGate | target + platform + compatible |
| NodePlatform | 'darwin' \| 'linux' \| 'win32' \| 'other' |
| SkippedPair | axis + target + reason (fidelity harness 経路) |

## 12 axis 別 skip strategy SSOT

| axis | skip pattern |
|---|---|
| electron / tauri / webview / dark-mode | semantics-only、 常に skip=false |
| auto-updater / menu-bar / tray-icon / screen-recording | platform mismatch のみで skip |
| fs-permissions / global-shortcut | darwin 以外で skip (osascript / defaults 依存) |
| notification / clipboard | linux 以外で skip (notify-send / xclip 依存) |

## shape 契約 preserving 絶対維持

skip した pair は runFidelityCheckWithProbe の diffs から除外、 skippedPairs metadata で追跡。 diffs 内 pair は 従来通り matched=true (shape 契約 preserving 継続)。

## 次の Step

- v1.63-2 dogfood-desktop-probe-app で 4 pattern workflow
- `docs/concepts/desktop-probe.md` で probe layer + skip strategy SSOT
- v1.64+ で実 native binding 呼出 (probe availability 判定で 実 CLI 存在時のみ 呼出) 検討
