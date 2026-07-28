---
title: "@kiwa-lab/payment semantics-three-ds の API 契約"
---

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>semantics-three-ds</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/three-ds.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>startThreeDs</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/three-ds.ts#L34) <code v-pre>packages/payment/src/semantics/three-ds.ts</code>

Start a 3DS session. No webhook is emitted at start — this is the local fingerprint capture step; call {@link threeDsRequestChallenge} to transition to the challenge, or {@link threeDsFrictionless} to skip.

```ts
export declare function startThreeDs(input: {
    paymentIntentId: string;
    amountCents: number;
    currency?: string;
    customerId: string;
}): ThreeDsSession;
```

#### <code v-pre>threeDsFrictionless</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/three-ds.ts#L131) <code v-pre>packages/payment/src/semantics/three-ds.ts</code>

Frictionless path — issuer accepted the transaction without a challenge. Emits `3ds.frictionless` and terminates. Only valid from `fingerprint`.

```ts
export declare function threeDsFrictionless(adapter: PaymentAdapter, session: ThreeDsSession): Promise<AxisStep<ThreeDsState>>;
```

#### <code v-pre>threeDsRequestChallenge</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/three-ds.ts#L55) <code v-pre>packages/payment/src/semantics/three-ds.ts</code>

Request a 3DS challenge. Emits `3ds.challenge_required`. Session moves to `challenge-pending` — call {@link threeDsSubmitChallenge} to complete.

```ts
export declare function threeDsRequestChallenge(adapter: PaymentAdapter, session: ThreeDsSession): Promise<AxisStep<ThreeDsState>>;
```

#### <code v-pre>threeDsSubmitChallenge</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/three-ds.ts#L93) <code v-pre>packages/payment/src/semantics/three-ds.ts</code>

Submit the challenge result. `transStatus` follows EMVCo values: `Y` = authenticated, `N` = not authenticated, `A` = attempt performed, `U` = unavailable, `C` = challenge required (should be pre-transitioned), `R` = rejected. `Y` / `A` → session `completed`; `N` / `R` / `U` throw so tests exercise both accept and reject explicitly.

```ts
export declare function threeDsSubmitChallenge(adapter: PaymentAdapter, session: ThreeDsSession, input: {
    transStatus: ThreeDsTransStatus;
}): Promise<AxisStep<ThreeDsState>>;
```

### 型

#### <code v-pre>ThreeDsSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/three-ds.ts#L20) <code v-pre>packages/payment/src/semantics/three-ds.ts</code>

```ts
export interface ThreeDsSession {
    paymentIntentId: string;
    amountCents: number;
    currency?: string;
    customerId: string;
    state: ThreeDsState;
    history: AxisStep<ThreeDsState>[];
}
```

#### <code v-pre>ThreeDsState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/three-ds.ts#L12) <code v-pre>packages/payment/src/semantics/three-ds.ts</code>

3D Secure v2 challenge flow. Real providers surface 3DS through a two- or three-step flow: fingerprint (device data collection), challenge (user interaction), result (accept/reject). Frictionless flow skips the challenge when the issuer risk assessment is low. The mock reproduces the observable envelope only — no real ACS callout, just event ordering with sensible metadata (transStatus, eci) drawn from EMVCo 3DS 2.2.

```ts
export type ThreeDsState = 'fingerprint' | 'challenge-pending' | 'completed' | 'frictionless';
```

#### <code v-pre>ThreeDsTransStatus</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/three-ds.ts#L18) <code v-pre>packages/payment/src/semantics/three-ds.ts</code>

```ts
export type ThreeDsTransStatus = 'Y' | 'N' | 'A' | 'C' | 'U' | 'R';
```
