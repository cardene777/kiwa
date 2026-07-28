---
title: "@kiwa-lab/security semantics__web-vitals-security の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/security</code> <code v-pre>semantics&#95;&#95;web-vitals-security</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>applyPermissionsPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L110) <code v-pre>packages/security/src/semantics/web-vitals-security.ts</code>

```ts
export declare function applyPermissionsPolicy(session: WvsSession, input: PermissionsPolicyInput): AxisAdvStep<WvsState>;
```

#### <code v-pre>enforceCrossOriginIsolation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L128) <code v-pre>packages/security/src/semantics/web-vitals-security.ts</code>

```ts
export declare function enforceCrossOriginIsolation(session: WvsSession, input: CrossOriginInput): AxisAdvStep<WvsState>;
```

#### <code v-pre>enforceTrustedTypes</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L92) <code v-pre>packages/security/src/semantics/web-vitals-security.ts</code>

```ts
export declare function enforceTrustedTypes(session: WvsSession, input: TrustedTypesInput): AxisAdvStep<WvsState>;
```

#### <code v-pre>startWvsSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L57) <code v-pre>packages/security/src/semantics/web-vitals-security.ts</code>

```ts
export declare function startWvsSession(input: {
    target: SecurityAdvTarget;
    sessionId: string;
}): WvsSession;
```

#### <code v-pre>verifySri</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L72) <code v-pre>packages/security/src/semantics/web-vitals-security.ts</code>

```ts
export declare function verifySri(session: WvsSession, input: SriInput): AxisAdvStep<WvsState>;
```

### 型

#### <code v-pre>CrossOriginInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L51) <code v-pre>packages/security/src/semantics/web-vitals-security.ts</code>

```ts
export interface CrossOriginInput {
    coop: 'unsafe-none' | 'same-origin' | 'same-origin-allow-popups';
    coep: 'unsafe-none' | 'require-corp' | 'credentialless';
    corp: 'same-site' | 'same-origin' | 'cross-origin';
}
```

#### <code v-pre>PermissionsPolicyInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L44) <code v-pre>packages/security/src/semantics/web-vitals-security.ts</code>

```ts
export interface PermissionsPolicyInput {
    features: Array<{
        name: 'camera' | 'microphone' | 'geolocation' | 'payment' | 'usb' | 'gyroscope';
        allowlist: 'none' | 'self' | 'src' | string;
    }>;
}
```

#### <code v-pre>SriInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L32) <code v-pre>packages/security/src/semantics/web-vitals-security.ts</code>

```ts
export interface SriInput {
    resourceUrl: string;
    integrity: string;
    computedHash: string;
}
```

#### <code v-pre>TrustedTypesInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L38) <code v-pre>packages/security/src/semantics/web-vitals-security.ts</code>

```ts
export interface TrustedTypesInput {
    policyNames: string[];
    requireForScript: boolean;
    reportOnly: boolean;
}
```

#### <code v-pre>WvsSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L25) <code v-pre>packages/security/src/semantics/web-vitals-security.ts</code>

```ts
export interface WvsSession {
    target: SecurityAdvTarget;
    sessionId: string;
    state: WvsState;
    history: AxisAdvStep<WvsState>[];
}
```

#### <code v-pre>WvsState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L17) <code v-pre>packages/security/src/semantics/web-vitals-security.ts</code>

Web Vitals security axis — Subresource Integrity (SRI) hash + Trusted Types + Permissions Policy + Cross-Origin Isolation (COOP/COEP) enforcement state machine。 Deterministic mock で 4 signal 系統を提供。 real driver 経路では headless browser (Playwright) に対して response header を発火する。

```ts
export type WvsState = 'idle' | 'sri-verified' | 'trusted-types-enforced' | 'permissions-policy-applied' | 'cross-origin-isolated' | 'failed';
```
