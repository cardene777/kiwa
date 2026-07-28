---
title: "@kiwa-lab/auth index の API 契約"
---

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>index</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>backupPasskeyCredential</code>

公開 entry point から解決しています。

<code v-pre>backupCredential</code> を <code v-pre>backupPasskeyCredential</code> として公開しています。

Push a credential blob into a sync fabric. Bumps the credential's sync epoch (real fabrics use this to detect concurrent updates across devices) and appends the vendor to `syncedFabrics` if it is not already present. Returns the updated credential — callers should replace their in-memory copy with the return value so subsequent backup / restore see the new epoch. Throws when the credential is not backup-eligible. Non-discoverable credentials minted on a bare U2F-style security key cannot participate in the fabric — the FIDO Alliance Passkey Provider spec requires the credential live on a device that can round-trip the private key material through the vendor's E2EE blob.

```ts
export {
  __resetPasskeyCounters,
  backupCredential as backupPasskeyCredential,
  createPlatformAuthenticator,
  createRoamingAuthenticator,
  createSyncFabric,
  findFabricHolding as findPasskeyFabricHolding,
  requireFabric as requirePasskeyFabric,
  restoreCredential as restorePasskeyCredential,
  setupPasskeyEnv,
  syncCredentials as syncPasskeyCredentials,
} from './passkey/index.js';
```

#### <code v-pre>base64UrlDecodeWebAuthn</code>

公開 entry point から解決しています。

<code v-pre>base64UrlDecode</code> を <code v-pre>base64UrlDecodeWebAuthn</code> として公開しています。

```ts
export {
  __resetWebAuthnCounters,
  base64UrlDecode as base64UrlDecodeWebAuthn,
  base64UrlEncode as base64UrlEncodeWebAuthn,
  clientDataHash as webAuthnClientDataHash,
  createVirtualAuthenticator,
  credentialAssertion as webAuthnCredentialAssertion,
  credentialCreation as webAuthnCredentialCreation,
  mockSignature as webAuthnMockSignature,
  normalizeChallenge as webAuthnNormalizeChallenge,
  setupWebAuthnEnv,
} from './webauthn/index.js';
```

#### <code v-pre>base64UrlEncodeWebAuthn</code>

公開 entry point から解決しています。

<code v-pre>base64UrlEncode</code> を <code v-pre>base64UrlEncodeWebAuthn</code> として公開しています。

```ts
export {
  __resetWebAuthnCounters,
  base64UrlDecode as base64UrlDecodeWebAuthn,
  base64UrlEncode as base64UrlEncodeWebAuthn,
  clientDataHash as webAuthnClientDataHash,
  createVirtualAuthenticator,
  credentialAssertion as webAuthnCredentialAssertion,
  credentialCreation as webAuthnCredentialCreation,
  mockSignature as webAuthnMockSignature,
  normalizeChallenge as webAuthnNormalizeChallenge,
  setupWebAuthnEnv,
} from './webauthn/index.js';
```

#### <code v-pre>buildSupabaseOtpAuthUri</code>

公開 entry point から解決しています。

<code v-pre>buildOtpAuthUri</code> を <code v-pre>buildSupabaseOtpAuthUri</code> として公開しています。

Build the standard `otpauth://` URI clients scan into an authenticator app.

```ts
export {
  buildOtpAuthUri as buildSupabaseOtpAuthUri,
  deriveMockAddress as deriveSupabaseMockAddress,
  generateBackupCodes as generateSupabaseBackupCodes,
  generateSiweNonce as generateSupabaseSiweNonce,
  generateTotpCode as generateSupabaseTotpCode,
  generateTotpSecret as generateSupabaseTotpSecret,
  serializeSiweMessage as serializeSupabaseSiweMessage,
  setupSupabaseAdvancedEnv,
  verifyTotpCode as verifySupabaseTotpCode,
} from './supabase-advanced/setup-supabase-advanced-env.js';
```

