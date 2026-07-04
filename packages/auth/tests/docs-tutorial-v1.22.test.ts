/**
 * v1.22-6 docs 補強 (Issue #892) — tutorial 37-38 code snippet 検証。
 *
 * `docs/tutorials/37-real-driver-testing.md` /
 * `docs/tutorials/38-passkey-cable-flow.md` に載っている
 * code snippet が実際に動作することを behavior test で担保する。
 *
 * tutorial の code snippet が drift すると読者が「動かない」 体験をする
 * ため、 snippet と実 API の乖離を CI で検知する。 v1.17 / v1.19 / v1.20 /
 * v1.21 の docs-tutorial-v*.test.ts と同 pattern。 v1.22 は real driver 層
 * を扱うが、 mock 部分のみを behavior test 対象とする (testcontainer + Docker
 * + real Keycloak boot は unit test の範囲外)。
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  __resetOidcCounters,
  __resetPasskeyCounters,
  establishWebSocketTunnel,
  generateCaBLEQRCode,
  migrateCredential,
  performBLEHandshake,
  performSignatureRoundtrip,
  runCaBLESession,
  setupOidcEnv,
  setupPasskeyEnv,
  type CaBLESessionOptions,
  type OidcTestEnv,
  type PasskeyTestEnv,
} from '../src/index.js';

const passkeyEnvs: PasskeyTestEnv[] = [];
const oidcEnvs: OidcTestEnv[] = [];

beforeEach(() => {
  __resetPasskeyCounters();
  __resetOidcCounters();
});

afterEach(async () => {
  while (passkeyEnvs.length > 0) {
    const env = passkeyEnvs.pop();
    if (env) await env.stop();
  }
  while (oidcEnvs.length > 0) {
    const env = oidcEnvs.pop();
    if (env) await env.stop();
  }
});

async function makePasskeyEnvWithCredential() {
  const env = await setupPasskeyEnv({
    devices: [
      { deviceId: 'phone-A', platform: { biometric: 'touch-id' } },
      { deviceId: 'laptop-A', roaming: { kind: 'phone' } },
    ],
  });
  passkeyEnvs.push(env);
  await env.createPasskey('phone-A', 'user-1', {
    rp: { id: 'example.test', name: 'Example RP' },
    user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
    challenge: 'cable-create',
  });
  const [credential] = env.listPasskeys();
  if (!credential) {
    throw new Error('makePasskeyEnvWithCredential: passkey creation did not register a credential');
  }
  return { env, credential };
}

function cableOptions(credential: any): CaBLESessionOptions {
  return {
    initiatorDeviceId: 'laptop-A',
    responderDeviceId: 'phone-A',
    credential,
    tunnelServerHint: 'wss://cable.example.test/tunnel/xyz',
    nonce: 'nonce-1',
  };
}

// ---------------------------------------------------------------------------
// Tutorial 37 — Real driver testing (mock-only branch behaviour)
// ---------------------------------------------------------------------------

describe('tutorial 37 — resolveMode helper drives the 3 execution modes', () => {
  it('mock-mode setupOidcEnv exposes issuer + jwks_uri + token_endpoint via discovery.fetch()', async () => {
    const env = await setupOidcEnv({
      issuer: 'https://op.example.test',
      clients: [
        {
          clientId: 'rp-A',
          redirectUris: ['https://rp.example.test/cb'],
          scopes: ['openid'],
        },
      ],
      users: [{ subject: 'user-1', scopes: ['openid'] }],
    });
    oidcEnvs.push(env);
    const meta = env.discovery.fetch();
    expect(meta.issuer).toBe('https://op.example.test');
    expect(meta.jwks_uri).toContain('/jwks');
    expect(meta.token_endpoint).toContain('/token');
  });
});

// ---------------------------------------------------------------------------
// Tutorial 38 — Passkey caBLE hybrid transport 5-axis harness
// ---------------------------------------------------------------------------

describe('tutorial 38 — axis 1 QR generation', () => {
  it('encodes the ephemeral publicKey + tunnelServerHint + nonce + sessionId', async () => {
    const { credential } = await makePasskeyEnvWithCredential();
    const qr = generateCaBLEQRCode(cableOptions(credential));
    expect(qr.tunnelServerHint).toBe('wss://cable.example.test/tunnel/xyz');
    expect(qr.nonce).toBe('nonce-1');
    expect(qr.publicKey).toContain('cable-pubkey');
    expect(qr.sessionId).toMatch(/^cable-session-\d+$/);
  });
});

describe('tutorial 38 — axis 2 BLE advertisement handshake', () => {
  it('derives a matching sharedSecret with `verified: true`', async () => {
    const { credential } = await makePasskeyEnvWithCredential();
    const qr = generateCaBLEQRCode(cableOptions(credential));
    const handshake = performBLEHandshake(qr);
    expect(handshake.verified).toBe(true);
    expect(handshake.sessionId).toBe(qr.sessionId);
    expect(handshake.sharedSecret.length).toBeGreaterThan(0);
  });
});

describe('tutorial 38 — axis 3 WebSocket tunnel establishment', () => {
  it('establishes the tunnel with `established: true`', async () => {
    const { credential } = await makePasskeyEnvWithCredential();
    const qr = generateCaBLEQRCode(cableOptions(credential));
    const handshake = performBLEHandshake(qr);
    const tunnel = establishWebSocketTunnel(qr, handshake);
    expect(tunnel.established).toBe(true);
    expect(tunnel.closed).toBe(false);
    expect(tunnel.tunnelServerHint).toBe(qr.tunnelServerHint);
  });
});

describe('tutorial 38 — axis 4 credential migration', () => {
  it('ships the passkey + encrypted payload through the tunnel', async () => {
    const { credential } = await makePasskeyEnvWithCredential();
    const qr = generateCaBLEQRCode(cableOptions(credential));
    const handshake = performBLEHandshake(qr);
    const tunnel = establishWebSocketTunnel(qr, handshake);
    const migration = migrateCredential(tunnel, credential);
    expect(migration.credentialId).toBe(credential.credentialId);
    expect(migration.encryptedPayload).toContain(tunnel.sessionId);
    expect(migration.credential.credentialId).toBe(credential.credentialId);
  });
});

describe('tutorial 38 — axis 5 signature roundtrip', () => {
  it('preserves the RP challenge and verifies against the migrated credential', async () => {
    const { credential } = await makePasskeyEnvWithCredential();
    const qr = generateCaBLEQRCode(cableOptions(credential));
    const handshake = performBLEHandshake(qr);
    const tunnel = establishWebSocketTunnel(qr, handshake);
    migrateCredential(tunnel, credential);
    const roundtrip = performSignatureRoundtrip(tunnel, credential, 'rp-challenge-1');
    expect(roundtrip.challenge).toBe('rp-challenge-1');
    expect(roundtrip.credentialId).toBe(credential.credentialId);
    expect(roundtrip.verified).toBe(true);
  });
});

describe('tutorial 38 — composite `runCaBLESession`', () => {
  it('chains all 5 steps in one call with stepsCompleted preserving order', async () => {
    const { credential } = await makePasskeyEnvWithCredential();
    const session = runCaBLESession(cableOptions(credential), 'rp-challenge-2');
    expect(session.stepsCompleted).toEqual([
      'qr-code',
      'ble-handshake',
      'websocket-tunnel',
      'credential-migration',
      'signature-roundtrip',
    ]);
    expect(session.signature.verified).toBe(true);
    expect(session.migration.credentialId).toBe(credential.credentialId);
  });
});
