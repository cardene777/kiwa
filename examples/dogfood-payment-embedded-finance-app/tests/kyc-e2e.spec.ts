/**
 * KYC / KYB end-to-end fidelity spec (kyc axis: individual verify +
 * business verify + aggregate score threshold).
 *
 * Issue CAR-978 (v1.41-2) AC — the mock adapter drives a full KYC + KYB
 * ceremony end to end and the fidelity harness diffs the raw
 * {@link TraceEvent} sequence across five axes.
 *
 *  1. verifyIndividual passes when the score meets minScore and fails
 *     otherwise; scores outside 0-100 are rejected outright.
 *  2. verifyBusiness marks the KYB status verified when the registry
 *     signal is ok and failed when not.
 *  3. checkScoreThreshold compares aggregate KYC + KYB score against a
 *     minRequired threshold with a strict >= semantics.
 *  4. closeKyc terminates the session and forwards state to
 *     `@kiwa-lab/payment` v0.5 closeAccount.
 *  5. Route handler dispatches the shape variations exposed over HTTP
 *     without spinning up a Node server.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import { handleKycRequest, validateKycRequest } from '../src/app/kyc/route.js';
import type { PaymentAdapter } from '../src/adapters/interface.js';

let mock: PaymentAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — KYC individual verification', () => {
  it('axis 1: verifyIndividual passes when score meets minScore', async () => {
    await mock.startKyc({ sessionId: 'k1', customerId: 'cus_a', provider: 'stripe-treasury' });
    const result = await mock.verifyIndividual({
      sessionId: 'k1',
      score: 82,
      minScore: 60,
    });
    expect(result.passed).toBe(true);
    expect(result.score).toBe(82);
    const trace = mock.traces().find((t) => t.op === 'verifyIndividual');
    expect(trace?.ok).toBe(true);
  });

  it('axis 1: verifyIndividual fails when score below minScore', async () => {
    await mock.startKyc({ sessionId: 'k2', customerId: 'cus_a', provider: 'stripe-treasury' });
    const result = await mock.verifyIndividual({
      sessionId: 'k2',
      score: 40,
      minScore: 60,
    });
    expect(result.passed).toBe(false);
  });

  it('axis 1: verifyIndividual accepts a boundary-equal score', async () => {
    await mock.startKyc({ sessionId: 'k3', customerId: 'cus_a', provider: 'persona' });
    const result = await mock.verifyIndividual({
      sessionId: 'k3',
      score: 60,
      minScore: 60,
    });
    expect(result.passed).toBe(true);
  });

  it('axis 1: verifyIndividual rejects out-of-range score', async () => {
    await mock.startKyc({ sessionId: 'k4', customerId: 'cus_a', provider: 'persona' });
    await expect(
      mock.verifyIndividual({
        sessionId: 'k4',
        score: 150,
        minScore: 60,
      }),
    ).rejects.toThrow(/score_out_of_range/);
  });
});

describe('mock adapter — KYB business verification', () => {
  it('axis 2: verifyBusiness marks KYB verified when registryOk=true', async () => {
    await mock.startKyc({ sessionId: 'b1', customerId: 'cus_b', provider: 'stripe-treasury' });
    const result = await mock.verifyBusiness({
      sessionId: 'b1',
      businessId: 'biz_kiwa',
      registryOk: true,
    });
    expect(result.passed).toBe(true);
    expect(result.registryOk).toBe(true);
  });

  it('axis 2: verifyBusiness marks KYB failed when registryOk=false', async () => {
    await mock.startKyc({ sessionId: 'b2', customerId: 'cus_b', provider: 'stripe-treasury' });
    const result = await mock.verifyBusiness({
      sessionId: 'b2',
      businessId: 'biz_shadow',
      registryOk: false,
    });
    expect(result.passed).toBe(false);
  });

  it('axis 2: verifyBusiness rejects empty businessId', async () => {
    await mock.startKyc({ sessionId: 'b3', customerId: 'cus_b', provider: 'stripe-treasury' });
    await expect(
      mock.verifyBusiness({
        sessionId: 'b3',
        businessId: '',
        registryOk: true,
      }),
    ).rejects.toThrow(/business_id_required/);
  });
});

describe('mock adapter — KYC aggregate threshold', () => {
  it('axis 3: checkScoreThreshold passes when aggregate meets minRequired', async () => {
    await mock.startKyc({ sessionId: 'th1', customerId: 'cus_c', provider: 'persona' });
    const result = await mock.checkScoreThreshold({
      sessionId: 'th1',
      aggregateScore: 85,
      minRequired: 70,
    });
    expect(result.passed).toBe(true);
  });

  it('axis 3: checkScoreThreshold fails when aggregate below minRequired', async () => {
    await mock.startKyc({ sessionId: 'th2', customerId: 'cus_c', provider: 'persona' });
    const result = await mock.checkScoreThreshold({
      sessionId: 'th2',
      aggregateScore: 55,
      minRequired: 70,
    });
    expect(result.passed).toBe(false);
  });

  it('axis 3: checkScoreThreshold treats aggregate==minRequired as pass', async () => {
    await mock.startKyc({ sessionId: 'th3', customerId: 'cus_c', provider: 'persona' });
    const result = await mock.checkScoreThreshold({
      sessionId: 'th3',
      aggregateScore: 70,
      minRequired: 70,
    });
    expect(result.passed).toBe(true);
  });

  it('axis 3: checkScoreThreshold rejects minRequired outside 0-100', async () => {
    await mock.startKyc({ sessionId: 'th4', customerId: 'cus_c', provider: 'persona' });
    await expect(
      mock.checkScoreThreshold({
        sessionId: 'th4',
        aggregateScore: 70,
        minRequired: 120,
      }),
    ).rejects.toThrow(/min_required_out_of_range/);
  });
});

describe('mock adapter — kyc session state machine', () => {
  it('axis 4: closeKyc terminates the session; further ops fail', async () => {
    await mock.startKyc({ sessionId: 'sm1', customerId: 'cus_a', provider: 'persona' });
    await mock.closeKyc({ sessionId: 'sm1' });
    await expect(
      mock.verifyIndividual({
        sessionId: 'sm1',
        score: 82,
        minScore: 60,
      }),
    ).rejects.toThrow(/kyc_session_not_found/);
  });

  it('axis 4: startKyc rejects duplicate session id', async () => {
    await mock.startKyc({ sessionId: 'sm2', customerId: 'cus_a', provider: 'stripe-treasury' });
    await expect(
      mock.startKyc({ sessionId: 'sm2', customerId: 'cus_a', provider: 'stripe-treasury' }),
    ).rejects.toThrow(/kyc_session_exists/);
  });

  it('axis 4: rejects verifyIndividual on unknown sessionId', async () => {
    await expect(
      mock.verifyIndividual({
        sessionId: 'ghost',
        score: 82,
        minScore: 60,
      }),
    ).rejects.toThrow(/kyc_session_not_found/);
  });
});

describe('route handler — /kyc shape validation', () => {
  it('axis 5: validateKycRequest rejects unknown kind', () => {
    const result = validateKycRequest({ sessionId: 'r1', kind: 'social' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('kind_must_be_individual_business_or_threshold');
  });

  it('axis 5: validateKycRequest rejects missing score', () => {
    const result = validateKycRequest({
      sessionId: 'r2',
      kind: 'individual',
      minScore: 60,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('score_required_number');
  });

  it('axis 5: handleKycRequest dispatches the threshold op', async () => {
    await mock.startKyc({ sessionId: 'r3', customerId: 'cus_r', provider: 'persona' });
    const response = await handleKycRequest(mock, {
      kind: 'threshold',
      sessionId: 'r3',
      aggregateScore: 75,
      minRequired: 70,
    });
    expect(response.ok).toBe(true);
    expect(response.passed).toBe(true);
  });

  it('axis 5: handleKycRequest surfaces errorKind on failure', async () => {
    const response = await handleKycRequest(mock, {
      kind: 'individual',
      sessionId: 'ghost',
      score: 82,
      minScore: 60,
    });
    expect(response.ok).toBe(false);
    expect(response.errorKind).toBe('kyc_session_not_found');
  });
});

describe('real adapter — kyc env-detect', () => {
  it('real adapter refuses verifyIndividual on hermetic systems', async () => {
    const real = makeRealAdapter();
    await expect(
      real.verifyIndividual({
        sessionId: 'r-real',
        score: 82,
        minScore: 60,
      }),
    ).rejects.toThrow();
    const trace = real.traces().find((t) => t.op === 'verifyIndividual');
    expect(trace?.ok).toBe(false);
  });

  it('detectRealEnvMissing is stable across surfaces', () => {
    const first = detectRealEnvMissing();
    const second = detectRealEnvMissing();
    expect(first).toBe(second);
  });
});
