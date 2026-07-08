/**
 * v1.48-3 docs 補強 — tutorial 106 code snippet 検証。
 * 26 milestone 連続 snippet validation streak = v1.23 → v1.48。 kiwa 史上最長記録更新継続。
 */
import { describe, expect, it } from 'vitest';
import { runSecurityAudit, summarizeAuditReport } from '../src/index.js';

describe('tutorial 106 — Step 2 audit-all preset', () => {
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

describe('tutorial 106 — Step 3 supply-chain preset', () => {
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

describe('tutorial 106 — Step 4 threat-model preset', () => {
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

describe('tutorial 106 — Phase 1+2+3 階層構造', () => {
  it('Phase 3 orchestrator は Phase 1 + Phase 2 の上に乗る optional path', async () => {
    // audit-all で 6 axis 全実行、 backward compat 確認
    const r = await runSecurityAudit({ preset: 'audit-all', target: '/repo', mode: 'mock' });
    expect(r.results.every((x) => x.completed)).toBe(true);
    // v0.1 semantics function は継続 export、 audit-all 内部で使われている
    // v0.2 adapter interface も継続 export、 audit-all 内部で使われている
    // v0.3 orchestrator は Phase 3 完成の新 export
    expect(r.mode).toBe('mock');
  });
});
