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
} from '../src/index.js';

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

async function makePasskeyOnDevice(
  env: PasskeyTestEnv,
  deviceId: string,
  userId: string,
): Promise<PasskeyCredential> {
  await env.createPasskey(deviceId, userId, {
    rp: { id: 'example.test', name: 'Example RP' },
    user: { id: userId, name: `${userId}-name`, displayName: `${userId} Display` },
    challenge: 'challenge-init',
  });
  const [passkey] = env.listPasskeys();
  if (!passkey) throw new Error('failed to mint passkey');
  return passkey;
}

async function setupPhoneDevice(): Promise<{
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
  const passkey = await makePasskeyOnDevice(env, 'phone-1', 'user-1');
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
    tunnelServerHint: 'cable.tunnel.example.test',
    nonce: 'nonce-canonical',
    ...overrides,
  };
}

describe('caBLE fidelity axis 1 — QR code generation', () => {
  it('produces a deterministic session id + tags the credential id + advertises tunnel + nonce', async () => {
    const { passkey } = await setupPhoneDevice();
    const qr = generateCaBLEQRCode(makeSessionOptions(passkey));
    expect(qr.sessionId).toBe('cable-session-1');
    expect(qr.publicKey).toBe(
      `cable-pubkey::cable-session-1::${passkey.credentialId}`,
    );
    expect(qr.tunnelServerHint).toBe('cable.tunnel.example.test');
    expect(qr.nonce).toBe('nonce-canonical');
  });

  it('rejects an empty tunnel server hint at QR generation time', async () => {
    const { passkey } = await setupPhoneDevice();
    expect(() =>
      generateCaBLEQRCode(makeSessionOptions(passkey, { tunnelServerHint: '' })),
    ).toThrow(/tunnelServerHint is empty/);
  });

  it('rejects an empty nonce so the handshake cannot be replayed', async () => {
    const { passkey } = await setupPhoneDevice();
    expect(() =>
      generateCaBLEQRCode(makeSessionOptions(passkey, { nonce: '' })),
    ).toThrow(/nonce is empty/);
  });

  it('encodes the QR payload as a FIDO:/ URI carrying every field', async () => {
    const { passkey } = await setupPhoneDevice();
    const qr = generateCaBLEQRCode(makeSessionOptions(passkey));
    const uri = encodeCaBLEQRURI(qr);
    expect(uri).toBe(
      `FIDO:/cable-session-1?pubkey=${qr.publicKey}&tunnel=cable.tunnel.example.test&nonce=nonce-canonical`,
    );
  });

  it('mints a fresh session id per QR so replays are impossible', async () => {
    const { passkey } = await setupPhoneDevice();
    const qr1 = generateCaBLEQRCode(makeSessionOptions(passkey));
    const qr2 = generateCaBLEQRCode(makeSessionOptions(passkey));
    expect(qr1.sessionId).toBe('cable-session-1');
    expect(qr2.sessionId).toBe('cable-session-2');
    expect(qr1.publicKey).not.toBe(qr2.publicKey);
  });
});

describe('caBLE fidelity axis 2 — BLE advertisement handshake', () => {
  it('derives matching shared secrets on both sides and flags verified=true', async () => {
    const { passkey } = await setupPhoneDevice();
    const qr = generateCaBLEQRCode(makeSessionOptions(passkey));
    const handshake = performBLEHandshake(qr);
    expect(handshake.sessionId).toBe(qr.sessionId);
    expect(handshake.sharedSecret).toBe(
      `shared-secret::${qr.sessionId}::${qr.nonce}`,
    );
    expect(handshake.verified).toBe(true);
  });

  it('encodes the BLE advertisement payload with the session id embedded', async () => {
    const { passkey } = await setupPhoneDevice();
    const qr = generateCaBLEQRCode(makeSessionOptions(passkey));
    const handshake = performBLEHandshake(qr);
    expect(handshake.advertisementPayload).toContain(qr.sessionId);
    expect(handshake.advertisementPayload).toMatch(/^ble-adv::/);
  });

  it('rejects a QR payload with an empty session id (correlation impossible)', async () => {
    const { passkey } = await setupPhoneDevice();
    const qr = generateCaBLEQRCode(makeSessionOptions(passkey));
    expect(() =>
      performBLEHandshake({ ...qr, sessionId: '' }),
    ).toThrow(/sessionId is empty/);
  });

  it('binds the shared secret to the nonce so a swapped nonce produces a different secret', async () => {
    const { passkey } = await setupPhoneDevice();
    const qrA = generateCaBLEQRCode(makeSessionOptions(passkey));
    const qrB = generateCaBLEQRCode(
      makeSessionOptions(passkey, { nonce: 'nonce-different' }),
    );
    const handshakeA = performBLEHandshake(qrA);
    const handshakeB = performBLEHandshake(qrB);
    expect(handshakeA.sharedSecret).not.toBe(handshakeB.sharedSecret);
  });
});