#### <code v-pre>computeDpopJkt</code>

公開 entry point から解決しています。

<code v-pre>computeJkt</code> を <code v-pre>computeDpopJkt</code> として公開しています。

Compute the JWK thumbprint (RFC 7638) for a DPoP JWK. Sender-constrained access tokens embed this thumbprint as `cnf.jkt` — the mock keeps the canonical member ordering (`crv`, `kty`, `x`, `y`) so identical JWKs always produce identical thumbprints.

```ts
export {
  __resetDpopCounters,
  __resetOAuth21Counters,
  __resetPkceCounter,
  __resetTokenCounters,
  computeJkt as computeDpopJkt,
  createAuthorizationServer,
  createDpopProof,
  createMockDpopJwk,
  createPkceChallenge,
  deriveCodeChallenge,
  generateCodeVerifier,
  mintAccessToken,
  mintRefreshToken,
  parseDpopProof,
  rotateRefreshToken,
  setupOAuth21Env,
  verifyCodeChallenge,
  verifyDpopProof,
} from './oauth21/index.js';
```

#### <code v-pre>createBetterAuthSessionFor</code>

公開 entry point から解決しています。

<code v-pre>createSessionFor</code> を <code v-pre>createBetterAuthSessionFor</code> として公開しています。

```ts
export {
  createSessionFor as createBetterAuthSessionFor,
  generateSessionId as generateBetterAuthSessionId,
  generateSessionToken as generateBetterAuthSessionToken,
  invalidateSessionsForUser as invalidateBetterAuthSessionsForUser,
  validateSessionByToken as validateBetterAuthSessionByToken,
} from './better-auth/session.js';
```

#### <code v-pre>createOidcEntityStatement</code>

公開 entry point から解決しています。

<code v-pre>createEntityStatement</code> を <code v-pre>createOidcEntityStatement</code> として公開しています。

Build a plain entity statement for tests. Sets sensible defaults for `iat` / `exp` so tests only override the fields they care about.

```ts
export {
  __resetDcrCounter,
  __resetIdTokenCounter,
  __resetJwksCounter,
  __resetOidcCounters,
  computeTokenHash,
  createDcrEndpoint,
  createDiscoveryEndpoint,
  createEntityStatement as createOidcEntityStatement,
  createIdTokenSigner,
  createJwksEndpoint,
  createTrustAnchor as createOidcTrustAnchor,
  dynamicClientRegistration,
  mintSoftwareStatement,
  resolveTrustChain as resolveOidcTrustChain,
  setupOidcEnv,
} from './oidc/index.js';
```

#### <code v-pre>createOidcTrustAnchor</code>

公開 entry point から解決しています。

<code v-pre>createTrustAnchor</code> を <code v-pre>createOidcTrustAnchor</code> として公開しています。

Build a plain trust-anchor fixture for tests. Wraps the manual object construction so tests import a single helper.

```ts
export {
  __resetDcrCounter,
  __resetIdTokenCounter,
  __resetJwksCounter,
  __resetOidcCounters,
  computeTokenHash,
  createDcrEndpoint,
  createDiscoveryEndpoint,
  createEntityStatement as createOidcEntityStatement,
  createIdTokenSigner,
  createJwksEndpoint,
  createTrustAnchor as createOidcTrustAnchor,
  dynamicClientRegistration,
  mintSoftwareStatement,
  resolveTrustChain as resolveOidcTrustChain,
  setupOidcEnv,
} from './oidc/index.js';
```

#### <code v-pre>deriveSupabaseMockAddress</code>

公開 entry point から解決しています。

<code v-pre>deriveMockAddress</code> を <code v-pre>deriveSupabaseMockAddress</code> として公開しています。

Derive a deterministic pseudo-Ethereum address from a private key. Real addresses come from keccak256(pubkey)[-20:]; the mock uses a deterministic HMAC → 20 bytes → 0x-prefixed hex string. Good enough for tests that need uniqueness + a consistent address per key.

