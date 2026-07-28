---
title: "@kiwa-lab/security-devsecops semantics-dast の API 契約"
---

# <code v-pre>@kiwa-lab/security-devsecops</code> <code v-pre>semantics-dast</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/dast.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>attemptDastAttack</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/dast.ts#L71) <code v-pre>packages/security-devsecops/src/semantics/dast.ts</code>

```ts
export declare function attemptDastAttack(session: DastSession, attack: DastAttack): AxisStep<DastState>;
```

#### <code v-pre>completeDastScan</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/dast.ts#L114) <code v-pre>packages/security-devsecops/src/semantics/dast.ts</code>

```ts
export declare function completeDastScan(session: DastSession): AxisStep<DastState>;
```

#### <code v-pre>confirmDastVuln</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/dast.ts#L92) <code v-pre>packages/security-devsecops/src/semantics/dast.ts</code>

```ts
export declare function confirmDastVuln(session: DastSession, vuln: DastVuln): AxisStep<DastState>;
```

#### <code v-pre>crawlDastUrls</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/dast.ts#L56) <code v-pre>packages/security-devsecops/src/semantics/dast.ts</code>

```ts
export declare function crawlDastUrls(session: DastSession, input: {
    count: number;
}): AxisStep<DastState>;
```

#### <code v-pre>startDastScan</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/dast.ts#L35) <code v-pre>packages/security-devsecops/src/semantics/dast.ts</code>

```ts
export declare function startDastScan(input: {
    scanId: string;
    target: string;
}): DastSession;
```

### 型

#### <code v-pre>DastAttack</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/dast.ts#L9) <code v-pre>packages/security-devsecops/src/semantics/dast.ts</code>

```ts
export interface DastAttack {
    attackType: 'xss' | 'sqli' | 'csrf' | 'xxe' | 'ssrf' | 'command-injection' | 'path-traversal';
    targetUrl: string;
    payload: string;
    successful: boolean;
}
```

#### <code v-pre>DastSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/dast.ts#L24) <code v-pre>packages/security-devsecops/src/semantics/dast.ts</code>

```ts
export interface DastSession {
    scanId: string;
    provider: 'owasp-zap';
    target: string;
    crawledUrls: number;
    attacks: DastAttack[];
    vulns: DastVuln[];
    state: DastState;
    history: AxisStep<DastState>[];
}
```

#### <code v-pre>DastState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/dast.ts#L7) <code v-pre>packages/security-devsecops/src/semantics/dast.ts</code>

DAST (Dynamic Application Security Testing) axis — OWASP ZAP-style live-app crawl + attack attempt + vulnerability confirmation。

```ts
export type DastState = 'idle' | 'crawling' | 'attacking' | 'vuln-found' | 'completed';
```

#### <code v-pre>DastVuln</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/dast.ts#L16) <code v-pre>packages/security-devsecops/src/semantics/dast.ts</code>

```ts
export interface DastVuln {
    vulnClass: string;
    cweId: string;
    targetUrl: string;
    severity: Severity;
    evidence: string;
}
```
