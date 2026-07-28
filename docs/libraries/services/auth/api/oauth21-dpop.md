---
title: "@kiwa-lab/auth oauth21-dpop の API 契約"
---

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>oauth21-dpop</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/dpop.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>&#95;&#95;resetDpopCounters</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/dpop.ts#L12) <code v-pre>packages/auth/src/oauth21/dpop.ts</code>

```ts
export declare function __resetDpopCounters(): void;
```

#### <code v-pre>createDpopProof</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/dpop.ts#L71) <code v-pre>packages/auth/src/oauth21/dpop.ts</code>

Fabricate a DPoP proof JWT. The mock builds the compact `header.payload.signature` form but keeps the signature as a deterministic placeholder — verification is done by re-parsing the JWT and matching fields against the recorded JWK / htm / htu / iat / jti, not by running a real ECDSA verification. Callers wanting to test signature failure paths mangle the returned `jwt` string before handing it back.

```ts
export declare function createDpopProof(input: DpopProofInput): DpopProof;
```

#### <code v-pre>createMockDpopJwk</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/dpop.ts#L42) <code v-pre>packages/auth/src/oauth21/dpop.ts</code>

Produce a mock ES256 JWK. Real deployments generate a P-256 key pair; the mock returns a distinctly-shaped placeholder so tests can assert the `x`/`y` fields without pulling in a full crypto stack.

```ts
export declare function createMockDpopJwk(): DpopJwk;
```

#### <code v-pre>parseDpopProof</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/dpop.ts#L109) <code v-pre>packages/auth/src/oauth21/dpop.ts</code>

Parse a compact DPoP JWT string back into its header/payload shape. Used by the AS to inspect a proof carried on the wire (`DPoP` header). Throws on malformed input so a caller mangling the JWT for a fuzz test gets a predictable error.

```ts
export declare function parseDpopProof(jwt: string): DpopProof;
```

#### <code v-pre>verifyDpopProof</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/dpop.ts#L168) <code v-pre>packages/auth/src/oauth21/dpop.ts</code>

Verify a DPoP proof per RFC 9449 §4.3. Checks the header shape (`typ`, `alg`, `jwk`), the payload fields (`htm`, `htu`, `iat`, `jti`), and the replay registry. Returns the parsed proof on success so the caller can pluck the JWK thumbprint. Throws on failure with a specific reason.

```ts
export declare function verifyDpopProof(proof: DpopProof, options: VerifyDpopProofOptions): DpopProof;
```


