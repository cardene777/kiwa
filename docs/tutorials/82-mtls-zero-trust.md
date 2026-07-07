# mTLS + Zero-trust — mutual TLS handshake + SPKI pinning + OCSP stapling + CT log + device posture + risk score + JIT + micro-segmentation in 15 min

## What you'll build

A vitest suite wired to `@kiwa-test/security` v0.2 that models the 8 signals of a real mTLS + zero-trust access chain that every non-trivial service-mesh app eventually needs — a mutual TLS handshake that pins TLS 1.2 / 1.3 + a named cipher suite so the peer identity is decided before any application byte flows, an SPKI SHA-256 pin verifier that survives certificate rotation without pinning the leaf, an OCSP stapled-response checker that fails closed on `stapled: false` instead of silently continuing on a revoked cert, a Certificate Transparency SCT-count check that rejects a cert with fewer than the required number of embedded SCTs, a device posture evaluator that walks OS-update + disk-encryption + EDR + MDM 4-signal so a rogue laptop never reaches the JIT step, a risk scorer that adds unusual-location + unusual-time + new-device + threat-intel-hit into a 0-100 score, a Just-in-Time role grant that only fires when the risk score is under the 50 threshold, and a micro-segmentation enforcer that allowlists the exact peer workload the granted role is allowed to talk to. `startMtlsSession()` + `completeHandshake()` + `verifyPin()` + `verifyOcsp()` + `checkCtLog()` + `startZeroTrustSession()` + `evaluatePosture()` + `scoreRisk()` + `requestJit()` + `enforceMicroSegment()` give you every one of those signals without booting a real Istio sidecar or an OPA rego policy engine. This is the pattern kiwa's `examples/dogfood-security-mtls-zero-trust-app` exercises against real Istio + OPA under `KIWA_MODE=real` + `KIWA_ISTIO_URL` + `KIWA_OPA_URL`; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "the OCSP staple was missing but the handshake still completed because the middleware treated `stapled: false` as `unknown` instead of `deny`" gap a reviewer sees in the mTLS rollout post-mortem.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-mtls-zero-trust && cd kiwa-mtls-zero-trust
pnpm init
pnpm add -D @kiwa-test/security@^0.2 vitest typescript @types/node
```

Add the vitest scripts in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run"
  }
}
```

The v0.2 surface exports the mTLS axis (`startMtlsSession` / `completeHandshake` / `verifyPin` / `verifyOcsp` / `checkCtLog`) and the zero-trust axis (`startZeroTrustSession` / `evaluatePosture` / `scoreRisk` / `requestJit` / `enforceMicroSegment`) directly from the package root. This tutorial focuses on the mTLS + zero-trust end-to-end chain; tutorials 83-84 cover the SIEM audit + incident response chain and the supply chain SLSA chain.

### 2. `startMtlsSession` + `completeHandshake` — the TLS 1.3 handshake baseline

`tests/mtls/handshake.test.ts` — an `MtlsSession` pins a `target` (`istio` / `opa` / `siem-splunk` / `vault`) + `sessionId` + a `state` that starts at `idle` and walks through `handshake-completed` → `pinned` / `ocsp-verified` / `ct-verified` / `failed`. `completeHandshake()` refuses to run on anything other than an `idle` session so a stale session cannot be reused for a fresh peer.