```ts
export {
  buildOtpAuthUri as buildSupabaseOtpAuthUri,
  deriveMockAddress as deriveSupabaseMockAddress,
  generateBackupCodes as generateSupabaseBackupCodes,
  generateSiweNonce as generateSupabaseSiweNonce,
  generateTotpCode as generateSupabaseTotpCode,
  generateTotpSecret as generateSupabaseTotpSecret,
  serializeSiweMessage as serializeSupabaseSiweMessage,
  setupSupabaseAdvancedEnv,
  verifyTotpCode as verifySupabaseTotpCode,
} from './supabase-advanced/setup-supabase-advanced-env.js';
```

#### <code v-pre>findPasskeyFabricHolding</code>

公開 entry point から解決しています。

<code v-pre>findFabricHolding</code> を <code v-pre>findPasskeyFabricHolding</code> として公開しています。

Locate every vendor that holds a given credential across a list of fabrics. Convenience helper used by `restoreCredential` in the env when the caller did not name a specific vendor.

```ts
export {
  __resetPasskeyCounters,
  backupCredential as backupPasskeyCredential,
  createPlatformAuthenticator,
  createRoamingAuthenticator,
  createSyncFabric,
  findFabricHolding as findPasskeyFabricHolding,
  requireFabric as requirePasskeyFabric,
  restoreCredential as restorePasskeyCredential,
  setupPasskeyEnv,
  syncCredentials as syncPasskeyCredentials,
} from './passkey/index.js';
```

#### <code v-pre>generateBetterAuthSessionId</code>

公開 entry point から解決しています。

<code v-pre>generateSessionId</code> を <code v-pre>generateBetterAuthSessionId</code> として公開しています。

```ts
export {
  createSessionFor as createBetterAuthSessionFor,
  generateSessionId as generateBetterAuthSessionId,
  generateSessionToken as generateBetterAuthSessionToken,
  invalidateSessionsForUser as invalidateBetterAuthSessionsForUser,
  validateSessionByToken as validateBetterAuthSessionByToken,
} from './better-auth/session.js';
```

#### <code v-pre>generateBetterAuthSessionToken</code>

公開 entry point から解決しています。

<code v-pre>generateSessionToken</code> を <code v-pre>generateBetterAuthSessionToken</code> として公開しています。

```ts
export {
  createSessionFor as createBetterAuthSessionFor,
  generateSessionId as generateBetterAuthSessionId,
  generateSessionToken as generateBetterAuthSessionToken,
  invalidateSessionsForUser as invalidateBetterAuthSessionsForUser,
  validateSessionByToken as validateBetterAuthSessionByToken,
} from './better-auth/session.js';
```

#### <code v-pre>generateClerkSigningSecret</code>

公開 entry point から解決しています。

<code v-pre>generateSigningSecret</code> を <code v-pre>generateClerkSigningSecret</code> として公開しています。

Generate a random secret for signing. Called once per {@link setupClerkEnv } invocation so each env has its own signing key.

```ts
export {
  generateSigningSecret as generateClerkSigningSecret,
  signClerkJwt,
  verifyClerkJwt,
} from './clerk/jwt.js';
```

#### <code v-pre>generateSupabaseBackupCodes</code>

公開 entry point から解決しています。

<code v-pre>generateBackupCodes</code> を <code v-pre>generateSupabaseBackupCodes</code> として公開しています。

Generate a set of one-time backup codes. Each code is 10 hex characters, matching a common Supabase-adjacent pattern.

