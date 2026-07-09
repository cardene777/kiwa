/**
 * Sub-Issue v1.21-4d (jwks-rotation-e2e) fidelity harness.
 *
 * End-to-end rotation coverage that stitches together the artifacts landed by
 * Sub-Issues a/b/c so the release gate has proof the rotation retention window
 * is actually usable by an RP verifying id_tokens minted before the rotation.
 * The Sub-Issue v1.21-4a `discovery-jwks-skeleton` harness pins the axis 4
 * rotation shape (fresh kid + retired key retention); this harness escalates
 * that into a full sign → rotate → verify flow so we know an id_token issued
 * under `k001` survives a rotation to `k002` inside the window and drops out
 * once the retention deadline elapses.
 *
 * Axes covered here (v1.21-4d escalation of Sub-Issue v1.21-4a axis 4):
 *
 *   4a. sign → rotate → verify inside retention window: id_token signed under
 *       kid k001 still verifies after `rotate()` moves the active key to k002.
 *   4b. verify past retention: once `now > retiredAt`, the retired kid drops
 *       from the JWKS and the same id_token fails signature verification with
 *       an unknown-kid reason.
 *   4c. multi-rotation retention: two consecutive rotations retain both
 *       previous kids until each deadline fires independently.
 *   4d. fresh active key issues verifiable id_tokens after rotation.
 *
 * The harness drives the underlying `@kiwa-lab/auth` env directly (no HTTP
 * round-trip) so a rotation regression trips before the Hono OP has a chance
 * to obscure the failure with a 5xx.
 */

import { describe, expect, it } from 'vitest';
import { setupOidcEnv, type OidcTestEnv } from '@kiwa-lab/auth';
import {
  IdTokenVerifyError,
  mustVerifyIdToken,
  parseIdTokenHeader,
  verifyIdToken,
} from '../src/lib/id-token.js';
import {
  pickActiveKey,
  pickRetiredKeys,
} from '../src/lib/jwks.js';

const ISSUER = 'https://op.example.test';
const RP_CLIENT_ID = 'rp-client-1';
const RP_SUBJECT = 'sub-1';
const RETENTION_SEC = 60;

interface FixedClockEnv {
  env: OidcTestEnv;
  advance(seconds: number): void;
  now(): number;
}

/**
 * Boot `setupOidcEnv` with a deterministic clock so the rotation harness can
 * step the clock past the retention window without racing wall-clock. Returns
 * a wrapper exposing the env + a mutation seam to advance the clock.
 */
async function makeFixedClockEnv(): Promise<FixedClockEnv> {
  let nowMs = new Date('2026-01-01T00:00:00Z').getTime();
  const env = await setupOidcEnv({
    issuer: ISSUER,
    jwksRetentionSec: RETENTION_SEC,
    now: () => nowMs,
  });
  return {
    env,
    advance(seconds) {
      nowMs += seconds * 1000;
    },
    now: () => nowMs,
  };
}

describe('axis 4a — sign → rotate → verify inside retention window', () => {
  it('id_token signed under k001 still verifies after rotation to k002', async () => {
    const { env } = await makeFixedClockEnv();
    // Sign under the initial active key.
    const initialActive = env.jwks.activeKey();
    const idToken = env.signIdToken({ sub: RP_SUBJECT, aud: RP_CLIENT_ID });
    const header = parseIdTokenHeader(idToken.jwt);
    expect(header.kid).toBe(initialActive.kid);

    // Rotate the active key. The retired key stays in the JWKS retention
    // window so the verifier can still find it via `allKeys()`.
    const newActive = env.jwks.rotate();
    expect(newActive.kid).not.toBe(initialActive.kid);

    // Verify the id_token minted under the retired kid. Retention window has
    // not elapsed so the verifier still resolves the retired key.
    const outcome = verifyIdToken(env.verifyIdToken, idToken.jwt, {
      expectedIssuer: ISSUER,
      expectedAudience: RP_CLIENT_ID,
    });
    expect(outcome.ok).toBe(true);
    await env.stop();
  });

  it('retired key remains in the JWKS document during the retention window', async () => {
    const { env } = await makeFixedClockEnv();
    const before = env.jwks.fetch();
    const previousKid = pickActiveKey(before).kid;
    env.jwks.rotate();
    const withinWindow = env.jwks.fetch();
    expect(
      pickRetiredKeys(withinWindow).map((key) => key.kid),
    ).toContain(previousKid);
    await env.stop();
  });

  it('mustVerifyIdToken returns claims for a token signed under the retired kid inside window', async () => {
    const { env } = await makeFixedClockEnv();
    const idToken = env.signIdToken({ sub: RP_SUBJECT, aud: RP_CLIENT_ID });
    env.jwks.rotate();
    const claims = mustVerifyIdToken(env.verifyIdToken, idToken.jwt, {
      expectedIssuer: ISSUER,
      expectedAudience: RP_CLIENT_ID,
    });
    expect(claims.sub).toBe(RP_SUBJECT);
    expect(claims.aud).toBe(RP_CLIENT_ID);
    await env.stop();
  });
});

