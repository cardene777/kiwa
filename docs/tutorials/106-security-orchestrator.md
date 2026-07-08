# DevSecOps single entry — runSecurityAudit + 4 preset in 8 min

## What you'll build

A vitest suite wired to `@kiwa/security-devsecops` v0.3 orchestrator。 `runSecurityAudit(preset, target)` single entry で skill 4 種 (security-audit / supply-chain / specialty / threat-model) 相当の workflow を 1 行で実行、 `summarizeAuditReport` で結果集約。 DevSecOps library 化 Phase 3 完成の実装 pattern。

## Prerequisites

- Node.js ≥ 20
- `pnpm`
- Empty directory

## Step-by-step build

### 1. Bootstrap

```bash
mkdir kiwa-devsecops-orchestrator && cd kiwa-devsecops-orchestrator
pnpm init
pnpm add -D @kiwa/security-devsecops@^0.3 vitest typescript @types/node
```

### 2. audit-all preset — 6 axis 全実行

`tests/audit-all.test.ts` — 単一関数で全 6 axis workflow を実行。

```ts
import { describe, expect, it } from 'vitest';
import { runSecurityAudit, summarizeAuditReport } from '@kiwa/security-devsecops';

describe('runSecurityAudit — audit-all', () => {
  it('6 axis all complete', async () => {
    const report = await runSecurityAudit({
      preset: 'audit-all',
      target: '/repo',
      mode: 'mock',
    });
    expect(report.results).toHaveLength(6);
    const summary = summarizeAuditReport(report);
    expect(summary.totalAxis).toBe(6);
    expect(summary.completedAxis).toBe(6);
  });
});
```

### 3. supply-chain preset — SCA + Container のみ

`tests/supply-chain.test.ts` — skill 「security-audit-supply-chain」 相当の workflow。

```ts
import { describe, expect, it } from 'vitest';
import { runSecurityAudit, summarizeAuditReport } from '@kiwa/security-devsecops';

describe('runSecurityAudit — supply-chain', () => {
  it('runs SCA + Container', async () => {
    const report = await runSecurityAudit({
      preset: 'supply-chain',
      target: '/repo',
      mode: 'mock',
    });
    expect(report.results).toHaveLength(2);
    const axes = report.results.map((r) => r.axis).sort();
    expect(axes).toEqual(['container-security', 'sca']);
  });
});
```

### 4. threat-model preset — STRIDE tag 添付

`tests/threat-model.test.ts` — 6 axis 実行 + STRIDE 分類 tag。

```ts
import { describe, expect, it } from 'vitest';
import { runSecurityAudit, summarizeAuditReport } from '@kiwa/security-devsecops';

describe('runSecurityAudit — threat-model', () => {
  it('runs 6 axis with STRIDE tags', async () => {
    const report = await runSecurityAudit({
      preset: 'threat-model',
      target: '/repo',
      mode: 'mock',
    });
    const summary = summarizeAuditReport(report);
    expect(summary.stridDreadTags).toBeDefined();
    expect(summary.stridDreadTags).toHaveLength(6);
    for (const t of summary.stridDreadTags ?? []) {
      expect(t.tag).toMatch(/^stride:/);
    }
  });
});
```

### 5. 実行

```bash
pnpm exec vitest run
# ✓ 3 tests pass
```

## Phase 1 + Phase 2 + Phase 3 の階層構造

- **Phase 1 (v1.46)** = v0.1 semantics 直接 = `startSastScan` + `detectSastFinding` + `completeSastScan` (低レベル、 細かく driving 可能)
- **Phase 2 (v1.47)** = v0.2 adapter = `sastMockAdapter.scan(inv)` (中レベル、 axis 単位)
- **Phase 3 (v1.48)** = v0.3 orchestrator = `runSecurityAudit({ preset })` (高レベル、 skill 単位)

3 段の階層は backward compat 絶対維持、 use case に応じて使い分け可能。

## 次の Step

- v1.48-2 dogfood app (`examples/dogfood-security-devsecops-orchestrator-app`) で 4 preset workflow reference
- `docs/concepts/security-devsecops-library-integration.md` § Phase 3 完成 SSOT で skill 4 種 × preset 対応 map
- v1.49+ で real adapter が実 CLI spawn 実装に置換、 fidelity harness で mock/real 差分監視予定
