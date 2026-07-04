# WebAuthn L3 + Passkey — virtual authenticator, credential creation + assertion, sync fabric in 12 min

## What you'll build

A vitest suite for a WebAuthn L3 relying party (RP) that exercises the four spec-critical ceremonies — virtual authenticator mount, credential creation + attestation, credential assertion + userVerification, and Passkey backup + restore across the iCloud Keychain / Google Password Manager sync fabric. The tests never boot a real browser or plug in a security key; they drive the L3 ceremony surfaces through `@kiwa-test/auth` v1.21-1's virtual-authenticator-shaped stubs so the same suite runs in Node.js without Chrome DevTools Protocol, Playwright, or a physical roaming authenticator.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn — the tutorial uses pnpm)
- An empty directory to work in

## Step-by-step build

```bash
mkdir kiwa-webauthn-first && cd kiwa-webauthn-first
pnpm init
pnpm add -D @kiwa-test/auth@0.1 vitest typescript @types/node
```

Add the vitest script and TypeScript configuration in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run"
  }
}
```

Ship a `tsconfig.json` that matches the ESM shape `@kiwa-test/auth` exports.

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

Add the WebAuthn test at `tests/webauthn.test.ts`. The four sections walk exactly the shape RP teams hit — virtual authenticator mount, credential creation + attestation modes, credential assertion + signCount monotonic bump, and Passkey backup + restore through the sync fabric.

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  __resetPasskeyCounters,
  __resetWebAuthnCounters,
  setupPasskeyEnv,
  setupWebAuthnEnv,
  type PasskeyTestEnv,
  type WebAuthnTestEnv,
} from '@kiwa-test/auth';

const webauthnEnvs: WebAuthnTestEnv[] = [];
const passkeyEnvs: PasskeyTestEnv[] = [];

beforeEach(() => {
  __resetWebAuthnCounters();
  __resetPasskeyCounters();
});

afterEach(async () => {
  while (webauthnEnvs.length > 0) {
    const env = webauthnEnvs.pop();
    if (env) await env.stop();
  }
  while (passkeyEnvs.length > 0) {
    const env = passkeyEnvs.pop();
    if (env) await env.stop();
  }
});

describe('virtual authenticator mount (WebAuthn L3 §5.1)', () => {
  it('mounts a platform authenticator with internal transport + resident key + UV', async () => {
    const env = await setupWebAuthnEnv({
      authenticators: [
        {
          attachment: 'platform',
          transport: 'internal',
          hasResidentKey: true,
          hasUserVerification: true,
        },
      ],
    });
    webauthnEnvs.push(env);
    expect(env.authenticators).toHaveLength(1);
    expect(env.authenticators[0]!.attachment).toBe('platform');
    expect(env.authenticators[0]!.transport).toBe('internal');
    expect(env.mode).toBe('mock');
  });

  it('rejects platform attachment paired with a non-internal transport', async () => {
    await expect(
      setupWebAuthnEnv({
        authenticators: [{ attachment: 'platform', transport: 'usb' }],
      }),
    ).rejects.toThrow(/platform attachment requires internal transport/);
  });
});

describe('credential creation + attestation (WebAuthn L3 §5.1.3)', () => {
  it('produces an attestationObject for each of the 4 attestation modes', async () => {
    const env = await setupWebAuthnEnv({
      authenticators: [
        {
          attachment: 'platform',
          transport: 'internal',
          hasResidentKey: true,
          hasUserVerification: true,
        },
      ],
    });
    webauthnEnvs.push(env);
    const modes = ['none', 'indirect', 'direct', 'enterprise'] as const;
    for (const attestation of modes) {
      const response = await env.credentialCreation({
        rp: { id: 'example.test', name: 'Example RP' },
        user: { id: `user-${attestation}`, name: 'alice', displayName: 'Alice' },
        challenge: `challenge-${attestation}`,
        attestation,
      });
      expect(response.attestation).toBe(attestation);
      expect(response.credentialId).toMatch(/^credential-\d+$/);
      expect(response.attachment).toBe('platform');
    }
    expect(env.listCredentials()).toHaveLength(4);
  });

  it('creates a discoverable credential when residentKey=required', async () => {
    const env = await setupWebAuthnEnv({
      authenticators: [
        {
          attachment: 'platform',
          transport: 'internal',
          hasResidentKey: true,
          hasUserVerification: true,
        },
      ],
    });
    webauthnEnvs.push(env);
    const response = await env.credentialCreation({
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
      challenge: 'challenge-1',
      authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
    });
    expect(env.getCredential(response.credentialId)?.discoverable).toBe(true);
  });
});

describe('credential assertion + signCount (WebAuthn L3 §5.1.4)', () => {
  it('bumps signCount monotonically on every assertion', async () => {
    const env = await setupWebAuthnEnv({
      authenticators: [
        {
          attachment: 'platform',
          transport: 'internal',
          hasResidentKey: true,
          hasUserVerification: true,
        },
      ],
    });
    webauthnEnvs.push(env);
    await env.credentialCreation({
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
      challenge: 'challenge-create',
    });
    const first = await env.credentialAssertion({
      rpId: 'example.test',
      challenge: 'challenge-get-1',
    });
    const second = await env.credentialAssertion({
      rpId: 'example.test',
      challenge: 'challenge-get-2',
    });
    expect(first.signCount).toBe(1);
    expect(second.signCount).toBe(2);
    expect(second.signCount).toBeGreaterThan(first.signCount);
  });

  it('rejects userVerification=required against an authenticator without UV', async () => {
    const env = await setupWebAuthnEnv({
      authenticators: [
        {
          attachment: 'cross-platform',
          transport: 'usb',
          hasResidentKey: true,
          hasUserVerification: false,
        },
      ],
    });
    webauthnEnvs.push(env);
    await env.credentialCreation({
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
      challenge: 'challenge-create',
    });
    await expect(
      env.credentialAssertion({
        rpId: 'example.test',
        challenge: 'challenge-get',
        userVerification: 'required',
      }),
    ).rejects.toThrow(/userVerification=required but authenticator does not support user verification/);
  });
});

describe('Passkey sync fabric — backup + restore (v1.21-1b)', () => {
  it('backs up a Passkey into iCloud Keychain and restores it onto a fresh device', async () => {
    const env = await setupPasskeyEnv({
      devices: [
        { deviceId: 'macbook-old', platform: { biometric: 'touch-id' } },
        { deviceId: 'macbook-new', platform: { biometric: 'touch-id' } },
      ],
    });
    passkeyEnvs.push(env);
    const created = await env.createPasskey('macbook-old', 'user-1', {
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
      challenge: 'c-create',
    });
    env.backupCredential(created.credentialId, 'icloud-keychain');
    env.removeDevice('macbook-old');
    const restored = env.restoreCredential(
      'macbook-new',
      'user-1',
      created.credentialId,
      'icloud-keychain',
    );
    expect(restored.credentialId).toBe(created.credentialId);
    expect(restored.originDeviceId).toBe('macbook-old');
    const assertion = await env.authenticate('macbook-new', {
      rpId: 'example.test',
      challenge: 'c-post-restore',
    });
    expect(assertion.credentialId).toBe(created.credentialId);
    expect(assertion.signCount).toBe(1);
  });

  it('rejects backup of a non-backup-eligible security-key credential', async () => {
    const env = await setupPasskeyEnv({
      devices: [{ deviceId: 'ykey-1', roaming: { kind: 'security-key' } }],
    });
    passkeyEnvs.push(env);
    const created = await env.createPasskey('ykey-1', 'user-1', {
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
      challenge: 'c-create',
    });
    expect(() => env.backupCredential(created.credentialId, 'icloud-keychain')).toThrow(
      /is not backup-eligible/,
    );
  });
});
```

