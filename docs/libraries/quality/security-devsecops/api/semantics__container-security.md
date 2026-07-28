---
title: "@kiwa-lab/security-devsecops semantics__container-security の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/security-devsecops</code> <code v-pre>semantics&#95;&#95;container-security</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/container-security.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>completeContainerScan</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/container-security.ts#L124) <code v-pre>packages/security-devsecops/src/semantics/container-security.ts</code>

```ts
export declare function completeContainerScan(session: ContainerSecuritySession): AxisStep<ContainerSecState>;
```

#### <code v-pre>detectContainerCve</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/container-security.ts#L80) <code v-pre>packages/security-devsecops/src/semantics/container-security.ts</code>

```ts
export declare function detectContainerCve(session: ContainerSecuritySession, cve: ContainerCve): AxisStep<ContainerSecState>;
```

#### <code v-pre>flagContainerMalware</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/container-security.ts#L103) <code v-pre>packages/security-devsecops/src/semantics/container-security.ts</code>

```ts
export declare function flagContainerMalware(session: ContainerSecuritySession, malware: ContainerMalware): AxisStep<ContainerSecState>;
```

#### <code v-pre>scanContainerImage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/container-security.ts#L61) <code v-pre>packages/security-devsecops/src/semantics/container-security.ts</code>

```ts
export declare function scanContainerImage(session: ContainerSecuritySession, input: {
    layerCount: number;
}): AxisStep<ContainerSecState>;
```

#### <code v-pre>startContainerScan</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/container-security.ts#L37) <code v-pre>packages/security-devsecops/src/semantics/container-security.ts</code>

```ts
export declare function startContainerScan(input: {
    scanId: string;
    imageRef: string;
}): ContainerSecuritySession;
```

### 型

#### <code v-pre>ContainerCve</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/container-security.ts#L9) <code v-pre>packages/security-devsecops/src/semantics/container-security.ts</code>

```ts
export interface ContainerCve {
    cveId: string;
    package: string;
    version: string;
    layer: string;
    severity: Severity;
    fixedVersion?: string;
}
```

#### <code v-pre>ContainerMalware</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/container-security.ts#L18) <code v-pre>packages/security-devsecops/src/semantics/container-security.ts</code>

```ts
export interface ContainerMalware {
    malwareType: 'trojan' | 'backdoor' | 'cryptominer' | 'rootkit' | 'ransomware';
    filePath: string;
    layer: string;
    signature: string;
    severity: Severity;
}
```

#### <code v-pre>ContainerSecState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/container-security.ts#L7) <code v-pre>packages/security-devsecops/src/semantics/container-security.ts</code>

Container security axis — Grype-style container image scan + CVE detection + malware detection。

```ts
export type ContainerSecState = 'idle' | 'scanning' | 'threats-found' | 'completed';
```

#### <code v-pre>ContainerSecuritySession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/container-security.ts#L26) <code v-pre>packages/security-devsecops/src/semantics/container-security.ts</code>

```ts
export interface ContainerSecuritySession {
    scanId: string;
    provider: 'grype';
    imageRef: string;
    layerCount: number;
    cves: ContainerCve[];
    malwares: ContainerMalware[];
    state: ContainerSecState;
    history: AxisStep<ContainerSecState>[];
}
```
