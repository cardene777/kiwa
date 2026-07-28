---
title: "@kiwa-lab/security semantics__supply-chain の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/security</code> <code v-pre>semantics&#95;&#95;supply-chain</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>matchReproducibleBuild</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L106) <code v-pre>packages/security/src/semantics/supply-chain.ts</code>

```ts
export declare function matchReproducibleBuild(session: SupplyChainSession, input: ReproducibleInput): AxisAdvStep<SupplyChainState>;
```

#### <code v-pre>signProvenance</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L126) <code v-pre>packages/security/src/semantics/supply-chain.ts</code>

```ts
export declare function signProvenance(session: SupplyChainSession, input: ProvenanceInput): AxisAdvStep<SupplyChainState>;
```

#### <code v-pre>startSupplyChainSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L62) <code v-pre>packages/security/src/semantics/supply-chain.ts</code>

```ts
export declare function startSupplyChainSession(input: {
    target: SecurityAdvTarget;
    sessionId: string;
}): SupplyChainSession;
```

#### <code v-pre>verifyAttestation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L147) <code v-pre>packages/security/src/semantics/supply-chain.ts</code>

```ts
export declare function verifyAttestation(session: SupplyChainSession, input: AttestationInput): AxisAdvStep<SupplyChainState>;
```

#### <code v-pre>verifySlsaLevel</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L78) <code v-pre>packages/security/src/semantics/supply-chain.ts</code>

```ts
export declare function verifySlsaLevel(session: SupplyChainSession, input: SlsaLevelInput): AxisAdvStep<SupplyChainState>;
```

### 型

#### <code v-pre>AttestationInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L56) <code v-pre>packages/security/src/semantics/supply-chain.ts</code>

```ts
export interface AttestationInput {
    attestationType: 'slsa-provenance' | 'spdx-sbom' | 'cyclone-dx-vex';
    trustRootFingerprint: string;
    validSignatures: number;
}
```

#### <code v-pre>ProvenanceInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L50) <code v-pre>packages/security/src/semantics/supply-chain.ts</code>

```ts
export interface ProvenanceInput {
    builderId: string;
    materialsCount: number;
    signatureAlgorithm: 'sigstore-cosign' | 'in-toto' | 'gpg';
}
```

#### <code v-pre>ReproducibleInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L44) <code v-pre>packages/security/src/semantics/supply-chain.ts</code>

```ts
export interface ReproducibleInput {
    buildA_hash: string;
    buildB_hash: string;
    toolchainVersion: string;
}
```

#### <code v-pre>SlsaLevel</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L16) <code v-pre>packages/security/src/semantics/supply-chain.ts</code>

Supply chain security axis — SLSA level verification + reproducible build matching + signed provenance + SLSA attestation verification state machine。 Deterministic mock で 4 signal 系統を提供。 real driver 経路では in-toto / sigstore に対して attestation 検証を発火する。

```ts
export type SlsaLevel = 0 | 1 | 2 | 3 | 4;
```

#### <code v-pre>SlsaLevelInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L33) <code v-pre>packages/security/src/semantics/supply-chain.ts</code>

```ts
export interface SlsaLevelInput {
    buildScriptedFromRepo: boolean;
    buildServiceIsTrustworthy: boolean;
    buildParameterizable: boolean;
    buildIsolated: boolean;
    provenanceExists: boolean;
    provenanceAuthenticated: boolean;
    provenanceServiceGenerated: boolean;
    provenanceNonFalsifiable: boolean;
}
```

#### <code v-pre>SupplyChainSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L25) <code v-pre>packages/security/src/semantics/supply-chain.ts</code>

```ts
export interface SupplyChainSession {
    target: SecurityAdvTarget;
    sessionId: string;
    state: SupplyChainState;
    history: AxisAdvStep<SupplyChainState>[];
    verifiedLevel: SlsaLevel;
}
```

#### <code v-pre>SupplyChainState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L18) <code v-pre>packages/security/src/semantics/supply-chain.ts</code>

```ts
export type SupplyChainState = 'idle' | 'slsa-verified' | 'reproducible-matched' | 'provenance-signed' | 'attestation-verified';
```
