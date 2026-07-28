---
title: "@kiwa-lab/auth webauthn__types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>webauthn&#95;&#95;types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)



### 型

#### <code v-pre>AuthenticatorAssertionResponse</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/types.ts#L149) <code v-pre>packages/auth/src/webauthn/types.ts</code>

Authenticator assertion response — the client returns this to the RP after `navigator.credentials.get()`. The mock produces a shape compatible with WebAuthn L3 §5.2.2. `signCount` is returned so the RP can update its stored counter and detect cloned authenticators.

```ts
export interface AuthenticatorAssertionResponse {
    credentialId: string;
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle: string;
    signCount: number;
}
```

#### <code v-pre>AuthenticatorAttestationResponse</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/types.ts#L133) <code v-pre>packages/auth/src/webauthn/types.ts</code>

Authenticator attestation response — the client returns this to the RP after `navigator.credentials.create()`. The mock produces a shape compatible with WebAuthn L3 §5.2.1; `attestationObject` and `clientDataJSON` are the two fields real RPs decode.

```ts
export interface AuthenticatorAttestationResponse {
    credentialId: string;
    clientDataJSON: string;
    attestationObject: string;
    attestation: WebAuthnAttestationConveyancePreference;
    publicKey: string;
    transports: WebAuthnTransport[];
    attachment: WebAuthnAuthenticatorAttachment;
}
```

#### <code v-pre>AuthenticatorSelectionCriteria</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/types.ts#L71) <code v-pre>packages/auth/src/webauthn/types.ts</code>

Authenticator selection criteria (WebAuthn L3 §5.4.4). Combines the fields an RP passes to `navigator.credentials.create({ publicKey: { authenticatorSelection } })`.

```ts
export interface AuthenticatorSelectionCriteria {
    authenticatorAttachment?: WebAuthnAuthenticatorAttachment;
    userVerification?: WebAuthnUserVerificationRequirement;
    residentKey?: WebAuthnResidentKeyRequirement;
    /** Legacy alias — `residentKey: 'required'` supersedes when both are set. */
    requireResidentKey?: boolean;
}
```

#### <code v-pre>PublicKeyCredentialCreationOptionsInit</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/types.ts#L84) <code v-pre>packages/auth/src/webauthn/types.ts</code>

Simplified `PublicKeyCredentialCreationOptions` (WebAuthn L3 §5.4). The real spec surfaces `Uint8Array` challenge / user.id — the mock accepts either the spec shape or plain strings and normalizes internally.

```ts
export interface PublicKeyCredentialCreationOptionsInit {
    rp: {
        id: string;
        name: string;
    };
    user: {
        id: string | Uint8Array;
        name: string;
        displayName: string;
    };
    challenge: string | Uint8Array;
    pubKeyCredParams?: Array<{
        type: 'public-key';
        alg: number;
    }>;
    timeout?: number;
    excludeCredentials?: Array<{
        id: string;
        type: 'public-key';
    }>;
    authenticatorSelection?: AuthenticatorSelectionCriteria;
    attestation?: WebAuthnAttestationConveyancePreference;
}
```

#### <code v-pre>PublicKeyCredentialRequestOptionsInit</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/types.ts#L99) <code v-pre>packages/auth/src/webauthn/types.ts</code>

Simplified `PublicKeyCredentialRequestOptions` (WebAuthn L3 §5.5). Used by `credentialAssertion` when the RP asks the client to prove possession.

```ts
export interface PublicKeyCredentialRequestOptionsInit {
    rpId: string;
    challenge: string | Uint8Array;
    timeout?: number;
    allowCredentials?: Array<{
        id: string;
        type: 'public-key';
    }>;
    userVerification?: WebAuthnUserVerificationRequirement;
}
```

#### <code v-pre>SetupWebAuthnEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/types.ts#L225) <code v-pre>packages/auth/src/webauthn/types.ts</code>

Options accepted by `setupWebAuthnEnv`. Callers can preseed the environment with authenticators or leave it empty and add them lazily.

```ts
export interface SetupWebAuthnEnvOptions {
    authenticators?: VirtualAuthenticatorOptions[];
}
```

#### <code v-pre>VirtualAuthenticator</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/types.ts#L189) <code v-pre>packages/auth/src/webauthn/types.ts</code>

Virtual authenticator handle. Callers do not construct this directly — use `createVirtualAuthenticator({ ... })`.

```ts
export interface VirtualAuthenticator {
    readonly id: string;
    readonly attachment: WebAuthnAuthenticatorAttachment;
    readonly transport: WebAuthnTransport;
    readonly hasResidentKey: boolean;
    readonly hasUserVerification: boolean;
    isUserPresent: boolean;
    /** Snapshot of credentials currently stored on this authenticator. */
    listCredentials(): WebAuthnCredential[];
}
```

#### <code v-pre>VirtualAuthenticatorOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/types.ts#L163) <code v-pre>packages/auth/src/webauthn/types.ts</code>

Configuration for `createVirtualAuthenticator`. Mirrors the Chrome Virtual Authenticator Protocol (`WebAuthn.addVirtualAuthenticator` in the DevTools protocol, used by Playwright / Puppeteer).