```ts
export {
  buildOtpAuthUri as buildSupabaseOtpAuthUri,
  deriveMockAddress as deriveSupabaseMockAddress,
  generateBackupCodes as generateSupabaseBackupCodes,
  generateSiweNonce as generateSupabaseSiweNonce,
  generateTotpCode as generateSupabaseTotpCode,
  generateTotpSecret as generateSupabaseTotpSecret,
  serializeSiweMessage as serializeSupabaseSiweMessage,
  setupSupabaseAdvancedEnv,
  verifyTotpCode as verifySupabaseTotpCode,
} from './supabase-advanced/setup-supabase-advanced-env.js';
```

#### <code v-pre>generateSupabaseSiweNonce</code>

公開 entry point から解決しています。

<code v-pre>generateSiweNonce</code> を <code v-pre>generateSupabaseSiweNonce</code> として公開しています。

EIP-4361 (Sign-In with Ethereum) helpers. Real SIWE relies on secp256k1 message signing + ecrecover to derive the address from a signature — the mock replaces the signature primitive with an HMAC over the canonical message + address, which is enough to model happy-path + tamper-detection behaviors without pulling in a full crypto library.

```ts
export {
  buildOtpAuthUri as buildSupabaseOtpAuthUri,
  deriveMockAddress as deriveSupabaseMockAddress,
  generateBackupCodes as generateSupabaseBackupCodes,
  generateSiweNonce as generateSupabaseSiweNonce,
  generateTotpCode as generateSupabaseTotpCode,
  generateTotpSecret as generateSupabaseTotpSecret,
  serializeSiweMessage as serializeSupabaseSiweMessage,
  setupSupabaseAdvancedEnv,
  verifyTotpCode as verifySupabaseTotpCode,
} from './supabase-advanced/setup-supabase-advanced-env.js';
```

#### <code v-pre>generateSupabaseTotpCode</code>

公開 entry point から解決しています。

<code v-pre>generateTotpCode</code> を <code v-pre>generateSupabaseTotpCode</code> として公開しています。

Generate the TOTP code for the given moment. `nowSeconds` is exposed so tests can advance time deterministically.

```ts
export {
  buildOtpAuthUri as buildSupabaseOtpAuthUri,
  deriveMockAddress as deriveSupabaseMockAddress,
  generateBackupCodes as generateSupabaseBackupCodes,
  generateSiweNonce as generateSupabaseSiweNonce,
  generateTotpCode as generateSupabaseTotpCode,
  generateTotpSecret as generateSupabaseTotpSecret,
  serializeSiweMessage as serializeSupabaseSiweMessage,
  setupSupabaseAdvancedEnv,
  verifyTotpCode as verifySupabaseTotpCode,
} from './supabase-advanced/setup-supabase-advanced-env.js';
```

#### <code v-pre>generateSupabaseTotpSecret</code>

公開 entry point から解決しています。

<code v-pre>generateTotpSecret</code> を <code v-pre>generateSupabaseTotpSecret</code> として公開しています。

```ts
export {
  buildOtpAuthUri as buildSupabaseOtpAuthUri,
  deriveMockAddress as deriveSupabaseMockAddress,
  generateBackupCodes as generateSupabaseBackupCodes,
  generateSiweNonce as generateSupabaseSiweNonce,
  generateTotpCode as generateSupabaseTotpCode,
  generateTotpSecret as generateSupabaseTotpSecret,
  serializeSiweMessage as serializeSupabaseSiweMessage,
  setupSupabaseAdvancedEnv,
  verifyTotpCode as verifySupabaseTotpCode,
} from './supabase-advanced/setup-supabase-advanced-env.js';
```

#### <code v-pre>hashBetterAuthPassword</code>

公開 entry point から解決しています。

<code v-pre>hashPassword</code> を <code v-pre>hashBetterAuthPassword</code> として公開しています。

```ts
export {
  hashPassword as hashBetterAuthPassword,
  verifyPassword as verifyBetterAuthPassword,
} from './better-auth/password.js';
```

#### <code v-pre>invalidateBetterAuthSessionsForUser</code>

公開 entry point から解決しています。