## Run

```bash
pnpm test
```

Vitest picks up the file, runs the 8 tests in a single Node.js process, and exits green in under a second. No Chrome, no Playwright, no Chrome DevTools Protocol, no physical security key — `setupWebAuthnEnv` + `setupPasskeyEnv` deliver the observable contract a real browser + roaming authenticator enforce, without the boot cost.

## Why WebAuthn L3 diverges from OAuth on 4 axes

WebAuthn L3 diverges from OAuth-shaped bearer flows on four axes that show up in every non-trivial RP test — virtual authenticator taxonomy, attestationObject shape, signCount monotonic bump, and Passkey backup eligibility.

- **Virtual authenticator taxonomy** — WebAuthn splits authenticators along `attachment` (`platform` vs `cross-platform`) × `transport` (`internal` / `usb` / `nfc` / `ble` / `hybrid`) × `hasResidentKey` × `hasUserVerification`. Some combinations are meaningless (platform + usb refuses at setup time) and some are load-bearing (residentKey=required + hasResidentKey=false refuses at credential-creation time). `setupWebAuthnEnv` records both.
- **AttestationObject shape** — `credentialCreation({ attestation })` accepts `none` / `indirect` / `direct` / `enterprise`. Each shape carries a different set of certificate fields. The mock produces a deterministic attestationObject per mode so RP-side attestation parsing has a stable target.
- **SignCount monotonic bump** — every successful `credentialAssertion` bumps the authenticator's `signCount` by 1. A stale signCount (a rewound clone) is the WebAuthn spec's cloning-detection signal. The mock lets you assert on the exact bump.
- **Passkey backup eligibility** — a bare security-key credential is not backup-eligible; a platform authenticator (Touch ID / Face ID / Windows Hello / Android Biometric) is. Backup + restore through the sync fabric (`icloud-keychain` / `google-password-manager`) only accepts backup-eligible credentials.

