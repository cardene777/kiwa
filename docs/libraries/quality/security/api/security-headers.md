---
title: "@kiwa-lab/security security-headers の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/security</code> <code v-pre>security-headers</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>buildSecurityHeaders</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L78) <code v-pre>packages/security/src/security-headers.ts</code>

```ts
export declare function buildSecurityHeaders(input: SecurityHeadersInput): SecurityHeadersOutput;
```

#### <code v-pre>toSecurityHeadersEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L181) <code v-pre>packages/security/src/security-headers.ts</code>

```ts
export declare function toSecurityHeadersEvent(input: {
    provider: 'helmet';
    verdict: 'allow' | 'warn' | 'deny';
    reason: string;
    payload: unknown;
    timestamp: number;
}): SecurityEvent;
```

#### <code v-pre>validateSecurityHeaders</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L153) <code v-pre>packages/security/src/security-headers.ts</code>

Header header 値の syntactic validation。 実 browser 実装との fidelity は fidelity harness 側で確認、 ここでは build 段階の misuse だけ検知。

```ts
export declare function validateSecurityHeaders(input: SecurityHeadersInput): {
    ok: boolean;
    errors: string[];
};
```

### 型

#### <code v-pre>HstsOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L14) <code v-pre>packages/security/src/security-headers.ts</code>

```ts
export interface HstsOptions {
    maxAgeSec: number;
    includeSubDomains?: boolean;
    preload?: boolean;
}
```

#### <code v-pre>PermissionsFeature</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L36) <code v-pre>packages/security/src/security-headers.ts</code>

Permissions-Policy feature 名 — Chrome/Firefox で実装されている代表 feature。

```ts
export type PermissionsFeature = 'accelerometer' | 'ambient-light-sensor' | 'autoplay' | 'battery' | 'camera' | 'display-capture' | 'document-domain' | 'encrypted-media' | 'execution-while-not-rendered' | 'execution-while-out-of-viewport' | 'fullscreen' | 'geolocation' | 'gyroscope' | 'magnetometer' | 'microphone' | 'midi' | 'payment' | 'picture-in-picture' | 'publickey-credentials-get' | 'screen-wake-lock' | 'sync-xhr' | 'usb' | 'web-share' | 'xr-spatial-tracking';
```

#### <code v-pre>PermissionsSource</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L63) <code v-pre>packages/security/src/security-headers.ts</code>

allowlist source per feature — `*`, `self`, or explicit origin list.

```ts
export type PermissionsSource = '*' | 'self' | 'none' | {
    origins: string[];
};
```

#### <code v-pre>ReferrerPolicyValue</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L25) <code v-pre>packages/security/src/security-headers.ts</code>

```ts
export type ReferrerPolicyValue = 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url';
```

#### <code v-pre>SecurityHeadersInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L65) <code v-pre>packages/security/src/security-headers.ts</code>

```ts
export interface SecurityHeadersInput {
    hsts?: HstsOptions;
    xFrame?: XFrameOption;
    /** nosniff は固定なので on/off だけ。 */
    xContentTypeOptions?: boolean;
    referrerPolicy?: ReferrerPolicyValue;
    permissionsPolicy?: Partial<Record<PermissionsFeature, PermissionsSource>>;
}
```

#### <code v-pre>SecurityHeadersOutput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L74) <code v-pre>packages/security/src/security-headers.ts</code>

```ts
export interface SecurityHeadersOutput {
    headers: Record<string, string>;
}
```

#### <code v-pre>XFrameOption</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L20) <code v-pre>packages/security/src/security-headers.ts</code>

```ts
export type XFrameOption = {
    mode: 'DENY';
} | {
    mode: 'SAMEORIGIN';
} | {
    mode: 'ALLOW-FROM';
    uri: string;
};
```