<code v-pre>invalidateSessionsForUser</code> を <code v-pre>invalidateBetterAuthSessionsForUser</code> として公開しています。

```ts
export {
  createSessionFor as createBetterAuthSessionFor,
  generateSessionId as generateBetterAuthSessionId,
  generateSessionToken as generateBetterAuthSessionToken,
  invalidateSessionsForUser as invalidateBetterAuthSessionsForUser,
  validateSessionByToken as validateBetterAuthSessionByToken,
} from './better-auth/session.js';
```

#### <code v-pre>requirePasskeyFabric</code>

公開 entry point から解決しています。

<code v-pre>requireFabric</code> を <code v-pre>requirePasskeyFabric</code> として公開しています。

Guarded lookup for a fabric by vendor. Throws when the vendor is not registered — the alternative (silent `undefined`) would let a caller silently drop backups on the floor.

```ts
export {
  __resetPasskeyCounters,
  backupCredential as backupPasskeyCredential,
  createPlatformAuthenticator,
  createRoamingAuthenticator,
  createSyncFabric,
  findFabricHolding as findPasskeyFabricHolding,
  requireFabric as requirePasskeyFabric,
  restoreCredential as restorePasskeyCredential,
  setupPasskeyEnv,
  syncCredentials as syncPasskeyCredentials,
} from './passkey/index.js';
```

#### <code v-pre>resolveOidcTrustChain</code>

公開 entry point から解決しています。

<code v-pre>resolveTrustChain</code> を <code v-pre>resolveOidcTrustChain</code> として公開しています。

Resolve a trust chain per OpenID Federation 1.0 §7. The chain walks from the leaf entity (typically the RP or a subordinate OP) through zero-or-more intermediates up to a trust anchor. Chain-walk rules (matches OIDF §7.2): - Every statement in the chain must have `iss` equal to the previous step's subject (the anchor is a virtual step past the last statement's iss). - Every statement must have `exp &gt; now`. - The final statement's `iss` must equal the trust anchor's entity_id. The mock does not verify JWS signatures on the statements — the point is to prove the chain-walk logic. Callers wanting to test signature verification build the statements with dedicated fixtures.

```ts
export {
  __resetDcrCounter,
  __resetIdTokenCounter,
  __resetJwksCounter,
  __resetOidcCounters,
  computeTokenHash,
  createDcrEndpoint,
  createDiscoveryEndpoint,
  createEntityStatement as createOidcEntityStatement,
  createIdTokenSigner,
  createJwksEndpoint,
  createTrustAnchor as createOidcTrustAnchor,
  dynamicClientRegistration,
  mintSoftwareStatement,
  resolveTrustChain as resolveOidcTrustChain,
  setupOidcEnv,
} from './oidc/index.js';
```

#### <code v-pre>restorePasskeyCredential</code>

公開 entry point から解決しています。

<code v-pre>restoreCredential</code> を <code v-pre>restorePasskeyCredential</code> として公開しています。

Pull a credential blob out of a sync fabric. Returns `null` when the fabric does not hold the credential — the caller decides whether to treat that as a hard error (no such passkey) or a soft one (fabric not yet synced). The returned credential is a fresh copy — restoring twice will produce two independent snapshots and the caller is responsible for merging them on the device side.

```ts
export {
  __resetPasskeyCounters,
  backupCredential as backupPasskeyCredential,
  createPlatformAuthenticator,
  createRoamingAuthenticator,
  createSyncFabric,
  findFabricHolding as findPasskeyFabricHolding,
  requireFabric as requirePasskeyFabric,
  restoreCredential as restorePasskeyCredential,
  setupPasskeyEnv,
  syncCredentials as syncPasskeyCredentials,
} from './passkey/index.js';
```

#### <code v-pre>semantics</code>

公開 entry point から解決しています。

```ts
export * as semantics from './semantics/index.js';
```

#### <code v-pre>serializeSupabaseSiweMessage</code>

