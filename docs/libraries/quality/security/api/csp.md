---
title: "@kiwa-lab/security csp の API 契約"
---

# <code v-pre>@kiwa-lab/security</code> <code v-pre>csp</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security/src/csp.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>buildCspHeader</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/csp.ts#L106) <code v-pre>packages/security/src/csp.ts</code>

CSP header を SSOT 定義から build する。 nonce / hash / strict-dynamic は 5 sub-axis の中で最も間違えやすい組合せ (nonce が同 header 内 2 回以上 出ると browser reject / strict-dynamic は nonce or hash なしに書くと whole policy が effect なし) を build 段階で予防する。

```ts
export declare function buildCspHeader(input: CspPolicyInput): CspHeaderOutput;
```

#### <code v-pre>toCspEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/csp.ts#L209) <code v-pre>packages/security/src/csp.ts</code>

CSP violation を統一 event 形式に変換する adapter。 fidelity harness が real (Report-To API) と mock (unit test) の 両方の event 列を同型で扱えるようにする。

```ts
export declare function toCspEvent(input: {
    provider: 'helmet' | 'coraza';
    verdict: 'allow' | 'deny' | 'warn';
    reason: string;
    payload: unknown;
    timestamp: number;
}): SecurityEvent;
```

#### <code v-pre>validateNonce</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/csp.ts#L194) <code v-pre>packages/security/src/csp.ts</code>

nonce 検証 — 同 header 内で同じ nonce が 2 回以上出ないか、 32 char 以上か。

```ts
export declare function validateNonce(nonce: string): {
    ok: boolean;
    reason: string;
};
```

### 型

#### <code v-pre>CspDirective</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/csp.ts#L18) <code v-pre>packages/security/src/csp.ts</code>

CSP directive の完全列挙 (Fetch directive + Document directive + Reporting)。

```ts
export type CspDirective = 'default-src' | 'script-src' | 'script-src-elem' | 'script-src-attr' | 'style-src' | 'style-src-elem' | 'style-src-attr' | 'img-src' | 'connect-src' | 'font-src' | 'frame-src' | 'frame-ancestors' | 'form-action' | 'base-uri' | 'object-src' | 'worker-src' | 'child-src' | 'media-src' | 'manifest-src' | 'trusted-types' | 'require-trusted-types-for' | 'upgrade-insecure-requests' | 'block-all-mixed-content' | 'report-uri' | 'report-to';
```

#### <code v-pre>CspHashAlgo</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/csp.ts#L52) <code v-pre>packages/security/src/csp.ts</code>

```ts
export type CspHashAlgo = 'sha256' | 'sha384' | 'sha512';
```

#### <code v-pre>CspHashOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/csp.ts#L54) <code v-pre>packages/security/src/csp.ts</code>

```ts
export interface CspHashOptions {
    algorithm: CspHashAlgo;
    /** Base64-encoded digest。 */
    digest: string;
    /** attach directive (default script-src)。 */
    directives?: CspDirective[];
}
```

#### <code v-pre>CspHeaderOutput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/csp.ts#L82) <code v-pre>packages/security/src/csp.ts</code>

```ts
export interface CspHeaderOutput {
    headerName: 'Content-Security-Policy' | 'Content-Security-Policy-Report-Only';
    headerValue: string;
    /** 各 directive を key に持つ debug 用の展開後 map。 */
    expandedDirectives: Record<CspDirective, string[]>;
}
```

#### <code v-pre>CspNonceOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/csp.ts#L45) <code v-pre>packages/security/src/csp.ts</code>

```ts
export interface CspNonceOptions {
    /** Base64URL-encoded random nonce (16-32 bytes)。 */
    nonce: string;
    /** attach directive (default script-src)。 */
    directives?: CspDirective[];
}
```

#### <code v-pre>CspPolicyInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/csp.ts#L62) <code v-pre>packages/security/src/csp.ts</code>

```ts
export interface CspPolicyInput {
    /** directive -> source list の連想。 空 array は `'none'` 相当。 */
    directives: Partial<Record<CspDirective, string[]>>;
    /** 各 request で差替える nonce 群。 */
    nonces?: CspNonceOptions[];
    /** inline script/style hash 群。 */
    hashes?: CspHashOptions[];
    /** `strict-dynamic` を script-src に付与する。 nonce or hash 必須。 */
    strictDynamic?: boolean;
    /** trusted-types policy 名一覧 (`default` は無指定時) + require-trusted-types-for 'script'。 */
    trustedTypes?: {
        policies: string[];
        requireForScript?: boolean;
    };
    /** report-only mode で発行する (header 名も切替)。 */
    reportOnly?: boolean;
    /** `report-to` group name (report-uri は同名で fallback)。 */
    reportGroup?: string;
}
```