```ts
import { describe, expect, it } from 'vitest';
import { completeHandshake, startMtlsSession } from '@kiwa-test/security';

describe('mtls — handshake', () => {
  it('completes a TLS 1.3 handshake and moves state to handshake-completed', () => {
    const s = startMtlsSession({ target: 'istio', sessionId: 's-1' });
    const step = completeHandshake(s, {
      peerCn: 'api.example.com',
      cipherSuite: 'TLS_AES_256_GCM_SHA384',
      tlsVersion: '1.3',
    });
    expect(step.neutralEvent).toBe('mtls.handshake_completed');
    expect(s.state).toBe('handshake-completed');
  });

  it('refuses to handshake on a non-idle session (guards against session reuse)', () => {
    const s = startMtlsSession({ target: 'istio', sessionId: 's-2' });
    completeHandshake(s, {
      peerCn: 'api.example.com',
      cipherSuite: 'TLS_AES_256_GCM_SHA384',
      tlsVersion: '1.3',
    });
    expect(() =>
      completeHandshake(s, {
        peerCn: 'api2.example.com',
        cipherSuite: 'TLS_AES_256_GCM_SHA384',
        tlsVersion: '1.3',
      }),
    ).toThrow(/session is handshake-completed, cannot handshake/);
  });

  it('emits a provider-specific dialect while keeping the neutral event stable', () => {
    const s = startMtlsSession({ target: 'opa', sessionId: 's-3' });
    const step = completeHandshake(s, {
      peerCn: 'peer.example.com',
      cipherSuite: 'TLS_AES_128_GCM_SHA256',
      tlsVersion: '1.3',
    });
    expect(step.neutralEvent).toBe('mtls.handshake_completed');
    expect(step.providerEvent).toBe('opa.mtls.handshake');
  });
});
```

The `state` transition to `handshake-completed` is what makes the follow-up SPKI pin + OCSP + CT log calls type-safe — they refuse to run on an `idle` session and raise before you accidentally verify a pin against a session that never actually completed a handshake.

### 3. `verifyPin` — SPKI SHA-256 pinning that survives cert rotation

`tests/mtls/pin.test.ts` — SPKI pinning fingerprints the subject public key info instead of the whole certificate, so rotating the leaf cert does not invalidate the pin as long as the same public key is reused. `verifyPin()` accepts an `expectedPins: string[]` and returns `matched: true` inside the emitted metadata only when the incoming `spkiSha256` is in the allowlist; a non-match flips the session state to `failed` so the downstream OCSP + CT log calls short-circuit.

```ts
import { describe, expect, it } from 'vitest';
import { completeHandshake, startMtlsSession, verifyPin } from '@kiwa-test/security';

describe('mtls — SPKI pin', () => {
  it('accepts a matching SPKI hash and moves state to pinned', () => {
    const s = startMtlsSession({ target: 'istio', sessionId: 's-1' });
    completeHandshake(s, {
      peerCn: 'api.example.com',
      cipherSuite: 'TLS_AES_256_GCM_SHA384',
      tlsVersion: '1.3',
    });
    const step = verifyPin(s, {
      spkiSha256: 'aaa111',
      expectedPins: ['aaa111', 'bbb222'],
    });
    expect(step.metadata.matched).toBe(true);
    expect(s.state).toBe('pinned');
    expect(s.pinnedFingerprints).toEqual(['aaa111']);
  });

  it('flips state to failed on a non-matching pin (guards against MITM)', () => {
    const s = startMtlsSession({ target: 'opa', sessionId: 's-2' });
    completeHandshake(s, {
      peerCn: 'api.example.com',
      cipherSuite: 'TLS_AES_256_GCM_SHA384',
      tlsVersion: '1.3',
    });
    const step = verifyPin(s, {
      spkiSha256: 'unknown-hash',
      expectedPins: ['aaa111', 'bbb222'],
    });
    expect(step.metadata.matched).toBe(false);
    expect(s.state).toBe('failed');
  });

  it('refuses an empty expectedPins allowlist (guards against silent no-op)', () => {
    const s = startMtlsSession({ target: 'istio', sessionId: 's-3' });
    completeHandshake(s, {
      peerCn: 'api.example.com',
      cipherSuite: 'TLS_AES_256_GCM_SHA384',
      tlsVersion: '1.3',
    });
    expect(() => verifyPin(s, { spkiSha256: 'aaa', expectedPins: [] })).toThrow(
      /expectedPins must not be empty/,
    );
  });
});
```

The `expectedPins.length === 0` guard is the "silent no-op" trap the CSP tutorial calls out under a different mask — a config drift that leaves the pin list empty must fail loudly instead of matching every incoming cert.

