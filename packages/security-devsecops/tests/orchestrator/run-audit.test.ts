// v1.48-1 orchestrator — runSecurityAudit + 4 preset behavior test。
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  axisForPreset,
  runSecurityAudit,
  summarizeAuditReport,
  type AuditInvocation,
} from '../../src/index.js';

const inv = (preset: AuditInvocation['preset']): AuditInvocation => ({
  preset,
  target: '/repo',
  mode: 'mock',
});

const targetKeys = [
  'KIWA_SECURITY_MODE',
  'KIWA_SEMGREP_URL',
  'KIWA_TRIVY_URL',
  'KIWA_GITLEAKS_URL',
  'KIWA_TFSEC_URL',
  'KIWA_ZAP_URL',
  'KIWA_GRYPE_URL',
];
const savedEnv: Record<string, string | undefined> = {};

describe('runSecurityAudit — 4 preset', () => {
  it('audit-all preset runs all 6 axis', async () => {
    const r = await runSecurityAudit(inv('audit-all'));
    expect(r.results).toHaveLength(6);
    expect(r.mode).toBe('mock');
    for (const ar of r.results) {
      expect(ar.completed).toBe(true);
    }
  });

  it('supply-chain preset runs SCA + Container', async () => {
    const r = await runSecurityAudit(inv('supply-chain'));
    expect(r.results).toHaveLength(2);
    const axes = r.results.map((x) => x.axis).sort();
    expect(axes).toEqual(['container-security', 'sca']);
  });

  it('specialty preset runs SAST + Secret + DAST', async () => {
    const r = await runSecurityAudit(inv('specialty'));
    expect(r.results).toHaveLength(3);
    const axes = r.results.map((x) => x.axis).sort();
    expect(axes).toEqual(['dast', 'sast', 'secret-scan']);
  });

  it('threat-model preset runs all 6 axis', async () => {
    const r = await runSecurityAudit(inv('threat-model'));
    expect(r.results).toHaveLength(6);
  });

  it('preset SSOT map matches actual runs', async () => {
    for (const preset of ['audit-all', 'supply-chain', 'specialty', 'threat-model'] as const) {
      const expected = axisForPreset(preset);
      const r = await runSecurityAudit(inv(preset));
      expect(r.results.map((x) => x.axis)).toEqual(expected);
    }
  });
});

describe('summarizeAuditReport', () => {
  it('summarizes audit-all with 6 axis completed', async () => {
    const r = await runSecurityAudit(inv('audit-all'));
    const s = summarizeAuditReport(r);
    expect(s.totalAxis).toBe(6);
    expect(s.completedAxis).toBe(6);
    expect(s.totalEvents).toBeGreaterThan(0);
    expect(s.perAxis).toHaveLength(6);
    expect(s.stridDreadTags).toBeUndefined();
  });

  it('summarizes supply-chain with 2 axis completed', async () => {
    const r = await runSecurityAudit(inv('supply-chain'));
    const s = summarizeAuditReport(r);
    expect(s.totalAxis).toBe(2);
    expect(s.completedAxis).toBe(2);
  });

  it('threat-model summary includes STRIDE tags', async () => {
    const r = await runSecurityAudit(inv('threat-model'));
    const s = summarizeAuditReport(r);
    expect(s.stridDreadTags).toBeDefined();
    expect(s.stridDreadTags).toHaveLength(6);
    for (const t of s.stridDreadTags ?? []) {
      expect(t.tag).toMatch(/^stride:/);
    }
  });

  it('specialty preset does NOT include STRIDE tags', async () => {
    const r = await runSecurityAudit(inv('specialty'));
    const s = summarizeAuditReport(r);
    expect(s.stridDreadTags).toBeUndefined();
  });
});

describe('runSecurityAudit real mode env-gate', () => {
  beforeEach(() => {
    for (const k of targetKeys) {
      savedEnv[k] = process.env[k];
      delete process.env[k];
    }
  });
  afterEach(() => {
    for (const k of targetKeys) {
      if (savedEnv[k] === undefined) delete process.env[k];
      else process.env[k] = savedEnv[k];
    }
  });

  it('audit-all in real mode throws without env', async () => {
    await expect(
      runSecurityAudit({ preset: 'audit-all', target: '/repo', mode: 'real' }),
    ).rejects.toThrow(/KIWA_SECURITY_MODE/);
  });

  it('audit-all in real mode succeeds with all env set', async () => {
    process.env.KIWA_SECURITY_MODE = 'real';
    process.env.KIWA_SEMGREP_URL = 'http://x';
    process.env.KIWA_TRIVY_URL = 'http://x';
    process.env.KIWA_GITLEAKS_URL = 'http://x';
    process.env.KIWA_TFSEC_URL = 'http://x';
    process.env.KIWA_ZAP_URL = 'http://x';
    process.env.KIWA_GRYPE_URL = 'http://x';
    const r = await runSecurityAudit({ preset: 'audit-all', target: '/repo', mode: 'real' });
    expect(r.results).toHaveLength(6);
    expect(r.mode).toBe('real');
  });
});