公開 entry point から解決しています。

<code v-pre>serializeSiweMessage</code> を <code v-pre>serializeSupabaseSiweMessage</code> として公開しています。

Build the canonical EIP-4361 message string. Consumers can hash + sign this verbatim with a real client library, and the mock will verify it back.

```ts
export {
  buildOtpAuthUri as buildSupabaseOtpAuthUri,
  deriveMockAddress as deriveSupabaseMockAddress,
  generateBackupCodes as generateSupabaseBackupCodes,
  generateSiweNonce as generateSupabaseSiweNonce,
  generateTotpCode as generateSupabaseTotpCode,
  generateTotpSecret as generateSupabaseTotpSecret,
  serializeSiweMessage as serializeSupabaseSiweMessage,
  setupSupabaseAdvancedEnv,
  verifyTotpCode as verifySupabaseTotpCode,
} from './supabase-advanced/setup-supabase-advanced-env.js';
```

#### <code v-pre>syncPasskeyCredentials</code>

公開 entry point から解決しています。

<code v-pre>syncCredentials</code> を <code v-pre>syncPasskeyCredentials</code> として公開しています。

Copy every backup-eligible credential owned by `userId` from `source` into `target` via the shared fabric. Mirrors the "sign in on a new device" ceremony — the new device is the target, the fabric is the shared vendor, and every credential is backed up on the source side then restored on the target side. Returns the list of credentials that landed on the target. Skips credentials owned by other users (per-user isolation) and non-backup- eligible credentials (bare security key credentials cannot ride the fabric).

```ts
export {
  __resetPasskeyCounters,
  backupCredential as backupPasskeyCredential,
  createPlatformAuthenticator,
  createRoamingAuthenticator,
  createSyncFabric,
  findFabricHolding as findPasskeyFabricHolding,
  requireFabric as requirePasskeyFabric,
  restoreCredential as restorePasskeyCredential,
  setupPasskeyEnv,
  syncCredentials as syncPasskeyCredentials,
} from './passkey/index.js';
```

#### <code v-pre>validateBetterAuthSessionByToken</code>

公開 entry point から解決しています。

<code v-pre>validateSessionByToken</code> を <code v-pre>validateBetterAuthSessionByToken</code> として公開しています。

```ts
export {
  createSessionFor as createBetterAuthSessionFor,
  generateSessionId as generateBetterAuthSessionId,
  generateSessionToken as generateBetterAuthSessionToken,
  invalidateSessionsForUser as invalidateBetterAuthSessionsForUser,
  validateSessionByToken as validateBetterAuthSessionByToken,
} from './better-auth/session.js';
```

#### <code v-pre>verifyBetterAuthPassword</code>

公開 entry point から解決しています。

<code v-pre>verifyPassword</code> を <code v-pre>verifyBetterAuthPassword</code> として公開しています。

```ts
export {
  hashPassword as hashBetterAuthPassword,
  verifyPassword as verifyBetterAuthPassword,
} from './better-auth/password.js';
```

#### <code v-pre>verifySupabaseTotpCode</code>

公開 entry point から解決しています。

<code v-pre>verifyTotpCode</code> を <code v-pre>verifySupabaseTotpCode</code> として公開しています。

```ts
export {
  buildOtpAuthUri as buildSupabaseOtpAuthUri,
  deriveMockAddress as deriveSupabaseMockAddress,
  generateBackupCodes as generateSupabaseBackupCodes,
  generateSiweNonce as generateSupabaseSiweNonce,
  generateTotpCode as generateSupabaseTotpCode,
  generateTotpSecret as generateSupabaseTotpSecret,
  serializeSiweMessage as serializeSupabaseSiweMessage,
  setupSupabaseAdvancedEnv,
  verifyTotpCode as verifySupabaseTotpCode,
} from './supabase-advanced/setup-supabase-advanced-env.js';
```

