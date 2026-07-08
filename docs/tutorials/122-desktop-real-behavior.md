# Desktop v0.7 real behavior runner + fidelity harness behavior diff early warning in 15 min

## What you'll build

A vitest suite wired to `@kiwa/desktop` v0.7 (real behavior runner + fidelity harness 拡張、 v1.62 で kiwa 縦深化 pair 第 14 の第 7 段 = **depth-7 pattern 新設 candidate**、 **systematic pattern 37 度目適用**、 40 milestone streak)、 12 axis 別 mock/real の behavior 差別化 (metadata + duration) を fidelity harness で検出、 shape 契約 preserving (neutralEvents + eventCount 一致) を保ったまま early warning 検知。

## Prerequisites

- Node.js ≥ 20 + pnpm
- `@kiwa/desktop` v0.7 (`pnpm add -D @kiwa/desktop@^0.7`)

## Step-by-step build

### 1. shape 契約 preserving 検証

```ts
import { describe, expect, it } from 'vitest';
import { runFidelityCheck, summarizeFidelity } from '@kiwa/desktop';

describe('shape 契約 preserving', () => {
  it('36 pair 全 matched (neutralEvents + eventCount 一致)', async () => {
    const diffs = await runFidelityCheck({});
    expect(diffs).toHaveLength(36);
    const summary = summarizeFidelity(diffs);
    expect(summary.matchedRatio).toBe(1);
  });
});
```

### 2. behavior diff detection

```ts
import { describe, expect, it } from 'vitest';
import { runFidelityCheck, summarizeFidelityBehaviorDiff } from '@kiwa/desktop';

describe('v0.7 behavior diff early warning', () => {
  it('mock/real の metadata 差異が per-axis 検出される', async () => {
    const diffs = await runFidelityCheck({});
    const summary = summarizeFidelityBehaviorDiff(diffs);
    expect(summary.axesWithBehaviorDiff.length).toBeGreaterThan(0);
    expect(summary.totalMetadataDiffs).toBeGreaterThan(0);
  });
});
```

### 3. per-step per-key diff drill-down

```ts
import { describe, expect, it } from 'vitest';
import { runFidelityCheck } from '@kiwa/desktop';

describe('per-axis drill-down', () => {
  it('auto-updater = mock 42MB vs real 128MB を検出', async () => {
    const diffs = await runFidelityCheck({ axes: ['auto-updater'], targets: ['macos'] });
    const bytesDiff = diffs[0]?.metadataDiffs.find(
      (m) => m.neutralEvent === 'auto-updater.update_downloaded' && m.key === 'bytes',
    );
    expect(bytesDiff?.mockValue).toBe(42_000_000);
    expect(bytesDiff?.realValue).toBe(128_000_000);
  });
});
```

### 4. 実行

```bash
pnpm exec vitest run
```

## fidelity harness 拡張 3 type SSOT

| type | 用途 |
|---|---|
| MetadataDiff | stepIndex + neutralEvent + key + mockValue + realValue |
| FidelityDiff (拡張) | shape 契約 preserving field + metadataDiffs + durationDiffMs |
| FidelityBehaviorSummary | total + axesWithBehaviorDiff + totalMetadataDiffs + perAxis (metadataDiffCount + maxDurationDiffMs + hasBehaviorDiff) |

## 12 axis 別 real behavior 差別化 pattern

| axis | mock behavior | real behavior |
|---|---|---|
| electron | `mock-{scanId}` app ID | `real-app-{target}` production ID |
| tauri | `mock-{scanId}` app name | `real-tauri-{target}` + native invoke |
| webview | `mock-{scanId}` webview ID | `production-webview` + productionAPI |
| auto-updater | 42MB update | 128MB update + v2.5.0 |
| fs-permissions | `/{scanId}/data` | `/Users/production/Documents` |
| notification | scheduled at 1000ms | scheduled at 0 + display at 800ms |
| menu-bar | file + edit items | app + help items (F1 accelerator) |
| tray-icon | `/app/icon.png` | `/opt/app/assets/tray-icon@2x.png` + connection status |
| screen-recording | 1MB + 2MB chunks | 4K chunks (8MB × 2) |
| global-shortcut | Cmd+Shift+P + Cmd+Shift+O | Cmd+Shift+Space + Cmd+Alt+K |
| clipboard | "hello adapter" | production URL |
| dark-mode | initialTheme=light | initialTheme=no-preference |

## shape 契約 preserving 絶対維持

v0.7 real behavior runner の追加は additive、 neutralEvents 順序 + eventCount は mock と一致 (matched=true 継続)、 metadata + state のみ差別化。 backward compat 絶対維持で v0.1-v0.6 API 変更 0。

## 次の Step

- v1.62-2 dogfood-desktop-real-behavior-app で verifyShapeContract + runEarlyWarningReport + drillDownAxisDiff の 3 pattern
- `docs/concepts/desktop-real-behavior.md` で real-runner + fidelity harness 拡張 SSOT
- v1.63+ で real adapter の native binding 実装 (electron-updater 実 network call / SCStream 実 permission check 等) 検討
