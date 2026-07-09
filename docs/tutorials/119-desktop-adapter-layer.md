# Desktop adapter layer — mock/real switching + fidelity harness in 15 min

## What you'll build

A vitest suite wired to `@kiwa-lab/desktop` v0.4 (adapter interface + fidelity harness、 v1.59 で kiwa 縦深化 pair 第 14 の第 4 段、 **depth-4 record 5 例目**、 **systematic pattern 34 度目適用**、 **Mobile v1.53 rhythm 再現**、 37 milestone streak)、 12 axis × mock/real = **24 adapter pair** + 3 target × 12 axis × 2 mode = **72 combination** + 3 target × 12 axis = **36 fidelity pair** の workflow を deterministic に扱う pattern。

## Prerequisites

- Node.js ≥ 20
- `pnpm`
- `@kiwa-lab/desktop` v0.4 (`pnpm add -D @kiwa-lab/desktop@^0.4`)

## Step-by-step build

### 1. Bootstrap

```bash
mkdir kiwa-desktop-v04 && cd kiwa-desktop-v04
pnpm init
pnpm add -D @kiwa-lab/desktop@^0.4 vitest typescript @types/node
```

### 2. Adapter interface (AdapterInvocation → AdapterResult)

```ts
import { describe, expect, it } from 'vitest';
import {
  MOCK_ADAPTERS,
  REAL_ADAPTERS,
  type AdapterInvocation,
} from '@kiwa-lab/desktop';

describe('Adapter interface — 12 axis × mock/real', () => {
  it('electron mock adapter completes on macos', async () => {
    const inv: AdapterInvocation = {
      scanId: 'e-macos',
      target: 'macos',
      mode: 'mock',
    };
    const result = await MOCK_ADAPTERS['electron'].scan(inv);
    expect(result.axis).toBe('electron');
    expect(result.completed).toBe(true);
    expect(result.neutralEvents).toEqual([
      'electron.app_ready',
      'electron.window_created',
      'electron.ipc_message_dispatched',
      'electron.app_quit',
    ]);
  });

  it('clipboard real adapter produces same shape as mock', async () => {
    const mockRes = await MOCK_ADAPTERS['clipboard'].scan({
      scanId: 'shape',
      target: 'windows',
      mode: 'mock',
    });
    const realRes = await REAL_ADAPTERS['clipboard'].scan({
      scanId: 'shape',
      target: 'windows',
      mode: 'real',
    });
    expect(realRes.neutralEvents).toEqual(mockRes.neutralEvents);
    expect(realRes.eventCount).toBe(mockRes.eventCount);
  });
});
```

### 3. Fidelity harness (mock/real trace diff)

```ts
import { describe, expect, it } from 'vitest';
import { runFidelityCheck, summarizeFidelity } from '@kiwa-lab/desktop';

describe('Fidelity harness — 36 pair matched', () => {
  it('runFidelityCheck 全 36 pair matched', async () => {
    const diffs = await runFidelityCheck({});
    expect(diffs).toHaveLength(36);
    for (const d of diffs) {
      expect(d.matched).toBe(true);
      expect(d.mockEvents).toEqual(d.realEvents);
    }
  });

  it('summarizeFidelity matchedRatio 1.0', async () => {
    const diffs = await runFidelityCheck({});
    const summary = summarizeFidelity(diffs);
    expect(summary.matchedRatio).toBe(1);
    expect(summary.total).toBe(36);
  });

  it('subset axes / targets 対応', async () => {
    const diffs = await runFidelityCheck({
      axes: ['electron', 'clipboard'],
      targets: ['macos'],
    });
    expect(diffs).toHaveLength(2);
  });
});
```

### 4. 実行

```bash
pnpm exec vitest run
# ✓ 5 tests pass (v0.4 adapter interface + fidelity harness)
```

## Adapter interface types

- **AdapterInvocation** = `{ scanId: string, target: DesktopTarget, mode: 'mock'|'real', metadata?: Record<...> }`
- **AdapterResult** = `{ axis, target, mode, completed, eventCount, durationMs, history, neutralEvents }`
- **DesktopAdapter** = `{ axis: DesktopAxis, scan(inv: AdapterInvocation): Promise<AdapterResult> }`
- **AdapterMode** = `'mock' | 'real'`

## 12 axis × mock/real = 24 adapter + 72 combination

- 12 axis = v0.1 3 (electron/tauri/webview) + v0.2 5 (auto-updater/fs-permissions/notification/menu-bar/tray-icon) + v0.3 4 (screen-recording/global-shortcut/clipboard/dark-mode)
- mock/real 2 mode で 12 × 2 = **24 adapter pair**
- 3 target × 12 axis × 2 mode = **72 combination**
- 3 target × 12 axis = **36 fidelity pair** (mock/real 一致検証)

## Fidelity harness — shape 契約 preserving 段階

現段階 (v0.4) では mock/real 全 36 pair で neutralEvents 一致 = matched。 v1.60+ で real adapter を実 OS API 呼出 (electron-updater / SCStream / NSPasteboard 等) に置換した際、 behavior diff が発生したら本 harness が early warning を出す設計。

## backward compat 絶対維持

v0.4 adapter layer の追加は additive、 v0.1 + v0.2 + v0.3 の 12 axis / 48 method / 48 event / 144 mapping は完全保持。 既存 code は無修正で v0.3 → v0.4 に upgrade 可能。

## 次の Step

- v1.59-2 dogfood-desktop-adapter-app で 72 combination + 36 fidelity workflow の実利用例
- `docs/concepts/desktop-adapter-layer.md` で adapter interface + fidelity harness の設計 SSOT
- v1.60+ で Desktop 深化 IV (v0.5 spawn stub: Mobile v0.5 pattern 転用、 depth-5 pattern 2 例目 candidate) 検討
