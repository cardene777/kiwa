/**
 * Mock adapter — drives `@kiwa/security` v0.2 mtls + zero-trust
 * semantics (startMtlsSession / completeHandshake / verifyPin / verifyOcsp
 * / checkCtLog / startZeroTrustSession / evaluatePosture / scoreRisk /
 * requestJit / enforceMicroSegment) so the same app code exercises a
 * deterministic mTLS + Zero-trust ceremony without a real Istio + OPA
 * broker. Both mock and real adapters satisfy {@link SecurityAdapter}, so
 * the fidelity harness can diff them side-by-side.
 *
 * State model — one session per (sessionId) tuple across each surface;
 * each session is isolated so per-surface metrics stay separated. The
 * broker surface layers a combined decision on top of the two axis
 * outputs so the caller can drive both an axis-only flow and a fused
 * flow through the same adapter.
 *
 * The mock intentionally piggy-backs on the same neutral event
 * vocabulary that the parent v1.39-1 semantics package emits — every op
 * appends the matching neutral event into the trace so the fidelity
 * harness can assert the mock and real adapters produce identical event
 * orderings.
 */

import {
  checkCtLog as ctLogSem,
  completeHandshake as handshakeSem,
  enforceMicroSegment as segmentSem,
  evaluatePosture as postureSem,
  requestJit as jitSem,
  scoreRisk as riskSem,
  startMtlsSession,
  startZeroTrustSession,
  verifyOcsp as ocspSem,
  verifyPin as pinSem,
  type MtlsSession,
  type SecurityAdvTarget,
  type ZeroTrustSession,
} from '@kiwa/security';
import type {
  BrokerDecideResult,
  MtlsCtResult,
  MtlsHandshakeResult,
  MtlsOcspResult,
  MtlsPinResult,
  SecurityAdapter,
  TraceEvent,
  ZtJitResult,
  ZtPostureResult,
  ZtRiskResult,
  ZtSegmentResult,
} from './interface.js';

export interface MakeMockAdapterOptions {
  /** artificial latency injected into every mock op (ms、 default 1). */
  latencyMs?: number;
}

interface BrokerSession {
  sessionId: string;
  mtlsTarget: SecurityAdvTarget;
  ztTarget: SecurityAdvTarget;
  closed: boolean;
}