describe('caBLE fidelity axis 3 — WebSocket tunnel establishment', () => {
  it('opens the tunnel with the same session id + tunnel hint the QR advertised', async () => {
    const { passkey } = await setupPhoneDevice();
    const qr = generateCaBLEQRCode(makeSessionOptions(passkey));
    const handshake = performBLEHandshake(qr);
    const tunnel = establishWebSocketTunnel(qr, handshake);
    expect(tunnel.sessionId).toBe(qr.sessionId);
    expect(tunnel.tunnelServerHint).toBe(qr.tunnelServerHint);
    expect(tunnel.established).toBe(true);
    expect(tunnel.closed).toBe(false);
  });

  it('accepts sends + drains messages in FIFO order', async () => {
    const { passkey } = await setupPhoneDevice();
    const qr = generateCaBLEQRCode(makeSessionOptions(passkey));
    const handshake = performBLEHandshake(qr);
    const tunnel = establishWebSocketTunnel(qr, handshake);
    tunnel.send('msg-1');
    tunnel.send('msg-2');
    tunnel.send('msg-3');
    expect(tunnel.drain()).toEqual(['msg-1', 'msg-2', 'msg-3']);
    // second drain is empty — messages are consumed on drain
    expect(tunnel.drain()).toEqual([]);
  });

  it('refuses to open the tunnel when the BLE handshake failed to verify', async () => {
    const { passkey } = await setupPhoneDevice();
    const qr = generateCaBLEQRCode(makeSessionOptions(passkey));
    const handshake = performBLEHandshake(qr);
    const brokenHandshake = { ...handshake, verified: false };
    expect(() => establishWebSocketTunnel(qr, brokenHandshake)).toThrow(
      /BLE handshake not verified/,
    );
  });

  it('refuses to open the tunnel when session ids mismatch between QR and handshake', async () => {
    const { passkey } = await setupPhoneDevice();
    const qr = generateCaBLEQRCode(makeSessionOptions(passkey));
    const handshake = performBLEHandshake(qr);
    const mismatched = { ...handshake, sessionId: 'cable-session-different' };
    expect(() => establishWebSocketTunnel(qr, mismatched)).toThrow(
      /session id mismatch/,
    );
  });

  it('rejects send + drain after close and reports closed=true', async () => {
    const { passkey } = await setupPhoneDevice();
    const qr = generateCaBLEQRCode(makeSessionOptions(passkey));
    const handshake = performBLEHandshake(qr);
    const tunnel = establishWebSocketTunnel(qr, handshake);
    tunnel.close();
    expect(tunnel.closed).toBe(true);
    expect(() => tunnel.send('after-close')).toThrow(/cannot send on closed tunnel/);
    expect(() => tunnel.drain()).toThrow(/cannot drain closed tunnel/);
  });
});

describe('caBLE fidelity axis 4 — credential migration payload', () => {
  it('ships the credential over the tunnel + tags it with an encrypted payload string', async () => {
    const { passkey } = await setupPhoneDevice();
    const qr = generateCaBLEQRCode(makeSessionOptions(passkey));
    const handshake = performBLEHandshake(qr);
    const tunnel = establishWebSocketTunnel(qr, handshake);
    const migration = migrateCredential(tunnel, passkey);
    expect(migration.credentialId).toBe(passkey.credentialId);
    expect(migration.sessionId).toBe(qr.sessionId);
    expect(migration.encryptedPayload).toBe(
      `enc::${qr.sessionId}::${passkey.credentialId}::${passkey.userId}`,
    );
    // credential shipped verbatim so the initiator can persist it
    expect(migration.credential).toBe(passkey);
  });

  it('records the migration payload on the tunnel wire log', async () => {
    const { passkey } = await setupPhoneDevice();
    const qr = generateCaBLEQRCode(makeSessionOptions(passkey));
    const handshake = performBLEHandshake(qr);
    const tunnel = establishWebSocketTunnel(qr, handshake);
    const migration = migrateCredential(tunnel, passkey);
    const wireLog = tunnel.drain();
    expect(wireLog).toContain(migration.encryptedPayload);
  });

  it('refuses to migrate over a closed tunnel', async () => {
    const { passkey } = await setupPhoneDevice();
    const qr = generateCaBLEQRCode(makeSessionOptions(passkey));
    const handshake = performBLEHandshake(qr);
    const tunnel = establishWebSocketTunnel(qr, handshake);
    tunnel.close();
    expect(() => migrateCredential(tunnel, passkey)).toThrow(
      /cannot migrate credential over closed tunnel/,
    );
  });
});