### 4. `verifyOcsp` — the "fail closed on missing staple" invariant

`tests/mtls/ocsp.test.ts` — OCSP stapling attaches a signed "this certificate is not revoked" response to the TLS handshake so the client does not have to reach out to the CA on the critical path. Two failure modes exist — `stapled: false` (middleware forgot to attach) and `goodResponse: false` (CA said "revoked"). `verifyOcsp()` fails closed on both — a missing staple is not treated as "unknown, assume good".

```ts
import { describe, expect, it } from 'vitest';
import {
  completeHandshake,
  startMtlsSession,
  verifyOcsp,
  verifyPin,
} from '@kiwa-test/security';

describe('mtls — OCSP staple', () => {
  it('moves state to ocsp-verified on a good stapled response', () => {
    const s = startMtlsSession({ target: 'istio', sessionId: 's-1' });
    completeHandshake(s, {
      peerCn: 'api.example.com',
      cipherSuite: 'TLS_AES_256_GCM_SHA384',
      tlsVersion: '1.3',
    });
    verifyPin(s, { spkiSha256: 'aaa', expectedPins: ['aaa'] });
    const step = verifyOcsp(s, { stapled: true, goodResponse: true });
    expect(step.metadata.stapled).toBe(true);
    expect(step.metadata.good).toBe(true);
    expect(s.state).toBe('ocsp-verified');
  });

  it('flips state to failed on a missing staple (fail-closed invariant)', () => {
    const s = startMtlsSession({ target: 'opa', sessionId: 's-2' });
    completeHandshake(s, {
      peerCn: 'api.example.com',
      cipherSuite: 'TLS_AES_256_GCM_SHA384',
      tlsVersion: '1.3',
    });
    verifyPin(s, { spkiSha256: 'aaa', expectedPins: ['aaa'] });
    const step = verifyOcsp(s, { stapled: false, goodResponse: true });
    expect(step.metadata.stapled).toBe(false);
    expect(s.state).toBe('failed');
  });

  it('flips state to failed on a stapled but revoked response', () => {
    const s = startMtlsSession({ target: 'istio', sessionId: 's-3' });
    completeHandshake(s, {
      peerCn: 'api.example.com',
      cipherSuite: 'TLS_AES_256_GCM_SHA384',
      tlsVersion: '1.3',
    });
    verifyPin(s, { spkiSha256: 'aaa', expectedPins: ['aaa'] });
    const step = verifyOcsp(s, { stapled: true, goodResponse: false });
    expect(step.metadata.stapled).toBe(true);
    expect(step.metadata.good).toBe(false);
    expect(s.state).toBe('failed');
  });
});
```

The `stapled: false` → `failed` transition is the exact opposite of the "the middleware treated `stapled: false` as `unknown` instead of `deny`" post-mortem — a missing staple is a signal, not a null.

### 5. `checkCtLog` — the SCT-count guard against unlogged certs

`tests/mtls/ct-log.test.ts` — Certificate Transparency requires a public CT log to sign the cert before the browser trusts it; SCTs (Signed Certificate Timestamps) embedded in the cert prove the CA logged it. `checkCtLog()` accepts a `minSctRequired: number` and returns `ok: true` inside the emitted metadata only when the SCT count meets or exceeds the requirement. A count below the requirement flips the state to `failed`; a zero `minSctRequired` never fails but still emits the audit event.

