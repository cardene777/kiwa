// v1.47-2 real adapter env-gate test — env 未設定時 throw、 設定時 pass。
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  containerSecurityRealAdapter,
  dastRealAdapter,
  iacScanRealAdapter,
  sastRealAdapter,
  scaRealAdapter,
  secretScanRealAdapter,
  type AdapterInvocation,
} from '../../src/adapters/index.js';

const inv: AdapterInvocation = { scanId: 'real-test', target: '/repo', mode: 'real' };

const savedEnv: Record<string, string | undefined> = {};
const targetKeys = [
  'KIWA_SECURITY_MODE',
  'KIWA_SEMGREP_URL',
  'KIWA_TRIVY_URL',
  'KIWA_GITLEAKS_URL',
  'KIWA_TFSEC_URL',
  'KIWA_ZAP_URL',
  'KIWA_GRYPE_URL',
];

describe('DevSecOps real adapter env-gate', () => {
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

  it('SAST real adapter throws without KIWA_SECURITY_MODE=real', async () => {
    await expect(sastRealAdapter.scan(inv)).rejects.toThrow(/KIWA_SECURITY_MODE/);
  });

  it('SCA real adapter throws without env', async () => {
    await expect(scaRealAdapter.scan(inv)).rejects.toThrow(/KIWA_SECURITY_MODE/);
  });

  it('Secret real adapter throws without env', async () => {
    await expect(secretScanRealAdapter.scan(inv)).rejects.toThrow(/KIWA_SECURITY_MODE/);
  });

  it('IaC real adapter throws without env', async () => {
    await expect(iacScanRealAdapter.scan(inv)).rejects.toThrow(/KIWA_SECURITY_MODE/);
  });

  it('DAST real adapter throws without env', async () => {
    await expect(dastRealAdapter.scan(inv)).rejects.toThrow(/KIWA_SECURITY_MODE/);
  });

  it('Container real adapter throws without env', async () => {
    await expect(containerSecurityRealAdapter.scan(inv)).rejects.toThrow(/KIWA_SECURITY_MODE/);
  });

  it('SAST real adapter throws when mode=real but URL env missing', async () => {
    process.env.KIWA_SECURITY_MODE = 'real';
    await expect(sastRealAdapter.scan(inv)).rejects.toThrow(/semgrep URL env/);
  });

  it('SAST real adapter succeeds when mode=real + KIWA_SEMGREP_URL set', async () => {
    process.env.KIWA_SECURITY_MODE = 'real';
    process.env.KIWA_SEMGREP_URL = 'http://mock-semgrep.local';
    const result = await sastRealAdapter.scan(inv);
    expect(result.mode).toBe('real');
    expect(result.axis).toBe('sast');
    expect(result.completed).toBe(true);
  });

  it('SCA real adapter succeeds when mode=real + KIWA_TRIVY_URL set', async () => {
    process.env.KIWA_SECURITY_MODE = 'real';
    process.env.KIWA_TRIVY_URL = 'http://mock-trivy.local';
    const result = await scaRealAdapter.scan(inv);
    expect(result.mode).toBe('real');
    expect(result.axis).toBe('sca');
    expect(result.completed).toBe(true);
  });

  it('all 6 real adapters succeed when all URL env set', async () => {
    process.env.KIWA_SECURITY_MODE = 'real';
    process.env.KIWA_SEMGREP_URL = 'http://x';
    process.env.KIWA_TRIVY_URL = 'http://x';
    process.env.KIWA_GITLEAKS_URL = 'http://x';
    process.env.KIWA_TFSEC_URL = 'http://x';
    process.env.KIWA_ZAP_URL = 'http://x';
    process.env.KIWA_GRYPE_URL = 'http://x';
    const results = await Promise.all([
      sastRealAdapter.scan(inv),
      scaRealAdapter.scan(inv),
      secretScanRealAdapter.scan(inv),
      iacScanRealAdapter.scan(inv),
      dastRealAdapter.scan(inv),
      containerSecurityRealAdapter.scan(inv),
    ]);
    for (const r of results) {
      expect(r.mode).toBe('real');
      expect(r.completed).toBe(true);
    }
  });
});
