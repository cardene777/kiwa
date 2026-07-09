# Passkey caBLE hybrid transport — QR + BLE + WebSocket tunnel in 15 min

## What you'll build

A vitest suite exercising the **CTAP 2.2 hybrid transport** (caBLE — Cloud-Assisted Bluetooth Low Energy) flow that Passkey uses to move credentials from a phone to a laptop that has no built-in authenticator. The test never boots a real Chrome + phone pair; it drives the 5-step hybrid handshake through `@kiwa-lab/auth`'s caBLE mock — QR generation, BLE advertisement handshake, WebSocket tunnel establishment, credential migration payload, signature roundtrip. The v1.22 milestone added this surface (`v1.22-4`, dogfood app `dogfood-webauthn-passkey-app`); this tutorial walks the same harness in a fresh repo.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory

## Step-by-step build

### 1. Bootstrap

```bash
mkdir kiwa-cable-first && cd kiwa-cable-first
pnpm init
pnpm add -D @kiwa-lab/auth@^0.5 vitest typescript @types/node
```

`package.json`:

```json
{
  "type": "module",
  "scripts": { "test": "vitest run" }
}
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

### 2. The 5-step hybrid transport contract

`docs/concepts/real-driver-testing.md` documents the same shape; here's the working summary a test walks.

1. **QR generation (`generateCaBLEQRCode`)** — the laptop RP renders a QR carrying `{ publicKey, tunnelServerHint, nonce, sessionId }`. The phone scans it.
2. **BLE advertisement handshake (`performBLEHandshake`)** — the phone broadcasts a signed advertisement; both sides derive a matching `sharedSecret` from the same nonce.
3. **WebSocket tunnel establishment (`establishWebSocketTunnel`)** — the phone opens an outbound WebSocket to `tunnelServerHint`, encrypts the traffic with the ephemeral pair, and both sides confirm `established: true`.
4. **Credential migration payload (`migrateCredential`)** — the phone sends `{ credentialId, encryptedPayload, credential }` over the tunnel. The laptop binds the credential to the current session.
5. **Signature roundtrip (`performSignatureRoundtrip`)** — the laptop asks the phone to sign the RP's assertion challenge; the phone returns a signature and the laptop verifies against the migrated credential.

Each step surfaces its own artifact so the fidelity harness can assert on the wire format without driving a real Bluetooth stack.

### 3. Write the harness

`tests/cable.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  __resetPasskeyCounters,
  establishWebSocketTunnel,
  generateCaBLEQRCode,
  migrateCredential,
  performBLEHandshake,
  performSignatureRoundtrip,
  runCaBLESession,
  setupPasskeyEnv,
  type CaBLESessionOptions,
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

async function makeEnvWithCredential() {
  const env = await setupPasskeyEnv({
    devices: [
      { deviceId: 'phone-A', platform: { biometric: 'touch-id' } },
      { deviceId: 'laptop-A', roaming: { transport: 'hybrid' } },
    ],
  });
  envs.push(env);
  const credential = await env.createPasskey('phone-A', 'user-1', {
    rp: { id: 'example.test', name: 'Example RP' },
    user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
    challenge: 'cable-create',
  });
  return { env, credential };
}

function options(credential: any): CaBLESessionOptions {
  return {
    initiatorDeviceId: 'laptop-A',
    responderDeviceId: 'phone-A',
    credential,
    tunnelServerHint: 'wss://cable.example.test/tunnel/xyz',
    nonce: 'nonce-1',
  };
}

describe('caBLE hybrid transport — 5-axis fidelity harness', () => {
  it('axis 1 — QR generation encodes the ephemeral publicKey + tunnel hint + nonce', async () => {
    const { credential } = await makeEnvWithCredential();
    const qr = generateCaBLEQRCode(options(credential));
    expect(qr.tunnelServerHint).toBe('wss://cable.example.test/tunnel/xyz');
    expect(qr.nonce).toBe('nonce-1');
    expect(qr.publicKey).toContain('cable-pubkey');
    expect(qr.sessionId).toMatch(/^cable-session-\d+$/);
  });

  it('axis 2 — BLE advertisement handshake derives a matching sharedSecret', async () => {
    const { credential } = await makeEnvWithCredential();
    const qr = generateCaBLEQRCode(options(credential));
    const handshake = performBLEHandshake(qr);
    expect(handshake.verified).toBe(true);
    expect(handshake.sessionId).toBe(qr.sessionId);
    expect(handshake.sharedSecret.length).toBeGreaterThan(0);
  });

  it('axis 3 — WebSocket tunnel establishes and both sides confirm `established: true`', async () => {
    const { credential } = await makeEnvWithCredential();
    const qr = generateCaBLEQRCode(options(credential));
    const handshake = performBLEHandshake(qr);
    const tunnel = establishWebSocketTunnel(qr, handshake);
    expect(tunnel.established).toBe(true);
    expect(tunnel.closed).toBe(false);
    expect(tunnel.tunnelServerHint).toBe(qr.tunnelServerHint);
  });

  it('axis 4 — credential migration ships the passkey + encrypted payload through the tunnel', async () => {
    const { credential } = await makeEnvWithCredential();
    const qr = generateCaBLEQRCode(options(credential));
    const handshake = performBLEHandshake(qr);
    const tunnel = establishWebSocketTunnel(qr, handshake);
    const migration = migrateCredential(tunnel, credential);
    expect(migration.credentialId).toBe(credential.credentialId);
    expect(migration.encryptedPayload).toContain(tunnel.sessionId);
    expect(migration.credential.credentialId).toBe(credential.credentialId);
  });

  it('axis 5 — signature roundtrip preserves the RP challenge and verifies', async () => {
    const { credential } = await makeEnvWithCredential();
    const qr = generateCaBLEQRCode(options(credential));
    const handshake = performBLEHandshake(qr);
    const tunnel = establishWebSocketTunnel(qr, handshake);
    migrateCredential(tunnel, credential);
    const roundtrip = performSignatureRoundtrip(tunnel, credential, 'rp-challenge-1');
    expect(roundtrip.challenge).toBe('rp-challenge-1');
    expect(roundtrip.credentialId).toBe(credential.credentialId);
    expect(roundtrip.verified).toBe(true);
  });

  it('composite — runCaBLESession chains all 5 steps in one call', async () => {
    const { credential } = await makeEnvWithCredential();
    const session = runCaBLESession(options(credential), 'rp-challenge-2');
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
```

### 4. Run the suite

```bash
pnpm test
```

All 6 axes should pass in under 200 ms.

### 5. Optional — wire the real Chrome flag

For end-to-end verification against a real browser, launch Chrome with the caBLE flag:

```
--enable-features=WebAuthenticationRemoteDesktopSupport
```

Then reuse the same 5-axis contract in Playwright. `examples/dogfood-webauthn-passkey-app/tests/cable-flow.spec.ts` is the reference implementation — it drives Chrome DevTools Protocol's `WebAuthn.setUserVerified` alongside the mock's `runCaBLESession` and compares the two. The dogfood app's fidelity report records both.

## Common pitfalls

- **`performBLEHandshake` returns `verified: false`.** The QR was regenerated between the mock and the assertion. Every QR is single-session — reuse the same QR through the whole 5-step chain.
- **`migrateCredential` throws `cannot migrate over unestablished tunnel`.** The `establishWebSocketTunnel` return value was discarded. Keep the tunnel handle alive until `performSignatureRoundtrip` returns.
- **Real Chrome does not offer the caBLE prompt.** The `--enable-features` flag must be set on the parent Chrome process, not the DevTools session. Launch Chrome fresh with the flag, then attach.
