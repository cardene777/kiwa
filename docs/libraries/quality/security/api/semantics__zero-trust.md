---
title: "@kiwa-lab/security semantics__zero-trust の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/security</code> <code v-pre>semantics&#95;&#95;zero-trust</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>enforceMicroSegment</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L145) <code v-pre>packages/security/src/semantics/zero-trust.ts</code>

```ts
export declare function enforceMicroSegment(session: ZeroTrustSession, policy: SegmentPolicy): AxisAdvStep<ZeroTrustState>;
```

#### <code v-pre>evaluatePosture</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L70) <code v-pre>packages/security/src/semantics/zero-trust.ts</code>

```ts
export declare function evaluatePosture(session: ZeroTrustSession, posture: DevicePosture): AxisAdvStep<ZeroTrustState>;
```

#### <code v-pre>requestJit</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L117) <code v-pre>packages/security/src/semantics/zero-trust.ts</code>

```ts
export declare function requestJit(session: ZeroTrustSession, request: JitRequest): AxisAdvStep<ZeroTrustState>;
```

#### <code v-pre>scoreRisk</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L89) <code v-pre>packages/security/src/semantics/zero-trust.ts</code>

```ts
export declare function scoreRisk(session: ZeroTrustSession, input: {
    unusualLocation: boolean;
    unusualTime: boolean;
    newDevice: boolean;
    threatIntelHit: boolean;
}): AxisAdvStep<ZeroTrustState>;
```

#### <code v-pre>startZeroTrustSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L53) <code v-pre>packages/security/src/semantics/zero-trust.ts</code>

```ts
export declare function startZeroTrustSession(input: {
    target: SecurityAdvTarget;
    sessionId: string;
}): ZeroTrustSession;
```

### 型

#### <code v-pre>DevicePosture</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L34) <code v-pre>packages/security/src/semantics/zero-trust.ts</code>

```ts
export interface DevicePosture {
    osUpToDate: boolean;
    diskEncrypted: boolean;
    edrRunning: boolean;
    mdmEnrolled: boolean;
}
```

#### <code v-pre>JitRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L41) <code v-pre>packages/security/src/semantics/zero-trust.ts</code>

```ts
export interface JitRequest {
    requestedRole: string;
    justification: string;
    ttlSeconds: number;
}
```

#### <code v-pre>SegmentPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L47) <code v-pre>packages/security/src/semantics/zero-trust.ts</code>

```ts
export interface SegmentPolicy {
    workload: string;
    allowedPeers: string[];
    requestedPeer: string;
}
```

#### <code v-pre>ZeroTrustSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L25) <code v-pre>packages/security/src/semantics/zero-trust.ts</code>

```ts
export interface ZeroTrustSession {
    target: SecurityAdvTarget;
    sessionId: string;
    state: ZeroTrustState;
    history: AxisAdvStep<ZeroTrustState>[];
    riskScore: number;
    grantedRoles: string[];
}
```

#### <code v-pre>ZeroTrustState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L17) <code v-pre>packages/security/src/semantics/zero-trust.ts</code>

Zero-trust axis — device posture + risk scoring + Just-in-Time access + micro-segmentation state machine。 Deterministic mock で 4 signal 系統を提供。 real driver 経路では OPA rego policy や Google BeyondCorp 相当の verifier に対して posture 判定を 発火する。

```ts
export type ZeroTrustState = 'idle' | 'posture-evaluated' | 'risk-scored' | 'jit-granted' | 'jit-denied' | 'segment-enforced';
```
