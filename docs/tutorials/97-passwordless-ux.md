# Passwordless UX — device-bound passkey + conditional UI + cross-device flow in 15 min

## What you'll build

A vitest suite wired to `@kiwa-test/auth` v0.6 that models the 3 pieces of a real passwordless UX posture that every non-trivial production login flow eventually needs — a device-bound passkey axis that pins credential binding + sync fabric verification + credential migration (mirroring Chrome Sync + iCloud Keychain + Firefox Sync ergonomics) so a "which device is this credential bound to?" question resolves to one telemetry event without walking the raw session log, a conditional UI axis that pins autofill hint + mediation "conditional" + fallback ladder + timeout (mirroring WebAuthn L3 `mediation: "conditional"` semantics on chromium / webkit / firefox) so a silent inline passkey pick resolves without a modal, a cross-device flow axis that pins CTAP2 hybrid transport (caBLE) QR handshake + BLE proximity + tunnel state machine so a desktop-signing-with-phone flow drives to one clear handshake, and a fidelity harness that diffs mock vs real trace side-by-side across 3 browser dialects so behavioural drift stays observable.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-passwordless-ux && cd kiwa-passwordless-ux
pnpm init
pnpm add -D @kiwa-test/auth@^0.6 vitest typescript @types/node
```

### 2. Device-bound passkey

`tests/device-bound.test.ts` — bind → sync-verify → confirm credProps.rk.

```ts
import { describe, expect, it } from 'vitest';
import { semantics } from '@kiwa-test/auth';

describe('device-bound passkey', () => {
  it('binds credential to device + verifies sync fabric', () => {
    const s = semantics.startDevicePasskey({
      platform: 'chromium',
      credentialId: 'cred-1',
      boundDeviceId: 'dev-1',
      syncFabric: 'chrome',
    });
    const bound = semantics.bindToDevice(s);
    expect(bound.state).toBe('device-bound');
    const verified = semantics.verifySyncFabric(s);
    expect(verified.state).toBe('sync-verified');
    const credprops = semantics.confirmCredProps(s);
    expect(credprops.metadata.isResidentKey).toBe(true);
  });
});
```

### 3. Conditional UI

`tests/conditional-ui.test.ts` — hint → autofill select or fallback.

```ts
import { describe, expect, it } from 'vitest';
import { semantics } from '@kiwa-test/auth';

describe('conditional UI', () => {
  it('shows hint and selects autofill', () => {
    const s = semantics.startConditionalUi({ platform: 'webkit', formId: 'login' });
    semantics.showHint(s);
    const step = semantics.selectAutofill(s, { credentialId: 'cred-1', elapsedMs: 250 });
    expect(step.state).toBe('autofill-selected');
    expect(step.metadata.elapsedMs).toBe(250);
  });
});
```

### 4. Cross-device flow

`tests/cross-device.test.ts` — QR → BLE → tunnel → handshake.

```ts
import { describe, expect, it } from 'vitest';
import { semantics } from '@kiwa-test/auth';

describe('cross-device flow', () => {
  it('completes QR handshake for desktop-with-phone sign-in', () => {
    const s = semantics.startCrossDevice({ platform: 'firefox', requestId: 'req-1' });
    semantics.generateQr(s, { qrPayload: 'FIDO:/1234' });
    semantics.pairBle(s, { bleAdvKey: 'k-1', rssi: -60 });
    semantics.openTunnel(s, { tunnelUrl: 'wss://caBLE.example/tunnel' });
    const done = semantics.completeHandshake(s, { assertionSignature: 'sig-abcd' });
    expect(done.state).toBe('handshake-completed');
  });
});
```

## Run it

```bash
pnpm test
```

All 3 test files pass. You now have a passwordless UX observability suite driven by `@kiwa-test/auth` v0.6 advanced semantics, ready to plug into a real Chromium / WebKit / Firefox WebAuthn stack via `KIWA_MODE=real`.
