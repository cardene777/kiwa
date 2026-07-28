---
title: "@kiwa-lab/payment semantics-sca の API 契約"
---

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>semantics-sca</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/sca.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>scaAuthenticate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/sca.ts#L114) <code v-pre>packages/payment/src/semantics/sca.ts</code>

Complete SCA. Emits `sca.authenticated` and issues a synthetic strong auth token that downstream calls can attach for the 90-day validity window PSD2 mandates.

```ts
export declare function scaAuthenticate(adapter: PaymentAdapter, session: ScaSession): Promise<AxisStep<ScaState>>;
```

#### <code v-pre>scaEvaluate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/sca.ts#L55) <code v-pre>packages/payment/src/semantics/sca.ts</code>

Evaluate SCA. If `exemption` is supplied the session terminates in `exempt`, otherwise it moves to `required`.

```ts
export declare function scaEvaluate(adapter: PaymentAdapter, session: ScaSession, input: {
    exemption?: ScaExemption;
}): Promise<AxisStep<ScaState>>;
```

#### <code v-pre>startSca</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/sca.ts#L34) <code v-pre>packages/payment/src/semantics/sca.ts</code>

Start an SCA evaluation session. Call {@link scaEvaluate} to decide.

```ts
export declare function startSca(input: {
    paymentIntentId: string;
    amountCents: number;
    currency?: string;
    customerId: string;
}): ScaSession;
```

### 型

#### <code v-pre>ScaExemption</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/sca.ts#L13) <code v-pre>packages/payment/src/semantics/sca.ts</code>

```ts
export type ScaExemption = 'low-value' | 'trusted-beneficiary' | 'transaction-risk-analysis' | 'merchant-initiated' | 'recurring-subsequent' | 'corporate';
```

#### <code v-pre>ScaSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/sca.ts#L21) <code v-pre>packages/payment/src/semantics/sca.ts</code>

```ts
export interface ScaSession {
    paymentIntentId: string;
    amountCents: number;
    currency?: string;
    customerId: string;
    state: ScaState;
    strongAuthToken?: string;
    history: AxisStep<ScaState>[];
}
```

#### <code v-pre>ScaState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/sca.ts#L11) <code v-pre>packages/payment/src/semantics/sca.ts</code>

Strong Customer Authentication (SCA) semantics under PSD2. Real providers expose SCA through: (1) exemption evaluation (low-value, TRA, MIT, recurring subsequent), (2) required authentication when no exemption applies, (3) post-auth token issue. This module wraps the 3-state envelope: `required` / `exempt` / `authenticated`.

```ts
export type ScaState = 'evaluating' | 'required' | 'exempt' | 'authenticated';
```
