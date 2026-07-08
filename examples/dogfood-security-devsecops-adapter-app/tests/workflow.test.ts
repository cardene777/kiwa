// v1.47-3 dogfood adapter workflow — 6 axis × 2 mode × fidelity harness。
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { diffFidelity, runAdapterWorkflow } from '../src/workflow.js';

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

function setRealEnv(): void {
  process.env.KIWA_SECURITY_MODE = 'real';
  process.env.KIWA_SEMGREP_URL = 'http://mock-semgrep.local';
  process.env.KIWA_TRIVY_URL = 'http://mock-trivy.local';
  process.env.KIWA_GITLEAKS_URL = 'http://mock-gitleaks.local';
  process.env.KIWA_TFSEC_URL = 'http://mock-tfsec.local';
  process.env.KIWA_ZAP_URL = 'http://mock-zap.local';
  process.env.KIWA_GRYPE_URL = 'http://mock-grype.local';
}

describe('DevSecOps adapter dogfood workflow — mock mode', () => {
  it('runs all 6 axis mock adapters end-to-end', async () => {
    const results = await runAdapterWorkflow('mock');
    expect(results).toHaveLength(6);
    for (const r of results) {
      expect(r.mode).toBe('mock');
      expect(r.completed).toBe(true);
      expect(r.eventCount).toBeGreaterThan(0);
    }
  });

  it('SAST axis is in workflow', async () => {
    const results = await runAdapterWorkflow('mock');
    const sast = results.find((r) => r.axis === 'sast');
    expect(sast).toBeDefined();
    expect(sast?.completed).toBe(true);
  });

  it('SCA axis is in workflow', async () => {
    const results = await runAdapterWorkflow('mock');
    const sca = results.find((r) => r.axis === 'sca');
    expect(sca?.completed).toBe(true);
  });

  it('Secret axis is in workflow', async () => {
    const results = await runAdapterWorkflow('mock');
    const s = results.find((r) => r.axis === 'secret-scan');
    expect(s?.completed).toBe(true);
  });

  it('IaC axis is in workflow', async () => {
    const results = await runAdapterWorkflow('mock');
    const i = results.find((r) => r.axis === 'iac-scan');
    expect(i?.completed).toBe(true);
  });

  it('DAST axis is in workflow', async () => {
    const results = await runAdapterWorkflow('mock');
    const d = results.find((r) => r.axis === 'dast');
    expect(d?.completed).toBe(true);
  });

  it('Container axis is in workflow', async () => {
    const results = await runAdapterWorkflow('mock');
    const c = results.find((r) => r.axis === 'container-security');
    expect(c?.completed).toBe(true);
  });

  it('all 6 axis event count > 0', async () => {
    const results = await runAdapterWorkflow('mock');
    for (const r of results) {
      expect(r.eventCount).toBeGreaterThan(0);
    }
  });
});

describe('DevSecOps adapter dogfood workflow — real mode (env-gated)', () => {
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
    await expect(runAdapterWorkflow('real')).rejects.toThrow(/KIWA_SECURITY_MODE/);
  });

  it('real mode with all URL env succeeds for all 6 axis', async () => {
    setRealEnv();
    const results = await runAdapterWorkflow('real');
    expect(results).toHaveLength(6);
    for (const r of results) {
      expect(r.mode).toBe('real');
      expect(r.completed).toBe(true);
    }
  });

  it('real mode Semgrep-only env still throws for other axis', async () => {
    process.env.KIWA_SECURITY_MODE = 'real';
    process.env.KIWA_SEMGREP_URL = 'http://x';
    // sast passes but sca throws → runAdapterWorkflow throws mid-way。
    await expect(runAdapterWorkflow('real')).rejects.toThrow(/trivy URL env/);
  });
});

describe('DevSecOps adapter fidelity harness (mock vs real)', () => {
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

  it('mock + real completions match on all 6 axis', async () => {
    setRealEnv();
    const mock = await runAdapterWorkflow('mock');
    const real = await runAdapterWorkflow('real');
    const diff = diffFidelity(mock, real);
    expect(diff).toHaveLength(6);
    for (const d of diff) {
      expect(d.matched).toBe(true);
    }
  });

  it('mock has richer event trace than real placeholder', async () => {
    setRealEnv();
    const mock = await runAdapterWorkflow('mock');
    const real = await runAdapterWorkflow('real');
    const diff = diffFidelity(mock, real);
    for (const d of diff) {
      expect(d.mockEvents).toBeGreaterThanOrEqual(d.realEvents);
    }
  });

  it('all 6 axis present in fidelity diff', async () => {
    setRealEnv();
    const mock = await runAdapterWorkflow('mock');
    const real = await runAdapterWorkflow('real');
    const axes = diffFidelity(mock, real).map((d) => d.axis).sort();
    expect(axes).toEqual([
      'container-security',
      'dast',
      'iac-scan',
      'sast',
      'sca',
      'secret-scan',
    ]);
  });
});