```ts
import { describe, expect, it } from 'vitest';
import {
  checkCtLog,
  completeHandshake,
  startMtlsSession,
  verifyOcsp,
  verifyPin,
} from '@kiwa-test/security';

describe('mtls — CT log', () => {
  it('accepts SCT count above the required minimum', () => {
    const s = startMtlsSession({ target: 'istio', sessionId: 's-1' });
    completeHandshake(s, {
      peerCn: 'api.example.com',
      cipherSuite: 'TLS_AES_256_GCM_SHA384',
      tlsVersion: '1.3',
    });
    verifyPin(s, { spkiSha256: 'aaa', expectedPins: ['aaa'] });
    verifyOcsp(s, { stapled: true, goodResponse: true });
    const step = checkCtLog(s, { sctCount: 3, minSctRequired: 2 });
    expect(step.metadata.ok).toBe(true);
    expect(s.state).toBe('ct-verified');
  });

  it('flips to failed when SCT count is below the minimum', () => {
    const s = startMtlsSession({ target: 'opa', sessionId: 's-2' });
    completeHandshake(s, {
      peerCn: 'api.example.com',
      cipherSuite: 'TLS_AES_256_GCM_SHA384',
      tlsVersion: '1.3',
    });
    verifyPin(s, { spkiSha256: 'aaa', expectedPins: ['aaa'] });
    verifyOcsp(s, { stapled: true, goodResponse: true });
    const step = checkCtLog(s, { sctCount: 1, minSctRequired: 2 });
    expect(step.metadata.ok).toBe(false);
    expect(s.state).toBe('failed');
  });

  it('refuses a negative minSctRequired (guards against config typo)', () => {
    const s = startMtlsSession({ target: 'istio', sessionId: 's-3' });
    completeHandshake(s, {
      peerCn: 'api.example.com',
      cipherSuite: 'TLS_AES_256_GCM_SHA384',
      tlsVersion: '1.3',
    });
    verifyPin(s, { spkiSha256: 'aaa', expectedPins: ['aaa'] });
    verifyOcsp(s, { stapled: true, goodResponse: true });
    expect(() => checkCtLog(s, { sctCount: 3, minSctRequired: -1 })).toThrow(
      /minSctRequired must be non-negative/,
    );
  });
});
```

The `sctCount >= minSctRequired` check is the browser-side default (Chrome enforces 2 embedded SCTs for certs issued after 2018); the harness mirrors that behavior so a middleware operator can gate the exact same invariant server-side.

### 6. `startZeroTrustSession` + `evaluatePosture` — the 4-signal device posture

`tests/zero-trust/posture.test.ts` — a `ZeroTrustSession` pins a `target` + `sessionId` + a `state` that starts at `idle` and walks `posture-evaluated` → `risk-scored` → `jit-granted` / `jit-denied` → `segment-enforced`. `evaluatePosture()` checks 4 boolean signals (OS-up-to-date + disk-encrypted + EDR-running + MDM-enrolled) and emits the aggregate `passed: true` only when all 4 are set. Any missing signal blocks the JIT step downstream.

```ts
import { describe, expect, it } from 'vitest';
import { evaluatePosture, startZeroTrustSession } from '@kiwa-test/security';

describe('zero-trust — device posture', () => {
  it('emits passed=true when all 4 signals are present', () => {
    const s = startZeroTrustSession({ target: 'opa', sessionId: 's-1' });
    const step = evaluatePosture(s, {
      osUpToDate: true,
      diskEncrypted: true,
      edrRunning: true,
      mdmEnrolled: true,
    });
    expect(step.metadata.passed).toBe(true);
    expect(s.state).toBe('posture-evaluated');
  });

  it('emits passed=false when any one of the 4 signals is missing', () => {
    const s = startZeroTrustSession({ target: 'opa', sessionId: 's-2' });
    const step = evaluatePosture(s, {
      osUpToDate: true,
      diskEncrypted: false,
      edrRunning: true,
      mdmEnrolled: true,
    });
    expect(step.metadata.passed).toBe(false);
    expect(step.metadata.diskEncrypted).toBe(false);
  });

  it('refuses to re-evaluate posture on a non-idle session', () => {
    const s = startZeroTrustSession({ target: 'opa', sessionId: 's-3' });
    evaluatePosture(s, {
      osUpToDate: true,
      diskEncrypted: true,
      edrRunning: true,
      mdmEnrolled: true,
    });
    expect(() =>
      evaluatePosture(s, {
        osUpToDate: true,
        diskEncrypted: true,
        edrRunning: true,
        mdmEnrolled: true,
      }),
    ).toThrow(/must be idle/);
  });
});
```

