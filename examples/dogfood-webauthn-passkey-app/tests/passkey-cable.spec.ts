/**
 * caBLE hybrid transport fidelity harness (v1.22-4, GH #890).
 *
 * The mock adapter drives a full phone → laptop caBLE ceremony and this
 * harness diffs the raw session artifacts across five axes.
 *
 *  1. QR code generation — deterministic session id, credential id tag,
 *     tunnel + nonce advertised, `FIDO:/` URI shape.
 *  2. BLE advertisement handshake — derived shared secret matches on both
 *     sides + advertisement payload embeds the session id.
 *  3. WebSocket tunnel establishment — session id + tunnel hint carried
 *     from the QR + FIFO wire log + close/reject lifecycle.
 *  4. Credential migration — encrypted payload wraps the credential + the
 *     migration entry is recorded on the wire log.
 *  5. Signature roundtrip — signature produced over the challenge + tunnel
 *     wire log records migration → signature order + verification passes.
 *
 * The end-to-end run (`runCaBLESession`) reports every step completed in
 * FIDO caBLE order. Two consecutive sessions produce independent artifacts
 * so replay is impossible.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  __resetPasskeyCounters,
  encodeCaBLEQRURI,
  establishWebSocketTunnel,
  generateCaBLEQRCode,
  migrateCredential,
  performBLEHandshake,
  performSignatureRoundtrip,
  runCaBLESession,
  setupPasskeyEnv,
  type CaBLESessionOptions,
  type PasskeyCredential,
  type PasskeyTestEnv,
} from '@kiwa-lab/auth';

const envs: PasskeyTestEnv[] = [];

beforeEach(() => {
  __resetPasskeyCounters();
});

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

async function mintPhonePasskey(): Promise<{
  env: PasskeyTestEnv;
  passkey: PasskeyCredential;
}> {
  const env = await setupPasskeyEnv({
    devices: [
      {
        deviceId: 'phone-1',
        platform: { biometric: 'face-id' },
      },
    ],
  });
  envs.push(env);
  await env.createPasskey('phone-1', 'user-1', {
    rp: { id: 'example.com', name: 'Example RP' },
    user: { id: 'user-1', name: 'alice@example.com', displayName: 'Alice' },
    challenge: 'challenge-register-1',
  });
  const [passkey] = env.listPasskeys();
  if (!passkey) throw new Error('failed to mint phone passkey');
  return { env, passkey };
}

function makeSessionOptions(
  passkey: PasskeyCredential,
  overrides: Partial<CaBLESessionOptions> = {},
): CaBLESessionOptions {
  return {
    initiatorDeviceId: 'laptop-1',
    responderDeviceId: 'phone-1',
    credential: passkey,
    tunnelServerHint: 'cable.tunnel.example.com',
    nonce: 'nonce-canonical',
    ...overrides,
  };
}

describe('caBLE axis 1 — QR code generation surfaces every field the phone needs', () => {
  it('advertises the session id, credential id tag, tunnel hint, and nonce', async () => {
    const { passkey } = await mintPhonePasskey();
    const qr = generateCaBLEQRCode(makeSessionOptions(passkey));
    expect(qr.sessionId).toBe('cable-session-1');
    expect(qr.publicKey).toContain(passkey.credentialId);
    expect(qr.tunnelServerHint).toBe('cable.tunnel.example.com');
    expect(qr.nonce).toBe('nonce-canonical');
  });

  it('encodes the payload as a FIDO:/ URI carrying every advertised field', async () => {
    const { passkey } = await mintPhonePasskey();
    const qr = generateCaBLEQRCode(makeSessionOptions(passkey));
    const uri = encodeCaBLEQRURI(qr);
    expect(uri).toMatch(/^FIDO:\//);
    expect(uri).toContain('pubkey=');
    expect(uri).toContain('tunnel=cable.tunnel.example.com');
    expect(uri).toContain('nonce=nonce-canonical');
  });
});

describe('caBLE axis 2 — BLE advertisement handshake derives matching shared secrets', () => {
  it('reports verified=true and binds the shared secret to the nonce', async () => {
    const { passkey } = await mintPhonePasskey();
    const qr = generateCaBLEQRCode(makeSessionOptions(passkey));
    const handshake = performBLEHandshake(qr);
    expect(handshake.verified).toBe(true);
    expect(handshake.sharedSecret).toContain(qr.nonce);
    expect(handshake.advertisementPayload).toContain(qr.sessionId);
  });

  it('produces different shared secrets when the nonce changes across sessions', async () => {
    const { passkey } = await mintPhonePasskey();
    const qrA = generateCaBLEQRCode(makeSessionOptions(passkey));
    const qrB = generateCaBLEQRCode(
      makeSessionOptions(passkey, { nonce: 'nonce-second' }),
    );
    const handshakeA = performBLEHandshake(qrA);
    const handshakeB = performBLEHandshake(qrB);
    expect(handshakeA.sharedSecret).not.toBe(handshakeB.sharedSecret);
  });
});

describe('caBLE axis 3 — WebSocket tunnel establishment carries the correlation key', () => {
  it('surfaces the session id + tunnel hint the QR advertised and reports established=true', async () => {
    const { passkey } = await mintPhonePasskey();
    const qr = generateCaBLEQRCode(makeSessionOptions(passkey));
    const handshake = performBLEHandshake(qr);
    const tunnel = establishWebSocketTunnel(qr, handshake);
    expect(tunnel.sessionId).toBe(qr.sessionId);
    expect(tunnel.tunnelServerHint).toBe(qr.tunnelServerHint);
    expect(tunnel.established).toBe(true);
    expect(tunnel.closed).toBe(false);
  });

  it('drains messages in FIFO order and rejects operations after close', async () => {
    const { passkey } = await mintPhonePasskey();
    const qr = generateCaBLEQRCode(makeSessionOptions(passkey));
    const handshake = performBLEHandshake(qr);
    const tunnel = establishWebSocketTunnel(qr, handshake);
    tunnel.send('msg-a');
    tunnel.send('msg-b');
    expect(tunnel.drain()).toEqual(['msg-a', 'msg-b']);
    tunnel.close();
    expect(tunnel.closed).toBe(true);
    expect(() => tunnel.send('after-close')).toThrow(/cannot send on closed tunnel/);
  });

  it('refuses to open the tunnel when the BLE handshake failed', async () => {
    const { passkey } = await mintPhonePasskey();
    const qr = generateCaBLEQRCode(makeSessionOptions(passkey));
    const handshake = performBLEHandshake(qr);
    expect(() =>
      establishWebSocketTunnel(qr, { ...handshake, verified: false }),
    ).toThrow(/BLE handshake not verified/);
  });
});

describe('caBLE axis 4 — credential migration ships the passkey over the tunnel', () => {
  it('records an encrypted payload keyed by the credential id + user id', async () => {
    const { passkey } = await mintPhonePasskey();
    const qr = generateCaBLEQRCode(makeSessionOptions(passkey));
    const handshake = performBLEHandshake(qr);
    const tunnel = establishWebSocketTunnel(qr, handshake);
    const migration = migrateCredential(tunnel, passkey);
    expect(migration.credentialId).toBe(passkey.credentialId);
    expect(migration.encryptedPayload).toContain(passkey.credentialId);
    expect(migration.encryptedPayload).toContain(passkey.userId);
    expect(migration.credential).toBe(passkey);
  });

  it('appends the payload to the tunnel wire log', async () => {
    const { passkey } = await mintPhonePasskey();
    const qr = generateCaBLEQRCode(makeSessionOptions(passkey));
    const handshake = performBLEHandshake(qr);
    const tunnel = establishWebSocketTunnel(qr, handshake);
    const migration = migrateCredential(tunnel, passkey);
    expect(tunnel.drain()).toContain(migration.encryptedPayload);
  });

  it('refuses to migrate over a closed tunnel', async () => {
    const { passkey } = await mintPhonePasskey();
    const qr = generateCaBLEQRCode(makeSessionOptions(passkey));
    const handshake = performBLEHandshake(qr);
    const tunnel = establishWebSocketTunnel(qr, handshake);
    tunnel.close();
    expect(() => migrateCredential(tunnel, passkey)).toThrow(
      /cannot migrate credential over closed tunnel/,
    );
  });
});

describe('caBLE axis 5 — signature roundtrip terminates the ceremony in a WebAuthn assertion', () => {
  it('produces a signature tag over the credential id + challenge + session id', async () => {
    const { passkey } = await mintPhonePasskey();
    const qr = generateCaBLEQRCode(makeSessionOptions(passkey));
    const handshake = performBLEHandshake(qr);
    const tunnel = establishWebSocketTunnel(qr, handshake);
    const roundtrip = performSignatureRoundtrip(
      tunnel,
      passkey,
      'challenge-assertion-1',
    );
    expect(roundtrip.signature).toContain(passkey.credentialId);
    expect(roundtrip.signature).toContain('challenge-assertion-1');
    expect(roundtrip.signature).toContain(qr.sessionId);
    expect(roundtrip.verified).toBe(true);
  });

  it('the tunnel wire log records the migration payload before the signature', async () => {
    const { passkey } = await mintPhonePasskey();
    const qr = generateCaBLEQRCode(makeSessionOptions(passkey));
    const handshake = performBLEHandshake(qr);
    const tunnel = establishWebSocketTunnel(qr, handshake);
    migrateCredential(tunnel, passkey);
    performSignatureRoundtrip(tunnel, passkey, 'challenge-assertion-1');
    const wireLog = tunnel.drain();
    expect(wireLog).toHaveLength(2);
    expect(wireLog[0]).toMatch(/^enc::/);
    expect(wireLog[1]).toMatch(/^sig::/);
  });

  it('refuses to sign an empty challenge (WebAuthn L3 §7.2 forbids empty assertions)', async () => {
    const { passkey } = await mintPhonePasskey();
    const qr = generateCaBLEQRCode(makeSessionOptions(passkey));
    const handshake = performBLEHandshake(qr);
    const tunnel = establishWebSocketTunnel(qr, handshake);
    expect(() => performSignatureRoundtrip(tunnel, passkey, '')).toThrow(
      /challenge is empty/,
    );
  });
});

describe('caBLE end-to-end — runCaBLESession chains every fidelity axis', () => {
  it('reports every step completed in FIDO caBLE order', async () => {
    const { passkey } = await mintPhonePasskey();
    const session = runCaBLESession(
      makeSessionOptions(passkey),
      'challenge-cable-e2e-1',
    );
    expect(session.stepsCompleted).toEqual([
      'qr-code',
      'ble-handshake',
      'websocket-tunnel',
      'credential-migration',
      'signature-roundtrip',
    ]);
    expect(session.qrCode.sessionId).toBe(session.sessionId);
    expect(session.handshake.verified).toBe(true);
    expect(session.tunnel.established).toBe(true);
    expect(session.migration.credentialId).toBe(passkey.credentialId);
    expect(session.signature.verified).toBe(true);
  });

  it('two consecutive sessions produce independent session ids so replay is impossible', async () => {
    const { passkey } = await mintPhonePasskey();
    const s1 = runCaBLESession(
      makeSessionOptions(passkey),
      'challenge-cable-a',
    );
    const s2 = runCaBLESession(
      makeSessionOptions(passkey),
      'challenge-cable-b',
    );
    expect(s1.sessionId).not.toBe(s2.sessionId);
    expect(s1.qrCode.publicKey).not.toBe(s2.qrCode.publicKey);
    expect(s1.signature.signature).not.toBe(s2.signature.signature);
  });

  it('the migration credential id equals the signature credential id (no cross-session leak)', async () => {
    const { passkey } = await mintPhonePasskey();
    const session = runCaBLESession(
      makeSessionOptions(passkey),
      'challenge-cable-consistency',
    );
    expect(session.migration.credentialId).toBe(session.signature.credentialId);
    expect(session.migration.credentialId).toBe(passkey.credentialId);
  });
});
