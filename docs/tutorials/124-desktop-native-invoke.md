# Desktop v0.9 実 native binding 呼出 (probeAndInvoke) in 15 min

## What you'll build

A vitest suite wired to `@kiwa/desktop` v0.9 (実 native binding 呼出、 v1.64 で kiwa 縦深化 pair 第 14 の第 9 段 = **depth-9 pattern 新設 candidate**、 **systematic pattern 39 度目適用**、 42 milestone streak)、 probeAndInvoke 統合経路で 4 InvokeStatus (invoked / cli-unavailable / axis-skipped / no-cli-mapping)、 実 CLI 存在時のみ 実 spawn 呼出、 未 install 時は shape 契約 preserving。 v1.62 real behavior + v1.63 probe + v1.64 実 invoke の 3 layer separation の完全 pay off phase。

## Prerequisites

- Node.js ≥ 20 + pnpm
- `@kiwa/desktop` v0.9 (`pnpm add -D @kiwa/desktop@^0.9`)

## Step-by-step build

### 1. 単一 axis 呼出 (probeAndInvoke)

```ts
import { describe, expect, it } from 'vitest';
import { probeAndInvoke } from '@kiwa/desktop';

describe('probeAndInvoke single axis', () => {
  it('electron = no-cli-mapping (semantics-only)', async () => {
    const result = await probeAndInvoke({ axis: 'electron', target: 'macos' });
    expect(result.status).toBe('no-cli-mapping');
    expect(result.spawnResult).toBeNull();
  });
});
```

### 2. Matrix 走査 (probeAndInvokeAll)

```ts
import { describe, expect, it } from 'vitest';
import { probeAndInvokeAll } from '@kiwa/desktop';

describe('probeAndInvokeAll matrix', () => {
  it('12 axis × 3 target = 36 pair 全走査', async () => {
    const summary = await probeAndInvokeAll();
    expect(summary.total).toBe(36);
    const buckets =
      summary.invoked.length +
      summary.cliUnavailable.length +
      summary.axisSkipped.length +
      summary.noCliMapping.length;
    expect(buckets).toBe(36);
  });
});
```

### 3. 4 InvokeStatus 判定

```ts
import { describe, expect, it } from 'vitest';
import { probeAndInvoke } from '@kiwa/desktop';

describe('4 status routes', () => {
  it('全 status 経路 が type-safe', async () => {
    const result = await probeAndInvoke({ axis: 'auto-updater', target: 'macos' });
    // status は invoked / cli-unavailable / axis-skipped / no-cli-mapping のいずれか
    expect(['invoked', 'cli-unavailable', 'axis-skipped', 'no-cli-mapping']).toContain(result.status);
  });
});
```

### 4. 実行

```bash
pnpm exec vitest run
```

## InvokeStatus 4 経路 SSOT

| status | 判定条件 |
|---|---|
| axis-skipped | shouldSkipAxis で skip 判定 (platform mismatch / axis-specific gate) |
| no-cli-mapping | cliForAxis(axis) = null (semantics-only: electron/tauri/webview/dark-mode) |
| cli-unavailable | probeCliAvailable で 実 CLI 未 install (which/where 失敗) |
| invoked | probe 成功 + 実 spawn 完了 |

## shape 契約 preserving

- invoked = `spawnResult` に SpawnResult 保持
- 他 3 status = `spawnResult=null` で shape 統一
- backward compat 絶対維持 (v0.1-v0.8 API 変更 0)

## 3 layer separation 完全 pay off phase

- **v1.62 real behavior** = 12 axis 別 real 経路 behavior 差別化 (metadata + duration diff)
- **v1.63 probe** = availability probe + skip 経路 (which/where + platform gate)
- **v1.64 実 invoke** = probeAndInvoke で probe → invoke 統合、 4 InvokeStatus で完全 separation

## 次の Step

- v1.64-2 dogfood-desktop-native-invoke-app で 4 pattern workflow
- `docs/concepts/desktop-native-invoke.md` で 3 layer separation SSOT
- v1.65+ で他 pair 5/6 段拡張、 v2.0 milestone coverage 100% goal