The 4-signal check is the same one BeyondCorp published in the Google zero-trust papers; the harness pins the exact same shape so a rego policy or a hand-rolled evaluator can pick up the same 4 booleans without renaming.

### 7. `scoreRisk` + `requestJit` — the 0-100 score + 50 threshold

`tests/zero-trust/jit.test.ts` — `scoreRisk()` adds a fixed number of points per risk signal (`unusualLocation` +25, `unusualTime` +15, `newDevice` +20, `threatIntelHit` +40). `requestJit()` only grants the requested role when the accumulated score is under 50; a score of 50 or higher flips to `jit-denied`. The TTL is bounded (1..3600 seconds) and the justification must be at least 10 characters — both guard against configuration typos that would silently loosen the access boundary.

```ts
import { describe, expect, it } from 'vitest';
import {
  evaluatePosture,
  requestJit,
  scoreRisk,
  startZeroTrustSession,
} from '@kiwa-test/security';

describe('zero-trust — risk score + JIT', () => {
  it('grants JIT when accumulated risk is under 50', () => {
    const s = startZeroTrustSession({ target: 'opa', sessionId: 's-1' });
    evaluatePosture(s, {
      osUpToDate: true,
      diskEncrypted: true,
      edrRunning: true,
      mdmEnrolled: true,
    });
    scoreRisk(s, {
      unusualLocation: true,
      unusualTime: false,
      newDevice: false,
      threatIntelHit: false,
    }); // 25
    const step = requestJit(s, {
      requestedRole: 'db-admin',
      justification: 'break-glass access for incident triage',
      ttlSeconds: 900,
    });
    expect(step.metadata.granted).toBe(true);
    expect(s.state).toBe('jit-granted');
    expect(s.grantedRoles).toEqual(['db-admin']);
  });

  it('denies JIT when threat-intel hits push risk to 40+ and one other signal fires', () => {
    const s = startZeroTrustSession({ target: 'opa', sessionId: 's-2' });
    evaluatePosture(s, {
      osUpToDate: true,
      diskEncrypted: true,
      edrRunning: true,
      mdmEnrolled: true,
    });
    scoreRisk(s, {
      unusualLocation: false,
      unusualTime: false,
      newDevice: false,
      threatIntelHit: true,
    }); // 40 → still under 50 → allow
    scoreRisk;
    // exceed 50 requires a second signal, so build another session
    const s2 = startZeroTrustSession({ target: 'opa', sessionId: 's-3' });
    evaluatePosture(s2, {
      osUpToDate: true,
      diskEncrypted: true,
      edrRunning: true,
      mdmEnrolled: true,
    });
    scoreRisk(s2, {
      unusualLocation: true,
      unusualTime: false,
      newDevice: false,
      threatIntelHit: true,
    }); // 65 → deny
    const denied = requestJit(s2, {
      requestedRole: 'db-admin',
      justification: 'break-glass access for incident triage',
      ttlSeconds: 900,
    });
    expect(denied.metadata.granted).toBe(false);
    expect(s2.state).toBe('jit-denied');
    expect(s2.grantedRoles).toEqual([]);
  });

  it('refuses a JIT ttlSeconds out of the 1..3600 window (guards against forever-grants)', () => {
    const s = startZeroTrustSession({ target: 'opa', sessionId: 's-4' });
    evaluatePosture(s, {
      osUpToDate: true,
      diskEncrypted: true,
      edrRunning: true,
      mdmEnrolled: true,
    });
    scoreRisk(s, {
      unusualLocation: false,
      unusualTime: false,
      newDevice: false,
      threatIntelHit: false,
    });
    expect(() =>
      requestJit(s, {
        requestedRole: 'db-admin',
        justification: 'break-glass access',
        ttlSeconds: 86400,
      }),
    ).toThrow(/ttlSeconds must be 1..3600/);
  });
});
```

The 0-100 score + 50 threshold is a first-order approximation of the risk-adaptive access pattern real IdP vendors run (Okta / Duo Security / Google Cloud Identity); the harness pins the shape so the fidelity check can compare mock verdicts to real IdP verdicts without translating the score.