describe('caBLE fidelity axis 5 — signature roundtrip', () => {
  it('produces a signature over the challenge + verifies it on the initiator side', async () => {
    const { passkey } = await setupPhoneDevice();
    const qr = generateCaBLEQRCode(makeSessionOptions(passkey));
    const handshake = performBLEHandshake(qr);
    const tunnel = establishWebSocketTunnel(qr, handshake);
    const roundtrip = performSignatureRoundtrip(
      tunnel,
      passkey,
      'challenge-assertion-1',
    );
    expect(roundtrip.credentialId).toBe(passkey.credentialId);
    expect(roundtrip.challenge).toBe('challenge-assertion-1');
    expect(roundtrip.signature).toBe(
      `sig::${passkey.credentialId}::challenge-assertion-1::${qr.sessionId}`,
    );
    expect(roundtrip.verified).toBe(true);
  });

  it('records the signature on the tunnel wire log after the migration payload', async () => {
    const { passkey } = await setupPhoneDevice();
    const qr = generateCaBLEQRCode(makeSessionOptions(passkey));
    const handshake = performBLEHandshake(qr);
    const tunnel = establishWebSocketTunnel(qr, handshake);
    migrateCredential(tunnel, passkey);
    performSignatureRoundtrip(tunnel, passkey, 'challenge-assertion-1');
    const wireLog = tunnel.drain();
    expect(wireLog).toHaveLength(2);
    expect(wireLog[0]).toContain('enc::');
    expect(wireLog[1]).toContain('sig::');
  });

  it('refuses to sign an empty challenge (WebAuthn L3 §7.2 forbids empty assertions)', async () => {
    const { passkey } = await setupPhoneDevice();
    const qr = generateCaBLEQRCode(makeSessionOptions(passkey));
    const handshake = performBLEHandshake(qr);
    const tunnel = establishWebSocketTunnel(qr, handshake);
    expect(() => performSignatureRoundtrip(tunnel, passkey, '')).toThrow(
      /challenge is empty/,
    );
  });

  it('refuses to sign over a closed tunnel', async () => {
    const { passkey } = await setupPhoneDevice();
    const qr = generateCaBLEQRCode(makeSessionOptions(passkey));
    const handshake = performBLEHandshake(qr);
    const tunnel = establishWebSocketTunnel(qr, handshake);
    tunnel.close();
    expect(() =>
      performSignatureRoundtrip(tunnel, passkey, 'challenge-1'),
    ).toThrow(/cannot sign over closed tunnel/);
  });
});

describe('caBLE end-to-end ceremony — runCaBLESession chains every step', () => {
  it('runs QR → BLE → tunnel → migration → signature and reports every step completed', async () => {
    const { passkey } = await setupPhoneDevice();
    const session = runCaBLESession(
      makeSessionOptions(passkey),
      'challenge-cable-1',
    );
    expect(session.stepsCompleted).toEqual([
      'qr-code',
      'ble-handshake',
      'websocket-tunnel',
      'credential-migration',
      'signature-roundtrip',
    ]);
    expect(session.qrCode.sessionId).toBe(session.sessionId);
    expect(session.handshake.sessionId).toBe(session.sessionId);
    expect(session.tunnel.sessionId).toBe(session.sessionId);
    expect(session.migration.sessionId).toBe(session.sessionId);
    expect(session.signature.sessionId).toBe(session.sessionId);
    expect(session.signature.verified).toBe(true);
    expect(session.handshake.verified).toBe(true);
  });

  it('the migrated credential id equals the assertion signature credential id (no cross-session leak)', async () => {
    const { passkey } = await setupPhoneDevice();
    const session = runCaBLESession(
      makeSessionOptions(passkey),
      'challenge-cable-2',
    );
    expect(session.migration.credentialId).toBe(passkey.credentialId);
    expect(session.signature.credentialId).toBe(passkey.credentialId);
  });

  it('two consecutive sessions produce independent session ids + independent public keys', async () => {
    const { passkey } = await setupPhoneDevice();
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
});
