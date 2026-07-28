---
title: "@kiwa-lab/security semantics-mtls の API 契約"
---

# <code v-pre>@kiwa-lab/security</code> <code v-pre>semantics-mtls</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>checkCtLog</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L126) <code v-pre>packages/security/src/semantics/mtls.ts</code>

```ts
export declare function checkCtLog(session: MtlsSession, input: CtLogInput): AxisAdvStep<MtlsState>;
```

#### <code v-pre>completeHandshake</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L70) <code v-pre>packages/security/src/semantics/mtls.ts</code>

```ts
export declare function completeHandshake(session: MtlsSession, input: HandshakeInput): AxisAdvStep<MtlsState>;
```

#### <code v-pre>startMtlsSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L54) <code v-pre>packages/security/src/semantics/mtls.ts</code>

```ts
export declare function startMtlsSession(input: {
    target: SecurityAdvTarget;
    sessionId: string;
}): MtlsSession;
```

#### <code v-pre>verifyOcsp</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L111) <code v-pre>packages/security/src/semantics/mtls.ts</code>

```ts
export declare function verifyOcsp(session: MtlsSession, input: OcspInput): AxisAdvStep<MtlsState>;
```

#### <code v-pre>verifyPin</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L88) <code v-pre>packages/security/src/semantics/mtls.ts</code>

```ts
export declare function verifyPin(session: MtlsSession, input: PinInput): AxisAdvStep<MtlsState>;
```

### 型

#### <code v-pre>CtLogInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L49) <code v-pre>packages/security/src/semantics/mtls.ts</code>

```ts
export interface CtLogInput {
    sctCount: number;
    minSctRequired: number;
}
```

#### <code v-pre>HandshakeInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L33) <code v-pre>packages/security/src/semantics/mtls.ts</code>

```ts
export interface HandshakeInput {
    peerCn: string;
    cipherSuite: string;
    tlsVersion: '1.2' | '1.3';
}
```

#### <code v-pre>MtlsSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L25) <code v-pre>packages/security/src/semantics/mtls.ts</code>

```ts
export interface MtlsSession {
    target: SecurityAdvTarget;
    sessionId: string;
    state: MtlsState;
    history: AxisAdvStep<MtlsState>[];
    pinnedFingerprints: string[];
}
```

#### <code v-pre>MtlsState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L17) <code v-pre>packages/security/src/semantics/mtls.ts</code>

mTLS + certificate pinning axis — mutual TLS handshake + pin verification + OCSP stapling + Certificate Transparency log check state machine。 Deterministic mock で 4 signal 系統を提供。 real driver 経路では実 istio / envoy sidecar に対して TLS handshake を張り、 SPKI pin と OCSP staple を 検証する。

```ts
export type MtlsState = 'idle' | 'handshake-completed' | 'pinned' | 'ocsp-verified' | 'ct-verified' | 'failed';
```

#### <code v-pre>OcspInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L44) <code v-pre>packages/security/src/semantics/mtls.ts</code>

```ts
export interface OcspInput {
    stapled: boolean;
    goodResponse: boolean;
}
```

#### <code v-pre>PinInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L39) <code v-pre>packages/security/src/semantics/mtls.ts</code>

```ts
export interface PinInput {
    spkiSha256: string;
    expectedPins: string[];
}
```
