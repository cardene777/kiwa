/**
 * Secrets scanning end-to-end fidelity spec (secrets-scan axis: TruffleHog
 * signature + Gitleaks style rule + rotation policy).
 *
 * Sub-Issue CAR-828 (v1.37-4) AC — the mock adapter drives a full secret
 * scanning + rotation SLA ceremony end to end and the fidelity harness
 * diffs the raw {@link TraceEvent} sequence across five axes.
 *
 *  1. scanSource returns TruffleHog / Gitleaks signature findings against
 *     a source string containing a known secret pattern.
 *  2. entropy check filters out low-entropy false positives that match a
 *     signature's regex.
 *  3. trackRotation registers a discovered finding under the session's
 *     rotation policy.
 *  4. markRotated flips the tracker into rotated state and reports whether
 *     rotation was overdue against the policy.
 *  5. scanSource on a fresh session returns an empty array for clean
 *     source.
 *
 * The real adapter is exercised through the env-detect skeleton and every
 * op refuses with `KIWA_SBOM_ENV_MISSING` on every non-integration
 * environment (the default). Downstream tests inspect
 * {@link SecurityAdapter.mode} + the trace to skip real assertions on
 * those systems.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import {
  handleSecretsScanRequest,
  validateSecretsScanRequest,
} from '../src/app/secrets-scan/route.js';
import type { SecurityAdapter } from '../src/adapters/interface.js';

// Synthetic AWS access key that matches the TruffleHog signature but is
// clearly a test fixture — the AKIA prefix + 16 uppercase characters.
const FIXTURE_AWS_KEY = 'AKIAIOSFODNN7EXAMPLE';
const FIXTURE_GH_TOKEN = 'ghp_1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';

let mock: SecurityAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — source scanning', () => {
  it('axis 1: scanSource surfaces a fixture AWS access key', async () => {
    await mock.startSecrets({ scanId: 'sc1', rotateWithinDays: 30 });
    const result = await mock.scanSource({
      scanId: 'sc1',
      source: `const key = "${FIXTURE_AWS_KEY}";`,
    });
    expect(result.findings.length).toBeGreaterThanOrEqual(1);
    expect(result.findings.some((f) => f.kind === 'aws-access-key')).toBe(true);
  });

  it('axis 1: scanSource surfaces a fixture GitHub token', async () => {
    await mock.startSecrets({ scanId: 'sc2', rotateWithinDays: 30 });
    const result = await mock.scanSource({
      scanId: 'sc2',
      source: `const token = "${FIXTURE_GH_TOKEN}";`,
    });
    expect(result.findings.some((f) => f.kind === 'github-token')).toBe(true);
  });

  it('axis 5: scanSource returns empty findings for clean source', async () => {
    await mock.startSecrets({ scanId: 'sc3', rotateWithinDays: 30 });
    const result = await mock.scanSource({
      scanId: 'sc3',
      source: 'console.log("hello world");',
    });
    expect(result.findings.length).toBe(0);
  });

  it('axis 1: scanSource records line + column of the finding', async () => {
    await mock.startSecrets({ scanId: 'sc4', rotateWithinDays: 30 });
    const result = await mock.scanSource({
      scanId: 'sc4',
      source: `line1\nconst key = "${FIXTURE_AWS_KEY}";`,
    });
    const finding = result.findings.find((f) => f.kind === 'aws-access-key');
    expect(finding?.line).toBe(2);
    expect(finding?.column).toBeGreaterThan(0);
  });

  it('axis 2: scanSource entropy filter suppresses low-entropy false positives', async () => {
    // A 40-char string of all-`A` matches the AWS secret-key regex but has
    // shannon entropy of 0, so the entropy floor (3.5) drops it.
    await mock.startSecrets({ scanId: 'sc5', rotateWithinDays: 30 });
    const lowEntropyFake = 'A'.repeat(40);
    const result = await mock.scanSource({
      scanId: 'sc5',
      source: `const key = "${lowEntropyFake}";`,
    });
    expect(result.findings.some((f) => f.kind === 'aws-secret-key')).toBe(false);
  });

  it('axis 1: scanSource without startSecrets fails', async () => {
    await expect(
      mock.scanSource({ scanId: 'missing', source: 'x' }),
    ).rejects.toThrow(/secrets_session_missing/);
  });

  it('axis 1: scanSource after closeSecrets fails', async () => {
    await mock.startSecrets({ scanId: 'sc6', rotateWithinDays: 30 });
    await mock.closeSecrets({ scanId: 'sc6' });
    await expect(
      mock.scanSource({ scanId: 'sc6', source: 'x' }),
    ).rejects.toThrow(/secrets_session_closed/);
  });
});

describe('mock adapter — rotation SLA', () => {
  it('axis 3: trackRotation records a finding under the session policy', async () => {
    await mock.startSecrets({ scanId: 'sc7', rotateWithinDays: 30 });
    await mock.scanSource({
      scanId: 'sc7',
      source: `const key = "${FIXTURE_AWS_KEY}";`,
    });
    const tracked = await mock.trackRotation({
      scanId: 'sc7',
      findingIndex: 0,
      discoveredAtMs: Date.UTC(2026, 0, 1),
    });
    expect(tracked.rotateWithinDays).toBe(30);
    expect(tracked.findingKind).toBe('aws-access-key');
  });

  it('axis 4: markRotated flips overdue=false when rotated within SLA', async () => {
    await mock.startSecrets({ scanId: 'sc8', rotateWithinDays: 30 });
    await mock.scanSource({
      scanId: 'sc8',
      source: `const key = "${FIXTURE_AWS_KEY}";`,
    });
    const discovered = Date.UTC(2026, 0, 1);
    await mock.trackRotation({ scanId: 'sc8', findingIndex: 0, discoveredAtMs: discovered });
    const rotated = await mock.markRotated({
      scanId: 'sc8',
      findingIndex: 0,
      // rotated 10 days later, well within the 30-day SLA
      rotatedAtMs: discovered + 10 * 24 * 60 * 60 * 1000,
    });
    expect(rotated.overdue).toBe(false);
  });

  it('axis 4: markRotated flips overdue=true when rotated past SLA', async () => {
    await mock.startSecrets({ scanId: 'sc9', rotateWithinDays: 7 });
    await mock.scanSource({
      scanId: 'sc9',
      source: `const key = "${FIXTURE_AWS_KEY}";`,
    });
    const discovered = Date.UTC(2026, 0, 1);
    await mock.trackRotation({ scanId: 'sc9', findingIndex: 0, discoveredAtMs: discovered });
    const rotated = await mock.markRotated({
      scanId: 'sc9',
      findingIndex: 0,
      // rotated 30 days later, past the 7-day SLA
      rotatedAtMs: discovered + 30 * 24 * 60 * 60 * 1000,
    });
    expect(rotated.overdue).toBe(true);
  });

  it('axis 3: trackRotation without matching finding fails', async () => {
    await mock.startSecrets({ scanId: 'sc10', rotateWithinDays: 30 });
    await expect(
      mock.trackRotation({ scanId: 'sc10', findingIndex: 0, discoveredAtMs: 0 }),
    ).rejects.toThrow(/secrets_finding_missing/);
  });

  it('axis 4: markRotated without matching tracker fails', async () => {
    await mock.startSecrets({ scanId: 'sc11', rotateWithinDays: 30 });
    await mock.scanSource({
      scanId: 'sc11',
      source: `const key = "${FIXTURE_AWS_KEY}";`,
    });
    // no trackRotation call → tracker[0] is undefined
    await expect(
      mock.markRotated({ scanId: 'sc11', findingIndex: 0, rotatedAtMs: 1 }),
    ).rejects.toThrow(/secrets_tracker_missing/);
  });
});

describe('secrets-scan route handler contract', () => {
  it('validateSecretsScanRequest rejects missing scanId', () => {
    const result = validateSecretsScanRequest({ kind: 'start' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('scanId_required');
  });

  it('validateSecretsScanRequest requires rotateWithinDays on start', () => {
    const result = validateSecretsScanRequest({ kind: 'start', scanId: 's' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('rotateWithinDays_required');
  });

  it('validateSecretsScanRequest requires source on scan', () => {
    const result = validateSecretsScanRequest({ kind: 'scan', scanId: 's' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('source_required');
  });

  it('handleSecretsScanRequest returns findings for a matched source', async () => {
    await mock.startSecrets({ scanId: 'sc12', rotateWithinDays: 30 });
    const response = await handleSecretsScanRequest(mock, {
      kind: 'scan',
      scanId: 'sc12',
      source: `const key = "${FIXTURE_AWS_KEY}";`,
    });
    expect(response.ok).toBe(true);
    expect(response.findings?.length).toBeGreaterThanOrEqual(1);
  });

  it('handleSecretsScanRequest surfaces adapter errors as errorKind', async () => {
    const response = await handleSecretsScanRequest(mock, {
      kind: 'scan',
      scanId: 'missing',
      source: 'x',
    });
    expect(response.ok).toBe(false);
    expect(response.errorKind).toBe('secrets_session_missing');
  });
});

describe('real adapter — env-detect skeleton', () => {
  it('detectRealEnvMissing reports KIWA_MODE=mock when explicitly set', () => {
    const prev = process.env['KIWA_MODE'];
    process.env['KIWA_MODE'] = 'mock';
    try {
      expect(detectRealEnvMissing()).toBe('KIWA_MODE=mock');
    } finally {
      if (prev === undefined) delete process.env['KIWA_MODE'];
      else process.env['KIWA_MODE'] = prev;
    }
  });

  it('makeRealAdapter refuses scanSource with KIWA_SBOM_ENV_MISSING', async () => {
    const real = makeRealAdapter();
    await expect(
      real.scanSource({ scanId: 'x', source: 'y' }),
    ).rejects.toThrow(/KIWA_SBOM_ENV_MISSING/);
  });
});
