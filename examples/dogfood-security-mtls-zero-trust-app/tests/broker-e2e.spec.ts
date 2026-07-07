/**
 * Broker end-to-end fidelity spec (broker axis: combined mtls + zt
 * decision).
 *
 * Issue CAR-864 (v1.39-2) AC — the broker surface enforces the "both
 * must pass" invariant. This spec covers the four truth table entries
 * (mtlsOk × ztOk) + session lifecycle guards + validation.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import {
  handleBrokerRequest,
  validateBrokerRequest,
} from '../src/app/broker/route.js';
import type { SecurityAdapter } from '../src/adapters/interface.js';

let mock: SecurityAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — broker decideBroker truth table', () => {
  it('admits when both mtlsOk and ztOk are true', async () => {
    await mock.startBroker({
      sessionId: 'b1',
      mtlsTarget: 'istio',
      ztTarget: 'opa',
    });
    const result = await mock.decideBroker({
      sessionId: 'b1',
      mtlsOk: true,
      ztOk: true,
    });
    expect(result.admitted).toBe(true);
    expect(result.reason).toBe('admitted');
  });

  it('denies when only mtlsOk is false', async () => {
    await mock.startBroker({
      sessionId: 'b2',
      mtlsTarget: 'istio',
      ztTarget: 'opa',
    });
    const result = await mock.decideBroker({
      sessionId: 'b2',
      mtlsOk: false,
      ztOk: true,
    });
    expect(result.admitted).toBe(false);
    expect(result.reason).toBe('mtls_denied');
  });

  it('denies when only ztOk is false', async () => {
    await mock.startBroker({
      sessionId: 'b3',
      mtlsTarget: 'istio',
      ztTarget: 'opa',
    });
    const result = await mock.decideBroker({
      sessionId: 'b3',
      mtlsOk: true,
      ztOk: false,
    });
    expect(result.admitted).toBe(false);
    expect(result.reason).toBe('zt_denied');
  });

  it('denies with combined reason when both are false', async () => {
    await mock.startBroker({
      sessionId: 'b4',
      mtlsTarget: 'istio',
      ztTarget: 'opa',
    });
    const result = await mock.decideBroker({
      sessionId: 'b4',
      mtlsOk: false,
      ztOk: false,
    });
    expect(result.admitted).toBe(false);
    expect(result.reason).toBe('mtls_and_zt_denied');
  });
});

describe('mock adapter — broker session lifecycle', () => {
  it('rejects decideBroker on unknown session', async () => {
    await expect(
      mock.decideBroker({
        sessionId: 'ghost',
        mtlsOk: true,
        ztOk: true,
      }),
    ).rejects.toThrow(/broker_session_not_found/);
  });

  it('rejects startBroker for duplicate sessionId', async () => {
    await mock.startBroker({
      sessionId: 'dup',
      mtlsTarget: 'istio',
      ztTarget: 'opa',
    });
    await expect(
      mock.startBroker({
        sessionId: 'dup',
        mtlsTarget: 'istio',
        ztTarget: 'opa',
      }),
    ).rejects.toThrow(/broker_session_exists/);
  });

  it('rejects closeBroker for unknown session', async () => {
    await expect(
      mock.closeBroker({ sessionId: 'ghost' }),
    ).rejects.toThrow(/broker_session_not_found/);
  });

  it('closeBroker removes the session; subsequent decide fails', async () => {
    await mock.startBroker({
      sessionId: 'lc1',
      mtlsTarget: 'istio',
      ztTarget: 'opa',
    });
    await mock.closeBroker({ sessionId: 'lc1' });
    await expect(
      mock.decideBroker({
        sessionId: 'lc1',
        mtlsOk: true,
        ztOk: true,
      }),
    ).rejects.toThrow(/broker_session_not_found/);
  });
});

describe('validateBrokerRequest — request shape', () => {
  it('rejects non-object body', () => {
    expect(validateBrokerRequest(null).ok).toBe(false);
  });

  it('rejects missing sessionId', () => {
    const parsed = validateBrokerRequest({
      kind: 'decide',
      mtlsOk: true,
      ztOk: true,
    });
    expect(parsed.ok).toBe(false);
  });

  it('rejects unknown kind', () => {
    const parsed = validateBrokerRequest({
      kind: 'nope',
      sessionId: 's',
      mtlsOk: true,
      ztOk: true,
    });
    expect(parsed.ok).toBe(false);
  });

  it('rejects non-boolean mtlsOk', () => {
    const parsed = validateBrokerRequest({
      kind: 'decide',
      sessionId: 's',
      mtlsOk: 'yes',
      ztOk: true,
    });
    expect(parsed.ok).toBe(false);
  });

  it('rejects non-boolean ztOk', () => {
    const parsed = validateBrokerRequest({
      kind: 'decide',
      sessionId: 's',
      mtlsOk: true,
      ztOk: 1,
    });
    expect(parsed.ok).toBe(false);
  });

  it('parses valid decide request', () => {
    const parsed = validateBrokerRequest({
      kind: 'decide',
      sessionId: 's',
      mtlsOk: true,
      ztOk: false,
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.mtlsOk).toBe(true);
      expect(parsed.value.ztOk).toBe(false);
    }
  });
});

describe('handleBrokerRequest — dispatch', () => {
  it('dispatches decide through the adapter', async () => {
    await mock.startBroker({
      sessionId: 'h1',
      mtlsTarget: 'istio',
      ztTarget: 'opa',
    });
    const response = await handleBrokerRequest(mock, {
      kind: 'decide',
      sessionId: 'h1',
      mtlsOk: true,
      ztOk: true,
    });
    expect(response.ok).toBe(true);
    expect(response.admitted).toBe(true);
    expect(response.reason).toBe('admitted');
  });

  it('returns errorKind when session not found', async () => {
    const response = await handleBrokerRequest(mock, {
      kind: 'decide',
      sessionId: 'ghost',
      mtlsOk: true,
      ztOk: true,
    });
    expect(response.ok).toBe(false);
    expect(response.errorKind).toBe('broker_session_not_found');
  });
});

describe('real adapter — broker env gate', () => {
  it('reports KIWA_MTLS_ENV_MISSING for broker ops in default env', async () => {
    const real = makeRealAdapter();
    await expect(
      real.startBroker({
        sessionId: 's',
        mtlsTarget: 'istio',
        ztTarget: 'opa',
      }),
    ).rejects.toThrow(/KIWA_MTLS_ENV_MISSING|KIWA_MODE=mock/);
  });

  it('reports refuse for decideBroker in default env', async () => {
    const real = makeRealAdapter();
    await expect(
      real.decideBroker({
        sessionId: 's',
        mtlsOk: true,
        ztOk: true,
      }),
    ).rejects.toThrow(/KIWA_MTLS_ENV_MISSING|KIWA_MODE=mock/);
  });
});
