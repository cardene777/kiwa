---
title: "@kiwa-lab/payment semantics-regulatory-reporting の API 契約"
---

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>semantics-regulatory-reporting</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>fileSar</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L164) <code v-pre>packages/payment/src/semantics/regulatory-reporting.ts</code>

File a SAR (Suspicious Activity Report) with FinCEN / NCA. Terminal-ish — a filed SAR is not deletable, so the session enters `sar-filed` state and can only be moved to `audit-locked` afterwards.

```ts
export declare function fileSar(adapter: PaymentAdapter, session: RegulatoryReportingSession, input: {
    reportId: string;
    regulator: 'FinCEN' | 'NCA';
    reason: string;
    fingerprint: string;
}): Promise<AxisStep<RegulatoryReportingState>>;
```

#### <code v-pre>lockForAudit</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L201) <code v-pre>packages/payment/src/semantics/regulatory-reporting.ts</code>

Lock the session for audit — no further reports accepted.

```ts
export declare function lockForAudit(session: RegulatoryReportingSession): RegulatoryReportingSession;
```

#### <code v-pre>reportDora</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L126) <code v-pre>packages/payment/src/semantics/regulatory-reporting.ts</code>

Submit a DORA (Digital Operational Resilience Act) report — ICT risk management self-assessment + third-party register.

```ts
export declare function reportDora(adapter: PaymentAdapter, session: RegulatoryReportingSession, input: {
    reportId: string;
    period: ReportPeriod;
    ictRiskScore: number;
    thirdPartyCount: number;
    incidentCount: number;
    fingerprint: string;
}): Promise<AxisStep<RegulatoryReportingState>>;
```

#### <code v-pre>reportPci</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L65) <code v-pre>packages/payment/src/semantics/regulatory-reporting.ts</code>

Submit a PCI DSS compliance report — attestation of Section 3.2 (do not store sensitive authentication data after authorisation).

```ts
export declare function reportPci(adapter: PaymentAdapter, session: RegulatoryReportingSession, input: {
    reportId: string;
    period: ReportPeriod;
    fingerprint: string;
    saqLevel: 'A' | 'A-EP' | 'D';
}): Promise<AxisStep<RegulatoryReportingState>>;
```

#### <code v-pre>reportPsd2</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L91) <code v-pre>packages/payment/src/semantics/regulatory-reporting.ts</code>

Submit a PSD2 SCA (Strong Customer Authentication) compliance report to the EBA. Includes exemption count + challenge rate.

```ts
export declare function reportPsd2(adapter: PaymentAdapter, session: RegulatoryReportingSession, input: {
    reportId: string;
    period: ReportPeriod;
    challengeRate: number;
    exemptionCount: number;
    fingerprint: string;
}): Promise<AxisStep<RegulatoryReportingState>>;
```

#### <code v-pre>startRegulatoryReporting</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L44) <code v-pre>packages/payment/src/semantics/regulatory-reporting.ts</code>

Start a regulatory reporting session for an entity (merchant / issuer).

```ts
export declare function startRegulatoryReporting(input: {
    entityId: string;
    customerId: string;
    currency?: string;
}): RegulatoryReportingSession;
```

### 型

#### <code v-pre>Regulator</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L20) <code v-pre>packages/payment/src/semantics/regulatory-reporting.ts</code>

```ts
export type Regulator = 'PCI-SSC' | 'EBA' | 'ESA' | 'FinCEN' | 'NCA';
```

#### <code v-pre>RegulatoryReportingSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L31) <code v-pre>packages/payment/src/semantics/regulatory-reporting.ts</code>

```ts
export interface RegulatoryReportingSession {
    entityId: string;
    customerId: string;
    currency?: string;
    reports: ReportRecord[];
    sarFiled: boolean;
    state: RegulatoryReportingState;
    history: AxisStep<RegulatoryReportingState>[];
}
```

#### <code v-pre>RegulatoryReportingState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L12) <code v-pre>packages/payment/src/semantics/regulatory-reporting.ts</code>

Regulatory reporting axis — PCI DSS + PSD2 SCA + DORA (Digital Operational Resilience Act) + AML/KYC + SAR (Suspicious Activity Report). Real payment processors submit periodic reports to regulators: PCI DSS to card networks, PSD2 to EBA (European Banking Authority), DORA to competent authorities under the ESAs, and SAR to FinCEN (US) / NCA (UK) on demand when suspicious activity is detected.

```ts
export type RegulatoryReportingState = 'initial' | 'pci-reported' | 'psd2-reported' | 'dora-reported' | 'sar-filed' | 'audit-locked';
```

#### <code v-pre>ReportPeriod</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L21) <code v-pre>packages/payment/src/semantics/regulatory-reporting.ts</code>

```ts
export type ReportPeriod = 'monthly' | 'quarterly' | 'annual' | 'on-demand';
```

#### <code v-pre>ReportRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L23) <code v-pre>packages/payment/src/semantics/regulatory-reporting.ts</code>

```ts
export interface ReportRecord {
    reportId: string;
    regulator: Regulator;
    period: ReportPeriod;
    submittedAt: number;
    fingerprint: string;
}
```
