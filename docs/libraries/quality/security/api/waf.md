---
title: "@kiwa-lab/security waf の API 契約"
---

# <code v-pre>@kiwa-lab/security</code> <code v-pre>waf</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>addCustomRule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts#L90) <code v-pre>packages/security/src/waf.ts</code>

```ts
export declare function addCustomRule(policy: WafPolicy, rule: WafRule): WafPolicy;
```

#### <code v-pre>createWafPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts#L85) <code v-pre>packages/security/src/waf.ts</code>

```ts
export declare function createWafPolicy(rules?: WafRule[]): WafPolicy;
```

#### <code v-pre>evaluateWaf</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts#L94) <code v-pre>packages/security/src/waf.ts</code>

```ts
export declare function evaluateWaf(policy: WafPolicy, request: WafRequest): WafDecision;
```

#### <code v-pre>OWASP&#95;CRS&#95;DEFAULT</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts#L46) <code v-pre>packages/security/src/waf.ts</code>

OWASP CRS の代表 rule id を kiwa が使う shape に写像した既定 rule 集。

```ts
export declare const OWASP_CRS_DEFAULT: WafRule[];
```

#### <code v-pre>suppressFalsePositive</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts#L122) <code v-pre>packages/security/src/waf.ts</code>

False positive suppression — allow-list per path で特定 rule を除外する partial policy override。 使い方は既存 policy + 部分 rule の rebuild。

```ts
export declare function suppressFalsePositive(policy: WafPolicy, ruleId: string, exceptionPath: string): WafPolicy;
```

#### <code v-pre>toWafEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts#L137) <code v-pre>packages/security/src/waf.ts</code>

```ts
export declare function toWafEvent(input: {
    provider: 'coraza' | 'helmet';
    decision: WafDecision;
    request: WafRequest;
    timestamp: number;
}): SecurityEvent;
```

### 型

#### <code v-pre>WafDecision</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts#L38) <code v-pre>packages/security/src/waf.ts</code>

```ts
export interface WafDecision {
    action: WafRuleAction;
    matchedRuleId: string | null;
    matchedCategory: string | null;
    reason: string;
}
```

#### <code v-pre>WafPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts#L81) <code v-pre>packages/security/src/waf.ts</code>

```ts
export interface WafPolicy {
    rules: WafRule[];
}
```

#### <code v-pre>WafRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts#L14) <code v-pre>packages/security/src/waf.ts</code>

WAF が判定する request の共通形状。

```ts
export interface WafRequest {
    method: string;
    path: string;
    headers: Record<string, string>;
    query?: Record<string, string>;
    body?: string;
    ip?: string;
}
```

#### <code v-pre>WafRule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts#L25) <code v-pre>packages/security/src/waf.ts</code>

```ts
export interface WafRule {
    id: string;
    /** OWASP CRS category (WAF_XSS / WAF_SQLI / WAF_LFI / WAF_RFI 等)。 */
    category: string;
    /** 適合すれば match、 検査対象は request.path + body の join 検査。 */
    pattern: RegExp;
    action: WafRuleAction;
    /** 大きいほど先に評価。 default 100。 */
    priority?: number;
    /** false positive suppression 用の exception path。 */
    exceptionPaths?: string[];
}
```

#### <code v-pre>WafRuleAction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts#L23) <code v-pre>packages/security/src/waf.ts</code>

```ts
export type WafRuleAction = 'block' | 'warn' | 'allow';
```