#### <code v-pre>webAuthnClientDataHash</code>

公開 entry point から解決しています。

<code v-pre>clientDataHash</code> を <code v-pre>webAuthnClientDataHash</code> として公開しています。

SHA-256-like deterministic digest for clientDataJSON. WebAuthn L3 §7.1 uses SHA-256; the mock uses fnv-1a widened to 32 bytes for a deterministic short digest that fits the same byte width as SHA-256.

```ts
export {
  __resetWebAuthnCounters,
  base64UrlDecode as base64UrlDecodeWebAuthn,
  base64UrlEncode as base64UrlEncodeWebAuthn,
  clientDataHash as webAuthnClientDataHash,
  createVirtualAuthenticator,
  credentialAssertion as webAuthnCredentialAssertion,
  credentialCreation as webAuthnCredentialCreation,
  mockSignature as webAuthnMockSignature,
  normalizeChallenge as webAuthnNormalizeChallenge,
  setupWebAuthnEnv,
} from './webauthn/index.js';
```

#### <code v-pre>webAuthnCredentialAssertion</code>

公開 entry point から解決しています。

<code v-pre>credentialAssertion</code> を <code v-pre>webAuthnCredentialAssertion</code> として公開しています。

Simulate `navigator.credentials.get({ publicKey })`. Produces an `AuthenticatorAssertionResponse` shaped like WebAuthn L3 §5.2.2. Enforces the RP-facing checks that a real RP library performs on the response — clientData.type must be `webauthn.get`, challenge must match, user verification bit must be set when requested, and signCount must increase monotonically (§7.2 step 21). `credentialOwnership` maps `credentialId -&gt; authenticatorId` so the mock routes each assertion through the authenticator that actually holds the credential. Real WebAuthn enforces this at the client-side discovery step (§5.5) — the mock mirrors it so a bug that assumes credentials float between authenticators surfaces at test time.

```ts
export {
  __resetWebAuthnCounters,
  base64UrlDecode as base64UrlDecodeWebAuthn,
  base64UrlEncode as base64UrlEncodeWebAuthn,
  clientDataHash as webAuthnClientDataHash,
  createVirtualAuthenticator,
  credentialAssertion as webAuthnCredentialAssertion,
  credentialCreation as webAuthnCredentialCreation,
  mockSignature as webAuthnMockSignature,
  normalizeChallenge as webAuthnNormalizeChallenge,
  setupWebAuthnEnv,
} from './webauthn/index.js';
```

#### <code v-pre>webAuthnCredentialCreation</code>

公開 entry point から解決しています。

<code v-pre>credentialCreation</code> を <code v-pre>webAuthnCredentialCreation</code> として公開しています。

Simulate `navigator.credentials.create({ publicKey })`. Produces an `AuthenticatorAttestationResponse` shaped like WebAuthn L3 §5.2.1 and writes the resulting credential into the authenticator's in-memory store. Called from `WebAuthnTestEnv.credentialCreation` — the env passes the authenticator selected by the caller (or its default).

```ts
export {
  __resetWebAuthnCounters,
  base64UrlDecode as base64UrlDecodeWebAuthn,
  base64UrlEncode as base64UrlEncodeWebAuthn,
  clientDataHash as webAuthnClientDataHash,
  createVirtualAuthenticator,
  credentialAssertion as webAuthnCredentialAssertion,
  credentialCreation as webAuthnCredentialCreation,
  mockSignature as webAuthnMockSignature,
  normalizeChallenge as webAuthnNormalizeChallenge,
  setupWebAuthnEnv,
} from './webauthn/index.js';
```

#### <code v-pre>webAuthnMockSignature</code>

公開 entry point から解決しています。

<code v-pre>mockSignature</code> を <code v-pre>webAuthnMockSignature</code> として公開しています。