export function makeMockAdapter(opts: MakeMockAdapterOptions = {}): SecurityAdapter {
  const latencyMs = opts.latencyMs ?? 1;
  const trace: TraceEvent[] = [];
  const mtls = new Map<string, MtlsSession>();
  const zt = new Map<string, ZeroTrustSession>();
  const broker = new Map<string, BrokerSession>();

  function record(
    op: TraceEvent['op'],
    ok: boolean,
    extra?: Partial<TraceEvent>,
  ): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  function coerceErrorKind(err: unknown): string {
    if (err instanceof Error) return err.message;
    return 'unknown_error';
  }

  return {
    mode: 'mock',

    async startMtls(input) {
      if (mtls.has(input.sessionId)) {
        record('startMtls', false, { errorKind: 'mtls_session_exists' });
        throw new Error('mtls_session_exists');
      }
      const session = startMtlsSession({
        target: input.target,
        sessionId: input.sessionId,
      });
      mtls.set(input.sessionId, session);
      record('startMtls', true, {
        detail: { sessionId: input.sessionId, target: input.target },
      });
    },

    async completeHandshake(input) {
      const session = mtls.get(input.sessionId);
      if (!session) {
        record('completeHandshake', false, { errorKind: 'mtls_session_not_found' });
        throw new Error('mtls_session_not_found');
      }
      try {
        handshakeSem(session, {
          peerCn: input.peerCn,
          cipherSuite: input.cipherSuite,
          tlsVersion: input.tlsVersion,
        });
        const result: MtlsHandshakeResult = {
          sessionId: input.sessionId,
          peerCn: input.peerCn,
          tlsVersion: input.tlsVersion,
          cipherSuite: input.cipherSuite,
          latencyMs,
        };
        record('completeHandshake', true, { detail: result });
        return result;
      } catch (err) {
        record('completeHandshake', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async verifyPin(input) {
      const session = mtls.get(input.sessionId);
      if (!session) {
        record('verifyPin', false, { errorKind: 'mtls_session_not_found' });
        throw new Error('mtls_session_not_found');
      }
      try {
        const step = pinSem(session, {
          spkiSha256: input.spkiSha256,
          expectedPins: input.expectedPins,
        });
        const matched = (step.metadata['matched'] as boolean) ?? false;
        const result: MtlsPinResult = {
          sessionId: input.sessionId,
          matched,
          fingerprint: input.spkiSha256,
          latencyMs,
        };
        record('verifyPin', true, { detail: result });
        return result;
      } catch (err) {
        record('verifyPin', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async verifyOcsp(input) {
      const session = mtls.get(input.sessionId);
      if (!session) {
        record('verifyOcsp', false, { errorKind: 'mtls_session_not_found' });
        throw new Error('mtls_session_not_found');
      }
      try {
        const step = ocspSem(session, {
          stapled: input.stapled,
          goodResponse: input.goodResponse,
        });
        const good = (step.metadata['good'] as boolean) ?? false;
        const result: MtlsOcspResult = {
          sessionId: input.sessionId,
          stapled: input.stapled,
          good,
          latencyMs,
        };
        record('verifyOcsp', true, { detail: result });
        return result;
      } catch (err) {
        record('verifyOcsp', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async checkCtLog(input) {
      const session = mtls.get(input.sessionId);
      if (!session) {
        record('checkCtLog', false, { errorKind: 'mtls_session_not_found' });
        throw new Error('mtls_session_not_found');
      }
      try {
        const step = ctLogSem(session, {
          sctCount: input.sctCount,
          minSctRequired: input.minSctRequired,
        });
        const ok = (step.metadata['ok'] as boolean) ?? false;
        const result: MtlsCtResult = {
          sessionId: input.sessionId,
          sctCount: input.sctCount,
          minSctRequired: input.minSctRequired,
          ok,
          latencyMs,
        };
        record('checkCtLog', true, { detail: result });
        return result;
      } catch (err) {
        record('checkCtLog', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async closeMtls(input) {
      if (!mtls.has(input.sessionId)) {
        record('closeMtls', false, { errorKind: 'mtls_session_not_found' });
        throw new Error('mtls_session_not_found');
      }
      mtls.delete(input.sessionId);
      record('closeMtls', true, { detail: { sessionId: input.sessionId } });
    },

    async startZeroTrust(input) {
      if (zt.has(input.sessionId)) {
        record('startZeroTrust', false, { errorKind: 'zt_session_exists' });
        throw new Error('zt_session_exists');
      }
      const session = startZeroTrustSession({
        target: input.target,
        sessionId: input.sessionId,
      });
      zt.set(input.sessionId, session);
      record('startZeroTrust', true, {
        detail: { sessionId: input.sessionId, target: input.target },
      });
    },

    async evaluatePosture(input) {
      const session = zt.get(input.sessionId);
      if (!session) {
        record('evaluatePosture', false, { errorKind: 'zt_session_not_found' });
        throw new Error('zt_session_not_found');
      }
      try {
        const step = postureSem(session, {
          osUpToDate: input.osUpToDate,
          diskEncrypted: input.diskEncrypted,
          edrRunning: input.edrRunning,
          mdmEnrolled: input.mdmEnrolled,
        });
        const passed = (step.metadata['passed'] as boolean) ?? false;
        const result: ZtPostureResult = {
          sessionId: input.sessionId,
          passed,
          osUpToDate: input.osUpToDate,
          diskEncrypted: input.diskEncrypted,
          edrRunning: input.edrRunning,
          mdmEnrolled: input.mdmEnrolled,
          latencyMs,
        };
        record('evaluatePosture', true, { detail: result });
        return result;
      } catch (err) {
        record('evaluatePosture', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async scoreRisk(input) {
      const session = zt.get(input.sessionId);
      if (!session) {
        record('scoreRisk', false, { errorKind: 'zt_session_not_found' });
        throw new Error('zt_session_not_found');
      }
      try {
        const step = riskSem(session, {
          unusualLocation: input.unusualLocation,
          unusualTime: input.unusualTime,
          newDevice: input.newDevice,
          threatIntelHit: input.threatIntelHit,
        });
        const score = (step.metadata['riskScore'] as number) ?? 0;
        const result: ZtRiskResult = {
          sessionId: input.sessionId,
          riskScore: score,
          latencyMs,
        };
        record('scoreRisk', true, { detail: result });
        return result;
      } catch (err) {
        record('scoreRisk', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async requestJit(input) {
      const session = zt.get(input.sessionId);
      if (!session) {
        record('requestJit', false, { errorKind: 'zt_session_not_found' });
        throw new Error('zt_session_not_found');
      }
      try {
        const step = jitSem(session, {
          requestedRole: input.requestedRole,
          justification: input.justification,
          ttlSeconds: input.ttlSeconds,
        });
        const granted = (step.metadata['granted'] as boolean) ?? false;
        const riskScore = (step.metadata['riskScore'] as number) ?? 0;
        const result: ZtJitResult = {
          sessionId: input.sessionId,
          requestedRole: input.requestedRole,
          granted,
          riskScore,
          ttlSeconds: input.ttlSeconds,
          latencyMs,
        };
        record('requestJit', true, { detail: result });
        return result;
      } catch (err) {
        record('requestJit', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async enforceMicroSegment(input) {
      const session = zt.get(input.sessionId);
      if (!session) {
        record('enforceMicroSegment', false, { errorKind: 'zt_session_not_found' });
        throw new Error('zt_session_not_found');
      }
      try {
        const step = segmentSem(session, {
          workload: input.workload,
          allowedPeers: input.allowedPeers,
          requestedPeer: input.requestedPeer,
        });
        const allowed = (step.metadata['allowed'] as boolean) ?? false;
        const result: ZtSegmentResult = {
          sessionId: input.sessionId,
          workload: input.workload,
          requestedPeer: input.requestedPeer,
          allowed,
          latencyMs,
        };
        record('enforceMicroSegment', true, { detail: result });
        return result;
      } catch (err) {
        record('enforceMicroSegment', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async closeZeroTrust(input) {
      if (!zt.has(input.sessionId)) {
        record('closeZeroTrust', false, { errorKind: 'zt_session_not_found' });
        throw new Error('zt_session_not_found');
      }
      zt.delete(input.sessionId);
      record('closeZeroTrust', true, { detail: { sessionId: input.sessionId } });
    },

    async startBroker(input) {
      if (broker.has(input.sessionId)) {
        record('startBroker', false, { errorKind: 'broker_session_exists' });
        throw new Error('broker_session_exists');
      }
      broker.set(input.sessionId, {
        sessionId: input.sessionId,
        mtlsTarget: input.mtlsTarget,
        ztTarget: input.ztTarget,
        closed: false,
      });
      record('startBroker', true, {
        detail: {
          sessionId: input.sessionId,
          mtlsTarget: input.mtlsTarget,
          ztTarget: input.ztTarget,
        },
      });
    },

    async decideBroker(input) {
      const session = broker.get(input.sessionId);
      if (!session) {
        record('decideBroker', false, { errorKind: 'broker_session_not_found' });
        throw new Error('broker_session_not_found');
      }
      if (session.closed) {
        record('decideBroker', false, { errorKind: 'broker_session_closed' });
        throw new Error('broker_session_closed');
      }
      const admitted = input.mtlsOk && input.ztOk;
      let reason: string;
      if (!input.mtlsOk && !input.ztOk) reason = 'mtls_and_zt_denied';
      else if (!input.mtlsOk) reason = 'mtls_denied';
      else if (!input.ztOk) reason = 'zt_denied';
      else reason = 'admitted';
      const result: BrokerDecideResult = {
        sessionId: input.sessionId,
        mtlsOk: input.mtlsOk,
        ztOk: input.ztOk,
        admitted,
        reason,
        latencyMs,
      };
      record('decideBroker', true, { detail: result });
      return result;
    },

    async closeBroker(input) {
      const session = broker.get(input.sessionId);
      if (!session) {
        record('closeBroker', false, { errorKind: 'broker_session_not_found' });
        throw new Error('broker_session_not_found');
      }
      session.closed = true;
      broker.delete(input.sessionId);
      record('closeBroker', true, { detail: { sessionId: input.sessionId } });
    },

    traces() {
      return trace;
    },

    async reset() {
      trace.length = 0;
      mtls.clear();
      zt.clear();
      broker.clear();
    },
  };
}
