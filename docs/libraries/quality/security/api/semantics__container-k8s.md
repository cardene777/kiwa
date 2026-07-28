---
title: "@kiwa-lab/security semantics__container-k8s の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/security</code> <code v-pre>semantics&#95;&#95;container-k8s</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>applyNetworkPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L102) <code v-pre>packages/security/src/semantics/container-k8s.ts</code>

```ts
export declare function applyNetworkPolicy(session: K8sSession, policy: NetworkPolicySpec): AxisAdvStep<K8sState>;
```

#### <code v-pre>decideAdmission</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L121) <code v-pre>packages/security/src/semantics/container-k8s.ts</code>

```ts
export declare function decideAdmission(session: K8sSession, request: AdmissionRequest, input: {
    requireLabel: string;
    allowedNamespaces: string[];
}): AxisAdvStep<K8sState>;
```

#### <code v-pre>enforcePodSecurity</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L72) <code v-pre>packages/security/src/semantics/container-k8s.ts</code>

```ts
export declare function enforcePodSecurity(session: K8sSession, level: PodSecurityLevel, pod: PodSpec): AxisAdvStep<K8sState>;
```

#### <code v-pre>startK8sSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L56) <code v-pre>packages/security/src/semantics/container-k8s.ts</code>

```ts
export declare function startK8sSession(input: {
    target: SecurityAdvTarget;
    sessionId: string;
}): K8sSession;
```

### 型

#### <code v-pre>AdmissionRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L49) <code v-pre>packages/security/src/semantics/container-k8s.ts</code>

```ts
export interface AdmissionRequest {
    operation: 'CREATE' | 'UPDATE' | 'DELETE';
    resource: 'Pod' | 'Deployment' | 'Service' | 'ConfigMap';
    namespace: string;
    labels: Record<string, string>;
}
```

#### <code v-pre>K8sSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L25) <code v-pre>packages/security/src/semantics/container-k8s.ts</code>

```ts
export interface K8sSession {
    target: SecurityAdvTarget;
    sessionId: string;
    state: K8sState;
    history: AxisAdvStep<K8sState>[];
    enforcedLevel: PodSecurityLevel | null;
}
```

#### <code v-pre>K8sState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L19) <code v-pre>packages/security/src/semantics/container-k8s.ts</code>

```ts
export type K8sState = 'idle' | 'pod-security-enforced' | 'network-policy-applied' | 'admission-decided';
```

#### <code v-pre>NetworkPolicySpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L42) <code v-pre>packages/security/src/semantics/container-k8s.ts</code>

```ts
export interface NetworkPolicySpec {
    namespace: string;
    podSelector: Record<string, string>;
    ingressFromNamespaces: string[];
    egressToNamespaces: string[];
}
```

#### <code v-pre>PodSecurityLevel</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L17) <code v-pre>packages/security/src/semantics/container-k8s.ts</code>

Container / Kubernetes security axis — Pod Security Standard enforcement + NetworkPolicy application + Admission Controller (Gatekeeper / Kyverno) decision state machine。 Deterministic mock で 3 signal 系統 + 2 admission verdict を提供。 real driver 経路では OPA Gatekeeper に対して webhook を発火する。

```ts
export type PodSecurityLevel = 'privileged' | 'baseline' | 'restricted';
```

#### <code v-pre>PodSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L33) <code v-pre>packages/security/src/semantics/container-k8s.ts</code>

```ts
export interface PodSpec {
    namespace: string;
    runAsRoot: boolean;
    privileged: boolean;
    allowPrivilegeEscalation: boolean;
    hostNetwork: boolean;
    hostPid: boolean;
}
```