`@kiwa-test/auth` v1.21-1 records each axis.

- **Attachment × transport contract** — `setupWebAuthnEnv({ authenticators: [{ attachment, transport, hasResidentKey, hasUserVerification }] })` throws at setup time when the pair is invalid. `attachment: 'platform'` demands `transport: 'internal'`; `attachment: 'cross-platform'` refuses `transport: 'internal'`.
- **AttestationObject** — `credentialCreation({ attestation })` returns `{ attestationObject, credentialId, attachment, transports, clientDataJSON }`. `base64UrlDecodeWebAuthn(response.attestationObject)` yields a deterministic byte string that RP-side parsers can walk.
- **SignCount** — `credentialAssertion({ rpId, challenge })` returns `{ signCount, credentialId, authenticatorData, signature }`. `signCount` is the authenticator's `signCount` after the assertion — 1 on the first, 2 on the second, N on the Nth.
- **Sync fabric** — `env.backupCredential(credentialId, vendor)` + `env.restoreCredential(deviceId, userId, credentialId, vendor)` + `env.syncCredentials(sourceDeviceId, targetDeviceId, userId, vendor)`. The fabric refuses backups of non-backup-eligible credentials and refuses restores when the requester does not own the credential.

Three properties are load-bearing.

- **`residentKey=required` demands `hasResidentKey=true`.** `credentialCreation({ authenticatorSelection: { residentKey: 'required' } })` throws when the chosen authenticator has no resident-key storage. The test surfaces the error at ceremony time, not at RP-server discovery time.
- **`userVerification=required` demands `hasUserVerification=true`.** `credentialAssertion({ userVerification: 'required' })` throws when the chosen authenticator has no UV. The test catches the mismatch at assertion time.
- **`syncEpoch` bumps on every backup.** `env.backupCredential(credentialId, vendor)` returns `{ syncEpoch, syncedFabrics }`. The epoch increments monotonically per credential, so a test can assert on the sync sequence without needing a real iCloud clock.

## What the mock cuts down

Real WebAuthn boots a headed Chrome (~200 MB, ~2 s cold start), the Chrome DevTools Protocol Virtual Authenticator API, and each test seeds a Playwright fixture that mounts + unmounts the virtual authenticator per test. The mock cuts all three costs — 0 browsers, 0 network, ~1 ms per test.

That matters because production bugs show up as "the credential was created with `residentKey=preferred` but the roaming authenticator did not store it, so the discoverable-credential login refused" or "the signCount did not bump because the authenticator's `isUserPresent` was cleared before the assertion". The mock records both transitions, so the assertion is `expect(env.getCredential(id)?.discoverable).toBe(true)` or `expect(assertion.signCount).toBe(N)` — machine-checkable, no Chrome.

For a full 4-axis fidelity harness that compares mock traces against a real Chrome + Virtual Authenticator process, see `examples/dogfood-webauthn-passkey-app` and its `quality-reports/auth/webauthn-passkey-app-register.md`.

## Related

- Concept doc — [Auth protocol testing (virtual authenticator / PKCE+DPoP / id_token / discovery+federation SSOT)](../concepts/auth-protocol-testing)
- Tutorial 35 — [OAuth 2.1 provider (PKCE + DPoP + refresh rotation + revocation)](./35-oauth21-provider)
- Tutorial 36 — [OIDC provider + Federation (Discovery + DCR + id_token + trust chain)](./36-oidc-federation)
- v1.21-1a [#848](https://github.com/cardene777/kiwa/issues/848) — WebAuthn L3 adapter landing
- v1.21-1b [#849](https://github.com/cardene777/kiwa/issues/849) — Passkey adapter (sync fabric) landing
- v1.21-2 [#843](https://github.com/cardene777/kiwa/issues/843) — `dogfood-webauthn-passkey-app` (the full RP dogfood this tutorial cuts down)
