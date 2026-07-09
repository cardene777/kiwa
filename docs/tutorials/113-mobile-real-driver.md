# Mobile v0.4 real driver adapter — mock/real pair + fidelity harness in 10 min

## What you'll build

`@kiwa-lab/mobile` v0.4 で追加された adapter interface (11 axis × mock/real = 22 adapter) + fidelity harness を使い、 3 target × 11 axis = 33 combination の mock/real trace diff 一致を検証する vitest suite。 **pair 深度 4 段拡張達成 4 例目 depth-4 record**。

## Prerequisites

- Node.js ≥ 20
- `pnpm`
- Empty directory

## Step-by-step build

### 1. Bootstrap

```bash
mkdir kiwa-mobile-real-driver && cd kiwa-mobile-real-driver
pnpm init
pnpm add -D @kiwa-lab/mobile@^0.4 vitest typescript @types/node
```

### 2. Single axis mock adapter

```ts
import { describe, expect, it } from 'vitest';
import { MOCK_ADAPTERS, type AdapterInvocation } from '@kiwa-lab/mobile';

describe('Fabric mock adapter', () => {
  it('scan completes with neutralEvents', async () => {
    const inv: AdapterInvocation = { scanId: 'demo', target: 'ios', mode: 'mock' };
    const r = await MOCK_ADAPTERS.fabric.scan(inv);
    expect(r.completed).toBe(true);
    expect(r.eventCount).toBeGreaterThan(0);
    expect(r.neutralEvents).toContain('fabric.mount_completed');
  });
});
```

### 3. Real adapter (env-gate 前提、 v1.54+ で child_process 化)

```ts
import { describe, expect, it } from 'vitest';
import { REAL_ADAPTERS, type AdapterInvocation } from '@kiwa-lab/mobile';

describe('TurboModules real adapter', () => {
  it('scan completes for android', async () => {
    const inv: AdapterInvocation = { scanId: 'demo', target: 'android', mode: 'real' };
    const r = await REAL_ADAPTERS['turbo-modules'].scan(inv);
    expect(r.completed).toBe(true);
    expect(r.mode).toBe('real');
  });
});
```

### 4. Fidelity harness — 全 11 axis で mock/real 一致検証

```ts
import { describe, expect, it } from 'vitest';
import { runFidelityCheck, summarizeFidelity, type MobileAxis } from '@kiwa-lab/mobile';

const ALL_AXES: MobileAxis[] = [
  'react-native', 'expo', 'metro',
  'navigation', 'reanimated', 'async-storage', 'secure-storage',
  'fabric', 'turbo-modules', 'codegen', 'new-architecture',
];

describe('Fidelity harness — 33 diff (11 axis × 3 target)', () => {
  it('all 33 diffs match', async () => {
    const diffs = await runFidelityCheck(ALL_AXES);
    const summary = summarizeFidelity(diffs);
    expect(summary.total).toBe(33);
    expect(summary.matched).toBe(33);
    expect(summary.mismatched).toBe(0);
  });
});
```

### 5. 実行

```bash
pnpm exec vitest run
# ✓ 3 tests pass
```

## 4 段構造の位置付け

- **v1.50 (base、 第 1 段)** = 3 axis semantics
- **v1.51 (2 段目)** = 4 advanced II axis + env-gate helper
- **v1.52 (3 段目)** = 4 advanced III axis (New Architecture)
- **v1.53 (4 段目 = pair 深度 4 段拡張達成 4 例目 depth-4 record)** = 11 axis × mock/real adapter pair + fidelity harness

v1.40 AI/LLM + v1.41 Payment + v1.42 Observability の 3 例安定化に続く **4 例目 depth-4 record**、 3 target × 11 axis × mock/real = **66 combination adapter pair** が production layer で使える状態に到達。

## 次の Step

- v1.53-2 dogfood app (`examples/dogfood-mobile-real-driver-app`) で 66 combination fidelity harness の full workflow reference
- `docs/concepts/mobile-testing-real-driver.md` = adapter interface SSOT + Phase 4 完成節
- v1.54+ で real adapter を child_process.spawn 実装 (Metro real bundle + Expo EAS CLI + Fabric native mount)