```ts
export interface VirtualAuthenticatorOptions {
    attachment: WebAuthnAuthenticatorAttachment;
    transport: WebAuthnTransport;
    /**
     * When `true` the authenticator stores discoverable credentials
     * (resident keys) that survive across sessions.
     */
    hasResidentKey?: boolean;
    /**
     * When `true` the authenticator can perform user verification (biometric /
     * PIN). When `false` the authenticator is UV=false regardless of RP
     * preference.
     */
    hasUserVerification?: boolean;
    /**
     * When `true` the authenticator claims user presence for every assertion
     * (default). When `false` the mock returns UP=0 to simulate an authenticator
     * that failed the touch gesture.
     */
    isUserPresent?: boolean;
}
```

#### <code v-pre>WebAuthnAttestationConveyancePreference</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/types.ts#L40) <code v-pre>packages/auth/src/webauthn/types.ts</code>

Attestation conveyance preference (WebAuthn L3 §5.4.7). `none` — RP does not want attestation, authenticator returns a self-signed empty attestation. `indirect` — client may substitute an anonymized attestation CA. `direct` — RP wants the raw attestation statement. `enterprise` — RP is allowed to receive uniquely-identifying attestation (enterprise deployments only). The mock returns matching attestation object shapes for each.

```ts
export type WebAuthnAttestationConveyancePreference = 'none' | 'indirect' | 'direct' | 'enterprise';
```

#### <code v-pre>WebAuthnAuthenticatorAttachment</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/types.ts#L29) <code v-pre>packages/auth/src/webauthn/types.ts</code>

`platform` — authenticator is bound to the device (Touch ID, Windows Hello). `cross-platform` — authenticator is a roaming key (YubiKey, phone via caBLE). Mirrors the `authenticatorAttachment` field from WebAuthn L3 §5.4.5.

```ts
export type WebAuthnAuthenticatorAttachment = 'platform' | 'cross-platform';
```

#### <code v-pre>WebAuthnCredential</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/types.ts#L113) <code v-pre>packages/auth/src/webauthn/types.ts</code>

Stored credential record. WebAuthn L3 §6.1 defines the authenticator-side storage — the mock keeps the shape the RP would round-trip through its own database. `signCount` is the monotonic counter used to detect cloned authenticators (§6.1.1).

```ts
export interface WebAuthnCredential {
    credentialId: string;
    userHandle: string;
    publicKey: string;
    signCount: number;
    transports: WebAuthnTransport[];
    attachment: WebAuthnAuthenticatorAttachment;
    discoverable: boolean;
    /** Millisecond wall clock at credential creation, for ordering / audit. */
    createdAt: number;
    /** Millisecond wall clock at last successful assertion. */
    lastUsedAt?: number;
}
```

#### <code v-pre>WebAuthnResidentKeyRequirement</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/types.ts#L62) <code v-pre>packages/auth/src/webauthn/types.ts</code>

`required` — credential must be stored on the authenticator (discoverable / resident credential, enables usernameless login). `preferred` — store if possible. `discouraged` — do not store (server-side credential, WebAuthn L3 §5.4.6).

```ts
export type WebAuthnResidentKeyRequirement = 'required' | 'preferred' | 'discouraged';
```

#### <code v-pre>WebAuthnTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/types.ts#L204) <code v-pre>packages/auth/src/webauthn/types.ts</code>

`setupWebAuthnEnv` return shape. Follows the kiwa factory convention — one `stop()` disposes the environment and clears all in-memory state.

```ts
export interface WebAuthnTestEnv extends TestEnvBase<'mock'> {
    readonly authenticators: readonly VirtualAuthenticator[];
    addAuthenticator(options: VirtualAuthenticatorOptions): VirtualAuthenticator;
    removeAuthenticator(id: string): void;
    credentialCreation(options: PublicKeyCredentialCreationOptionsInit, authenticatorId?: string): Promise<AuthenticatorAttestationResponse>;
    credentialAssertion(options: PublicKeyCredentialRequestOptionsInit): Promise<AuthenticatorAssertionResponse>;
    getCredential(credentialId: string): WebAuthnCredential | null;
    listCredentials(): WebAuthnCredential[];
    deleteCredential(credentialId: string): boolean;
    reset(): void;
}
```

#### <code v-pre>WebAuthnTransport</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/types.ts#L10) <code v-pre>packages/auth/src/webauthn/types.ts</code>

Chrome Virtual Authenticator API mirrors WebAuthn L3 spec §6.2. Transport defines how the client speaks to the authenticator — `internal` for platform authenticators (Touch ID / Windows Hello), `usb` / `nfc` / `ble` for roaming security keys. The `hybrid` transport was rebranded to `caBLE` in later drafts and is covered by the passkey adapter (v1.21-1b), not here.

```ts
export type WebAuthnTransport = 'internal' | 'usb' | 'nfc' | 'ble' | 'hybrid';
```

#### <code v-pre>WebAuthnUserVerificationRequirement</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/types.ts#L51) <code v-pre>packages/auth/src/webauthn/types.ts</code>

`required` — user verification (biometric / PIN) is mandatory. `preferred` — request but do not require UV. `discouraged` — do not perform UV (WebAuthn L3 §5.4.6).

```ts
export type WebAuthnUserVerificationRequirement = 'required' | 'preferred' | 'discouraged';
```
