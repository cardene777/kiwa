// v1.48-2 orchestrator dogfood — 4 preset workflow + summary。
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runAllSkills, runSkill } from '../src/skill-runner.js';

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

describe('runSkill — 4 preset dogfood workflow (mock mode)', () => {
  it('audit-all skill runs and summarizes', async () => {
    const r = await runSkill('audit-all');
    expect(r.preset).toBe('audit-all');
    expect(r.report.results).toHaveLength(6);
    expect(r.summary.totalAxis).toBe(6);
    expect(r.summary.completedAxis).toBe(6);
  });

  it('supply-chain skill runs SCA + Container only', async () => {
    const r = await runSkill('supply-chain');
    expect(r.report.results).toHaveLength(2);
    expect(r.summary.totalAxis).toBe(2);
    expect(r.summary.completedAxis).toBe(2);
  });

  it('specialty skill runs SAST + Secret + DAST', async () => {
    const r = await runSkill('specialty');
    expect(r.report.results).toHaveLength(3);
    const axes = r.report.results.map((x) => x.axis).sort();
    expect(axes).toEqual(['dast', 'sast', 'secret-scan']);
  });

  it('threat-model skill runs 6 axis + STRIDE tags', async () => {
    const r = await runSkill('threat-model');
    expect(r.report.results).toHaveLength(6);
    expect(r.summary.stridDreadTags).toBeDefined();
    expect(r.summary.stridDreadTags).toHaveLength(6);
  });

  it('summary total events > 0 for all preset', async () => {
    for (const p of ['audit-all', 'supply-chain', 'specialty', 'threat-model'] as const) {
      const r = await runSkill(p);
      expect(r.summary.totalEvents).toBeGreaterThan(0);
    }
  });

  it('summary totalDurationMs is non-negative for all preset', async () => {
    for (const p of ['audit-all', 'supply-chain', 'specialty', 'threat-model'] as const) {
      const r = await runSkill(p);
      expect(r.summary.totalDurationMs).toBeGreaterThanOrEqual(0);
    }
  });

  it('runAllSkills executes 4 preset serially', async () => {
    const results = await runAllSkills();
    expect(results).toHaveLength(4);
    const presets = results.map((x) => x.preset).sort();
    expect(presets).toEqual(['audit-all', 'specialty', 'supply-chain', 'threat-model']);
    for (const r of results) {
      expect(r.summary.completedAxis).toBe(r.summary.totalAxis);
    }
  });

  it('perAxis field lists axis + completed + eventCount', async () => {
    const r = await runSkill('audit-all');
    for (const pa of r.summary.perAxis) {
      expect(pa.axis).toMatch(/^(sast|sca|secret-scan|iac-scan|dast|container-security)$/);
      expect(pa.completed).toBe(true);
      expect(pa.eventCount).toBeGreaterThan(0);
    }
  });
});

describe('runSkill — real mode env-gate (dogfood)', () => {
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

  it('real mode without env throws (fail-closed)', async () => {
    await expect(runSkill('audit-all', '/repo', 'real')).rejects.toThrow(/KIWA_SECURITY_MODE/);
  });

  it('real mode with all env passes', async () => {
    process.env.KIWA_SECURITY_MODE = 'real';
    process.env.KIWA_SEMGREP_URL = 'http://x';
    process.env.KIWA_TRIVY_URL = 'http://x';
    process.env.KIWA_GITLEAKS_URL = 'http://x';
    process.env.KIWA_TFSEC_URL = 'http://x';
    process.env.KIWA_ZAP_URL = 'http://x';
    process.env.KIWA_GRYPE_URL = 'http://x';
    const r = await runSkill('audit-all', '/repo', 'real');
    expect(r.report.mode).toBe('real');
    expect(r.summary.completedAxis).toBe(6);
  });

  it('real mode supply-chain with SCA + Container env only passes', async () => {
    process.env.KIWA_SECURITY_MODE = 'real';
    process.env.KIWA_TRIVY_URL = 'http://x';
    process.env.KIWA_GRYPE_URL = 'http://x';
    const r = await runSkill('supply-chain', '/repo', 'real');
    expect(r.summary.completedAxis).toBe(2);
  });
});
