---
title: "@kiwa-lab/security sbom の API 契約"
---

# <code v-pre>@kiwa-lab/security</code> <code v-pre>sbom</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>DEFAULT&#95;LICENSE&#95;POLICY</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L163) <code v-pre>packages/security/src/sbom.ts</code>

```ts
export declare const DEFAULT_LICENSE_POLICY: LicensePolicy;
```

#### <code v-pre>evaluateLicense</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L169) <code v-pre>packages/security/src/sbom.ts</code>

```ts
export declare function evaluateLicense(license: string | undefined, policy?: LicensePolicy): LicenseVerdict;
```

#### <code v-pre>lookupAdvisories</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L126) <code v-pre>packages/security/src/sbom.ts</code>

```ts
export declare function lookupAdvisories(doc: SbomDocument, feed: AdvisoryFeed): AdvisoryLookupResult[];
```

#### <code v-pre>toCycloneDx</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L30) <code v-pre>packages/security/src/sbom.ts</code>

CycloneDX 1.5 minimal — components が bomFormat = "CycloneDX"、 specVersion = "1.5"。

```ts
export declare function toCycloneDx(components: SbomComponent[], nowIso?: string): SbomDocument;
```

#### <code v-pre>toSbomEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L186) <code v-pre>packages/security/src/sbom.ts</code>

```ts
export declare function toSbomEvent(input: {
    provider: 'helmet' | 'coraza';
    verdict: 'allow' | 'deny' | 'warn';
    reason: string;
    payload: unknown;
    timestamp: number;
}): SecurityEvent;
```

#### <code v-pre>toSpdx</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L40) <code v-pre>packages/security/src/sbom.ts</code>

SPDX 2.3 minimal — packages list + relationships (DESCRIBES / DEPENDS_ON)。

```ts
export declare function toSpdx(components: SbomComponent[], nowIso?: string): SbomDocument;
```

#### <code v-pre>validateSbom</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L50) <code v-pre>packages/security/src/sbom.ts</code>

SBOM validation — mandatory fields + purl syntax check。

```ts
export declare function validateSbom(doc: SbomDocument): {
    ok: boolean;
    errors: string[];
};
```

#### <code v-pre>versionInRange</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L85) <code v-pre>packages/security/src/sbom.ts</code>

Simple semver "in range" check — accepts `&gt;= a.b.c`, `&lt; a.b.c`, `&lt; a.b.c || &gt;= x.y.z`, or an exact version string. Full semver range algebra is out of scope for the mock (real driver = actual OSV client)。

```ts
export declare function versionInRange(version: string, range: string): boolean;
```

### 型

#### <code v-pre>Advisory</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L63) <code v-pre>packages/security/src/sbom.ts</code>

OSV / NVD advisory shape 。 kiwa の in-memory advisory feed で使用。

```ts
export interface Advisory {
    id: string;
    affects: {
        purl: string;
        versionRange: string;
    }[];
    severity: 'low' | 'medium' | 'high' | 'critical';
    summary: string;
    source: 'osv' | 'nvd';
}
```

#### <code v-pre>AdvisoryFeed</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L71) <code v-pre>packages/security/src/sbom.ts</code>

```ts
export interface AdvisoryFeed {
    advisories: Advisory[];
}
```

#### <code v-pre>AdvisoryLookupResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L75) <code v-pre>packages/security/src/sbom.ts</code>

```ts
export interface AdvisoryLookupResult {
    component: SbomComponent;
    advisories: Advisory[];
}
```

#### <code v-pre>LicensePolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L157) <code v-pre>packages/security/src/sbom.ts</code>

```ts
export interface LicensePolicy {
    allow: string[];
    warn: string[];
    deny: string[];
}
```

#### <code v-pre>LicenseVerdict</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L155) <code v-pre>packages/security/src/sbom.ts</code>

License policy — SPDX license id ごとに allow / warn / deny 判定。

```ts
export type LicenseVerdict = 'allow' | 'warn' | 'deny';
```

#### <code v-pre>SbomComponent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L13) <code v-pre>packages/security/src/sbom.ts</code>

```ts
export interface SbomComponent {
    name: string;
    version: string;
    /** Package URL — e.g., pkg:npm/foo@1.2.3。 */
    purl: string;
    /** SPDX license expression (e.g., MIT, Apache-2.0, "MIT OR Apache-2.0")。 */
    license?: string;
}
```

#### <code v-pre>SbomDocument</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L22) <code v-pre>packages/security/src/sbom.ts</code>

```ts
export interface SbomDocument {
    format: 'cyclonedx' | 'spdx';
    formatVersion: string;
    components: SbomComponent[];
    generatedAtIso: string;
}
```
