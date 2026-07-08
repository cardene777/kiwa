/**
 * v1.47-5 docs 補強 — tutorial 105 code snippet 検証。
 * 25 milestone 連続 snippet validation streak = v1.23 → v1.47。 kiwa 史上最長記録更新継続。
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  containerSecurityMockAdapter,
  dastMockAdapter,
  iacScanMockAdapter,
  sastMockAdapter,
  sastRealAdapter,
  scaMockAdapter,
  scaRealAdapter,
  secretScanMockAdapter,
  type AdapterInvocation,
} from '../src/index.js';

const inv = (scanId: string, target: string, mode: 'mock' | 'real' = 'mock'): AdapterInvocation => ({
  scanId,
  target,
  mode,
});

describe('tutorial 105 — mock adapter chain (Step 2)', () => {
  it('6 axis mock adapters all complete', async () => {
    const results = await Promise.all([
      sastMockAdapter.scan(inv('sast', '/repo')),
      scaMockAdapter.scan(inv('sca', '/repo')),
      secretScanMockAdapter.scan(inv('secret', '/repo')),
      iacScanMockAdapter.scan(inv('iac', '/tf')),
      dastMockAdapter.scan(inv('dast', 'https://target')),
      containerSecurityMockAdapter.scan(inv('container', 'nginx:latest')),
    ]);
    for (const r of results) {
      expect(r.mode).toBe('mock');
      expect(r.completed).toBe(true);
    }
  });
});

describe('tutorial 105 — real adapter env-gate (Step 3)', () => {
  beforeEach(() => {
    delete process.env.KIWA_SECURITY_MODE;
    delete process.env.KIWA_SEMGREP_URL;
  });
  afterEach(() => {
    delete process.env.KIWA_SECURITY_MODE;
    delete process.env.KIWA_SEMGREP_URL;
  });

  it('throws when KIWA_SECURITY_MODE!=real', async () => {
    await expect(sastRealAdapter.scan(inv('r1', '/repo', 'real'))).rejects.toThrow(/KIWA_SECURITY_MODE/);
  });

  it('throws when mode=real but URL missing', async () => {
    process.env.KIWA_SECURITY_MODE = 'real';
    await expect(sastRealAdapter.scan(inv('r2', '/repo', 'real'))).rejects.toThrow(/semgrep URL env/);
  });

  it('succeeds when mode=real + URL set', async () => {
    process.env.KIWA_SECURITY_MODE = 'real';
    process.env.KIWA_SEMGREP_URL = 'http://mock-semgrep.local';
    const result = await sastRealAdapter.scan(inv('r3', '/repo', 'real'));
    expect(result.mode).toBe('real');
    expect(result.completed).toBe(true);
  });
});

describe('tutorial 105 — fidelity harness (Step 4)', () => {
  beforeEach(() => {
    process.env.KIWA_SECURITY_MODE = 'real';
    process.env.KIWA_SEMGREP_URL = 'http://x';
    process.env.KIWA_TRIVY_URL = 'http://x';
  });
  afterEach(() => {
    delete process.env.KIWA_SECURITY_MODE;
    delete process.env.KIWA_SEMGREP_URL;
    delete process.env.KIWA_TRIVY_URL;
  });

  it('SAST mock + real completions match', async () => {
    const mockR = await sastMockAdapter.scan(inv('m', '/repo', 'mock'));
    const realR = await sastRealAdapter.scan(inv('r', '/repo', 'real'));
    expect(mockR.completed).toBe(realR.completed);
  });

  it('SCA mock + real completions match', async () => {
    const mockR = await scaMockAdapter.scan(inv('m', '/repo', 'mock'));
    const realR = await scaRealAdapter.scan(inv('r', '/repo', 'real'));
    expect(mockR.completed).toBe(realR.completed);
  });
});
