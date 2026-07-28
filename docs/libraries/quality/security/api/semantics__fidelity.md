---
title: "@kiwa-lab/security semantics__fidelity の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/security</code> <code v-pre>semantics&#95;&#95;fidelity</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/fidelity.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>collectAdvFidelityCoverage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/fidelity.ts#L84) <code v-pre>packages/security/src/semantics/fidelity.ts</code>

```ts
export declare function collectAdvFidelityCoverage(providers?: SecurityAdvTarget[]): AdvFidelityCoverage;
```

#### <code v-pre>SECURITY&#95;ADV&#95;AXIS&#95;TO&#95;EVENTS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/fidelity.ts#L30) <code v-pre>packages/security/src/semantics/fidelity.ts</code>

```ts
export declare const SECURITY_ADV_AXIS_TO_EVENTS: Record<SecurityAdvAxis, NeutralAdvEventName[]>;
```

#### <code v-pre>SECURITY&#95;ADV&#95;FIDELITY&#95;GRID</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/fidelity.ts#L100) <code v-pre>packages/security/src/semantics/fidelity.ts</code>

provider × axis = 4 × 8 = 32 grid の SSOT 列挙。

```ts
export declare const SECURITY_ADV_FIDELITY_GRID: Array<{
    provider: SecurityAdvTarget;
    axis: SecurityAdvAxis;
}>;
```

### 型

#### <code v-pre>AdvFidelityCoverage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/fidelity.ts#L24) <code v-pre>packages/security/src/semantics/fidelity.ts</code>

```ts
export interface AdvFidelityCoverage {
    providers: SecurityAdvTarget[];
    axes: SecurityAdvAxis[];
    rows: AdvFidelityRow[];
}
```

#### <code v-pre>AdvFidelityRow</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/fidelity.ts#L17) <code v-pre>packages/security/src/semantics/fidelity.ts</code>

4 provider × 8 axis = 32 combination advanced fidelity grid (v0.2)。 v0.1 の `SECURITY_FIDELITY_GRID` は provider {helmet / express-rate-limit / casbin / coraza} × 基礎 8 axis を扱う。 本 v0.2 grid は provider {istio / opa / siem-splunk / vault} × 高度 8 axis を扱い、 `SECURITY_FIDELITY_GRID` と直交する 2 段目の grid 構造。

```ts
export interface AdvFidelityRow {
    provider: SecurityAdvTarget;
    axis: SecurityAdvAxis;
    neutralEvents: NeutralAdvEventName[];
    providerEvents: string[];
}
```