describe('axis 4b — verify past retention deadline', () => {
  it('id_token signed under retired kid fails verification once retention elapses', async () => {
    const { env, advance } = await makeFixedClockEnv();
    const idToken = env.signIdToken({ sub: RP_SUBJECT, aud: RP_CLIENT_ID });
    const header = parseIdTokenHeader(idToken.jwt);
    env.jwks.rotate();

    // Advance the clock past the retention window (RETENTION_SEC + 1 s).
    advance(RETENTION_SEC + 1);

    // The retired key drops out of the JWKS document (fetch triggers the GC).
    const afterWindow = env.jwks.fetch();
    expect(
      pickRetiredKeys(afterWindow).map((key) => key.kid),
    ).not.toContain(header.kid);

    // The verifier resolves kid → not-in-JWKS and refuses with the
    // signature-axis unknown-kid reason.
    const outcome = verifyIdToken(env.verifyIdToken, idToken.jwt, {
      expectedIssuer: ISSUER,
      expectedAudience: RP_CLIENT_ID,
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issue.axis).toBe('signature');
      expect(outcome.issue.reason).toMatch(/kid/);
    }
    await env.stop();
  });

  it('mustVerifyIdToken throws IdTokenVerifyError past retention', async () => {
    const { env, advance } = await makeFixedClockEnv();
    // Extend the id_token lifetime so it does not expire before the retention
    // deadline forces the failure. Retention default 60 s but id_token
    // default lifetime is 3600 s, so lifetime alone does not need extending
    // — the retention deadline fires first.
    const idToken = env.signIdToken({ sub: RP_SUBJECT, aud: RP_CLIENT_ID });
    env.jwks.rotate();
    advance(RETENTION_SEC + 1);
    expect(() =>
      mustVerifyIdToken(env.verifyIdToken, idToken.jwt, {
        expectedIssuer: ISSUER,
        expectedAudience: RP_CLIENT_ID,
      }),
    ).toThrow(IdTokenVerifyError);
    await env.stop();
  });
});

