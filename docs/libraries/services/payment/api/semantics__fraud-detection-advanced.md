---
title: "@kiwa-lab/payment semantics__fraud-detection-advanced の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>semantics&#95;&#95;fraud-detection-advanced</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>flagVelocity</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L138) <code v-pre>packages/payment/src/semantics/fraud-detection-advanced.ts</code>

Flag velocity — records that this customer exceeded the allowed transactions-per-hour threshold.

```ts
export declare function flagVelocity(adapter: PaymentAdapter, session: FraudDetectionSession, input: {
    attemptsInWindow: number;
    windowMs: number;
}): Promise<AxisStep<FraudDetectionState>>;
```

#### <code v-pre>scoreDevice</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L89) <code v-pre>packages/payment/src/semantics/fraud-detection-advanced.ts</code>

Score device fingerprint — combines browser fingerprint, IP entropy, OS signature, canvas fingerprint into a 0-100 score.

```ts
export declare function scoreDevice(adapter: PaymentAdapter, session: FraudDetectionSession, input: {
    score: number;
    fingerprint: string;
    ipAddress?: string;
    userAgent?: string;
}): Promise<AxisStep<FraudDetectionState>>;
```

#### <code v-pre>scoreMlBlock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L162) <code v-pre>packages/payment/src/semantics/fraud-detection-advanced.ts</code>

Run the ML fusion model — combines device / biometric / velocity signals plus features into a 0-1 score. Above `mlBlockThreshold` blocks the tx.

```ts
export declare function scoreMlBlock(adapter: PaymentAdapter, session: FraudDetectionSession, input: {
    score: number;
    modelVersion: string;
    features: Record<string, number>;
}): Promise<AxisStep<FraudDetectionState>>;
```

#### <code v-pre>startFraudDetection</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L57) <code v-pre>packages/payment/src/semantics/fraud-detection-advanced.ts</code>

Start a fresh fraud detection session for a transaction.

```ts
export declare function startFraudDetection(input: {
    transactionId: string;
    customerId: string;
    amountCents: number;
    currency?: string;
    config?: FraudDetectionConfig;
}): FraudDetectionSession;
```

#### <code v-pre>verifyBiometric</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L117) <code v-pre>packages/payment/src/semantics/fraud-detection-advanced.ts</code>

Verify behavioral biometrics — typing rhythm + mouse motion + swipe pattern. Returns whether the observed pattern matches the historical profile.

```ts
export declare function verifyBiometric(adapter: PaymentAdapter, session: FraudDetectionSession, input: {
    passed: boolean;
    confidence: number;
    signals: string[];
}): Promise<AxisStep<FraudDetectionState>>;
```

### 型

#### <code v-pre>FraudDetectionConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L24) <code v-pre>packages/payment/src/semantics/fraud-detection-advanced.ts</code>

```ts
export interface FraudDetectionConfig {
    /** device score threshold (0-100) below which the transaction is flagged */
    minDeviceScore?: number;
    /** max attempts per hour per customer before velocity flag fires */
    maxVelocityPerHour?: number;
    /** ML score threshold above which the transaction is blocked */
    mlBlockThreshold?: number;
}
```

#### <code v-pre>FraudDetectionSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L33) <code v-pre>packages/payment/src/semantics/fraud-detection-advanced.ts</code>

```ts
export interface FraudDetectionSession {
    transactionId: string;
    customerId: string;
    amountCents: number;
    currency?: string;
    config: Required<FraudDetectionConfig>;
    deviceScore: number | null;
    biometricPassed: boolean | null;
    velocityCount: number;
    mlScore: number | null;
    verdict: FraudVerdict;
    state: FraudDetectionState;
    history: AxisStep<FraudDetectionState>[];
}
```

#### <code v-pre>FraudDetectionState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L13) <code v-pre>packages/payment/src/semantics/fraud-detection-advanced.ts</code>

Fraud detection advanced axis — device fingerprint scoring + behavioral biometrics verification + velocity checking + ML-driven block decision. Real fraud engines (Stripe Radar / Sift / Signifyd) combine 4 signals to score a transaction: device fingerprint (browser + OS + IP entropy), behavioral biometrics (typing rhythm + mouse motion), velocity (attempts per unit time), and an ML model that fuses everything into a final accept / review / block verdict.

```ts
export type FraudDetectionState = 'initial' | 'device-scored' | 'biometric-verified' | 'velocity-flagged' | 'ml-blocked' | 'accepted' | 'reviewing';
```

#### <code v-pre>FraudVerdict</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L22) <code v-pre>packages/payment/src/semantics/fraud-detection-advanced.ts</code>

```ts
export type FraudVerdict = 'accept' | 'review' | 'block';
```