### 8. `enforceMicroSegment` — the "granted role, exact peer" allowlist

`tests/zero-trust/segment.test.ts` — `enforceMicroSegment()` only runs on a `jit-granted` session and pins the exact peer workload the granted role can talk to. A peer that is not in the `allowedPeers` allowlist emits `allowed: false` inside the metadata — the session state still moves to `segment-enforced` so the downstream audit path records the denied attempt.

```ts
import { describe, expect, it } from 'vitest';
import {
  enforceMicroSegment,
  evaluatePosture,
  requestJit,
  scoreRisk,
  startZeroTrustSession,
} from '@kiwa-test/security';

describe('zero-trust — micro-segmentation', () => {
  it('allows a peer inside the allowedPeers allowlist', () => {
    const s = startZeroTrustSession({ target: 'opa', sessionId: 's-1' });
    evaluatePosture(s, {
      osUpToDate: true,
      diskEncrypted: true,
      edrRunning: true,
      mdmEnrolled: true,
    });
    scoreRisk(s, {
      unusualLocation: false,
      unusualTime: false,
      newDevice: false,
      threatIntelHit: false,
    });
    requestJit(s, {
      requestedRole: 'db-admin',
      justification: 'break-glass access',
      ttlSeconds: 900,
    });
    const step = enforceMicroSegment(s, {
      workload: 'analytics-service',
      allowedPeers: ['postgres-primary', 'redis-cache'],
      requestedPeer: 'postgres-primary',
    });
    expect(step.metadata.allowed).toBe(true);
    expect(s.state).toBe('segment-enforced');
  });

  it('denies a peer outside the allowedPeers allowlist but still audits it', () => {
    const s = startZeroTrustSession({ target: 'opa', sessionId: 's-2' });
    evaluatePosture(s, {
      osUpToDate: true,
      diskEncrypted: true,
      edrRunning: true,
      mdmEnrolled: true,
    });
    scoreRisk(s, {
      unusualLocation: false,
      unusualTime: false,
      newDevice: false,
      threatIntelHit: false,
    });
    requestJit(s, {
      requestedRole: 'db-admin',
      justification: 'break-glass access',
      ttlSeconds: 900,
    });
    const step = enforceMicroSegment(s, {
      workload: 'analytics-service',
      allowedPeers: ['postgres-primary', 'redis-cache'],
      requestedPeer: 'stripe-webhook',
    });
    expect(step.metadata.allowed).toBe(false);
    expect(s.state).toBe('segment-enforced');
  });
});
```

The "denied but audited" shape is what makes zero-trust reviewable — the operator sees "3 pods tried to reach the payment service, 3 were denied" in the audit stream, instead of a silent policy skip.

## Run the test suite

```bash
pnpm test
```

Vitest reports every describe block above. The v0.2 mTLS + zero-trust axis surface — `startMtlsSession` + `completeHandshake` + `verifyPin` + `verifyOcsp` + `checkCtLog` + `startZeroTrustSession` + `evaluatePosture` + `scoreRisk` + `requestJit` + `enforceMicroSegment` — has 50+ tests in `packages/security/tests/mtls.test.ts` + `zero-trust.test.ts`; this tutorial covers the everyday chain that lands in a real Istio + OPA deployment.

## What's next

- Tutorial 83 covers the SIEM audit + incident response chain (structured events + tamper-evident seal + retention + correlation + playbook + severity + escalation + forensics + post-mortem).
- Tutorial 84 covers the supply chain SLSA chain (SLSA level verification + reproducible build + signed provenance + attestation).
- The `security-advanced-II-testing.md` concept doc is the SSOT for the v0.2 8-axis / 4-provider / 32-cell grid, the `KIWA_MODE=real` env-gate contract, and the per-provider required-env mapping (`KIWA_ISTIO_URL` / `KIWA_OPA_URL` / `KIWA_SPLUNK_HEC_URL` / `KIWA_VAULT_URL`).