describe('axis 4c — multi-rotation retention', () => {
  it('two consecutive rotations retain both previous kids inside the window', async () => {
    const { env } = await makeFixedClockEnv();
    const initialActive = env.jwks.activeKey();
    const first = env.jwks.rotate();
    const second = env.jwks.rotate();
    const jwks = env.jwks.fetch();
    const retiredKids = pickRetiredKeys(jwks).map((key) => key.kid);
    // All three previous kids are in the retention set (initial + first
    // rotation, both retired). Second rotation is currently active.
    expect(retiredKids).toContain(initialActive.kid);
    expect(retiredKids).toContain(first.kid);
    expect(pickActiveKey(jwks).kid).toBe(second.kid);
    await env.stop();
  });

  it('id_tokens signed under different pre-rotation kids all verify inside window', async () => {
    const { env } = await makeFixedClockEnv();
    // Sign one id_token, rotate, sign another, rotate, sign a third.
    // Every id_token is signed under a different active key; every one must
    // verify because every previous kid is still in the retention window.
    const first = env.signIdToken({ sub: 'sub-a', aud: RP_CLIENT_ID });
    env.jwks.rotate();
    const second = env.signIdToken({ sub: 'sub-b', aud: RP_CLIENT_ID });
    env.jwks.rotate();
    const third = env.signIdToken({ sub: 'sub-c', aud: RP_CLIENT_ID });

    for (const idToken of [first, second, third]) {
      const outcome = verifyIdToken(env.verifyIdToken, idToken.jwt, {
        expectedIssuer: ISSUER,
        expectedAudience: RP_CLIENT_ID,
      });
      expect(outcome.ok).toBe(true);
    }
    await env.stop();
  });

  it('retired kids drop out one at a time as their deadlines fire', async () => {
    // Rotate at t=0, again at t=30, then advance to t=61. The first retired
    // kid (deadline t=60) should drop; the second (deadline t=90) stays.
    const { env, advance } = await makeFixedClockEnv();
    const initialActive = env.jwks.activeKey();
    env.jwks.rotate(); // t=0: retire initial, deadline = 60
    advance(30);
    const first = env.jwks.activeKey();
    env.jwks.rotate(); // t=30: retire first, deadline = 90
    advance(31); // t=61: initial deadline elapsed
    const jwks = env.jwks.fetch();
    const retiredKids = pickRetiredKeys(jwks).map((key) => key.kid);
    expect(retiredKids).not.toContain(initialActive.kid);
    expect(retiredKids).toContain(first.kid);
    await env.stop();
  });
});

describe('axis 4d — fresh active key issues verifiable id_tokens after rotation', () => {
  it('id_token minted under the new active key verifies immediately', async () => {
    const { env } = await makeFixedClockEnv();
    const newActive = env.jwks.rotate();
    const idToken = env.signIdToken({ sub: RP_SUBJECT, aud: RP_CLIENT_ID });
    const header = parseIdTokenHeader(idToken.jwt);
    expect(header.kid).toBe(newActive.kid);
    const outcome = verifyIdToken(env.verifyIdToken, idToken.jwt, {
      expectedIssuer: ISSUER,
      expectedAudience: RP_CLIENT_ID,
    });
    expect(outcome.ok).toBe(true);
    await env.stop();
  });

  it('rotation preserves the alg family + all keys stay shape-valid across the window', async () => {
    const { env } = await makeFixedClockEnv();
    const beforeAlg = env.jwks.activeKey().alg;
    env.jwks.rotate();
    env.jwks.rotate();
    const afterAlg = env.jwks.activeKey().alg;
    expect(afterAlg).toBe(beforeAlg);
    const jwks = env.jwks.fetch();
    for (const key of jwks.keys) {
      expect(['RS256', 'ES256']).toContain(key.alg);
      expect(key.use).toBe('sig');
    }
    await env.stop();
  });

  it('sign → rotate → sign → verify old + new id_tokens both verify inside the window', async () => {
    const { env } = await makeFixedClockEnv();
    const oldToken = env.signIdToken({ sub: 'sub-old', aud: RP_CLIENT_ID });
    env.jwks.rotate();
    const newToken = env.signIdToken({ sub: 'sub-new', aud: RP_CLIENT_ID });

    // Both verify inside the retention window.
    const oldOutcome = verifyIdToken(env.verifyIdToken, oldToken.jwt, {
      expectedIssuer: ISSUER,
      expectedAudience: RP_CLIENT_ID,
    });
    const newOutcome = verifyIdToken(env.verifyIdToken, newToken.jwt, {
      expectedIssuer: ISSUER,
      expectedAudience: RP_CLIENT_ID,
    });
    expect(oldOutcome.ok).toBe(true);
    expect(newOutcome.ok).toBe(true);
    if (oldOutcome.ok) expect(oldOutcome.claims.sub).toBe('sub-old');
    if (newOutcome.ok) expect(newOutcome.claims.sub).toBe('sub-new');
    await env.stop();
  });
});