Deterministic mock signature over `(publicKey || authenticatorData || clientDataJSONHash)`. Real WebAuthn signatures are ES256 / RS256 / EdDSA over that concatenation (WebAuthn L3 §6.5.4). The mock uses a fnv-1a hash for stability across runs so fixture comparisons stay deterministic.

```ts
export {
  __resetWebAuthnCounters,
  base64UrlDecode as base64UrlDecodeWebAuthn,
  base64UrlEncode as base64UrlEncodeWebAuthn,
  clientDataHash as webAuthnClientDataHash,
  createVirtualAuthenticator,
  credentialAssertion as webAuthnCredentialAssertion,
  credentialCreation as webAuthnCredentialCreation,
  mockSignature as webAuthnMockSignature,
  normalizeChallenge as webAuthnNormalizeChallenge,
  setupWebAuthnEnv,
} from './webauthn/index.js';
```

#### <code v-pre>webAuthnNormalizeChallenge</code>

公開 entry point から解決しています。

<code v-pre>normalizeChallenge</code> を <code v-pre>webAuthnNormalizeChallenge</code> として公開しています。

Normalize a challenge or credential.id that a caller may hand in as either `string` (base64url or plain UTF-8) or `Uint8Array`.

```ts
export {
  __resetWebAuthnCounters,
  base64UrlDecode as base64UrlDecodeWebAuthn,
  base64UrlEncode as base64UrlEncodeWebAuthn,
  clientDataHash as webAuthnClientDataHash,
  createVirtualAuthenticator,
  credentialAssertion as webAuthnCredentialAssertion,
  credentialCreation as webAuthnCredentialCreation,
  mockSignature as webAuthnMockSignature,
  normalizeChallenge as webAuthnNormalizeChallenge,
  setupWebAuthnEnv,
} from './webauthn/index.js';
```

### 型

#### <code v-pre>OidcEntityStatement</code>

公開 entry point から解決しています。

<code v-pre>EntityStatement</code> を <code v-pre>OidcEntityStatement</code> として公開しています。

Entity Statement per OpenID Federation 1.0 §3.1. The mock represents it as a plain object (skipping the JWS signature) with the subject / issuer pair that the chain walker follows. Real deployments would serialize this as a JWT signed by the issuer's JWKS.

```ts
export type {
  ClientRegistrationRequest,
  ClientRegistrationResponse,
  DiscoveryEndpoint,
  EntityStatement as OidcEntityStatement,
  IdToken,
  IdTokenClaims,
  JwksDocument,
  JwksEndpoint,
  JwksKey,
  OidcTestEnv,
  OpenIdProviderMetadata,
  ResolveTrustChainInput,
  SetupOidcEnvOptions,
  SignIdTokenInput,
  TrustAnchor,
  TrustChainReasonCode,
  TrustChainResult,
  VerifyIdTokenOptions,
  VerifyIdTokenResult,
} from './oidc/types.js';
```

#### <code v-pre>SemanticsAxisStep</code>

公開 entry point から解決しています。

<code v-pre>AxisStep</code> を <code v-pre>SemanticsAxisStep</code> として公開しています。

```ts
export type {
  AuthAxis,
  AuthPlatform,
  AxisStep as SemanticsAxisStep,
  NeutralEventName as SemanticsNeutralEventName,
} from './semantics/types.js';
```

#### <code v-pre>SemanticsNeutralEventName</code>

公開 entry point から解決しています。

<code v-pre>NeutralEventName</code> を <code v-pre>SemanticsNeutralEventName</code> として公開しています。

Platform-neutral event names emitted by the axis helpers. Browsers expose different string ids for the same semantic — the {@link platformEventName} map handles the translation. Tests can assert on the neutral name via `step.neutralEvent` or on the browser dialect via `step.platformEvent`.

```ts
export type {
  AuthAxis,
  AuthPlatform,
  AxisStep as SemanticsAxisStep,
  NeutralEventName as SemanticsNeutralEventName,
} from './semantics/types.js';
```
