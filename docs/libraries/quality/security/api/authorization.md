---
title: "@kiwa-lab/security authorization の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/security</code> <code v-pre>authorization</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createRbacPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L29) <code v-pre>packages/security/src/authorization.ts</code>

```ts
export declare function createRbacPolicy(roles: RbacRole[]): RbacPolicy;
```

#### <code v-pre>evaluateAbac</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L119) <code v-pre>packages/security/src/authorization.ts</code>

```ts
export declare function evaluateAbac(policy: AbacPolicy, attrs: AbacAttributes): AbacDecision;
```

#### <code v-pre>evaluateCombined</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L160) <code v-pre>packages/security/src/authorization.ts</code>

```ts
export declare function evaluateCombined(input: CombinedPolicyInput): AbacDecision;
```

#### <code v-pre>expandRoles</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L57) <code v-pre>packages/security/src/authorization.ts</code>

Given a subject, expand its assigned roles through the parent hierarchy and collect the transitive permission set. Used by the RBAC evaluator.

```ts
export declare function expandRoles(policy: RbacPolicy, subject: RbacSubject): Set<string>;
```

#### <code v-pre>rbacAllows</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L75) <code v-pre>packages/security/src/authorization.ts</code>

```ts
export declare function rbacAllows(policy: RbacPolicy, subject: RbacSubject, permission: string): boolean;
```

#### <code v-pre>toAuthorizationEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L176) <code v-pre>packages/security/src/authorization.ts</code>

```ts
export declare function toAuthorizationEvent(input: {
    provider: 'casbin' | 'coraza';
    decision: AbacDecision;
    subject: string;
    action: string;
    timestamp: number;
}): SecurityEvent;
```

### 型

#### <code v-pre>AbacAttributes</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L84) <code v-pre>packages/security/src/authorization.ts</code>

ABAC — subject / resource / action / environment 4 属性 + expression evaluator。

```ts
export interface AbacAttributes {
    subject: Record<string, unknown>;
    resource: Record<string, unknown>;
    action: string;
    environment: Record<string, unknown>;
}
```

#### <code v-pre>AbacCombiningAlgo</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L106) <code v-pre>packages/security/src/authorization.ts</code>

Rule combining algorithms follow XACML naming: - deny-overrides: any DENY wins - permit-overrides: any PERMIT wins - first-applicable: return the first rule that matches (default deny after)

```ts
export type AbacCombiningAlgo = 'deny-overrides' | 'permit-overrides' | 'first-applicable';
```

#### <code v-pre>AbacDecision</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L113) <code v-pre>packages/security/src/authorization.ts</code>

```ts
export interface AbacDecision {
    effect: AbacRuleEffect;
    matchedRule: string | null;
    reason: string;
}
```

#### <code v-pre>AbacPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L108) <code v-pre>packages/security/src/authorization.ts</code>

```ts
export interface AbacPolicy {
    rules: AbacRule[];
    algorithm: AbacCombiningAlgo;
}
```

#### <code v-pre>AbacRule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L93) <code v-pre>packages/security/src/authorization.ts</code>

```ts
export interface AbacRule {
    id: string;
    effect: AbacRuleEffect;
    /** Predicate against the 4 attribute buckets. */
    condition: (attrs: AbacAttributes) => boolean;
}
```

#### <code v-pre>AbacRuleEffect</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L91) <code v-pre>packages/security/src/authorization.ts</code>

```ts
export type AbacRuleEffect = 'permit' | 'deny';
```

#### <code v-pre>CombinedPolicyInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L155) <code v-pre>packages/security/src/authorization.ts</code>

Combined policy engine — RBAC decision と ABAC decision を組合せる。 RBAC PERMIT + ABAC PERMIT → PERMIT、 いずれか DENY → DENY、 RBAC 未定義 permission は ABAC のみで判定。

```ts
export interface CombinedPolicyInput {
    rbac?: {
        policy: RbacPolicy;
        subject: RbacSubject;
        permission: string;
    };
    abac?: {
        policy: AbacPolicy;
        attrs: AbacAttributes;
    };
}
```

#### <code v-pre>RbacPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L25) <code v-pre>packages/security/src/authorization.ts</code>

```ts
export interface RbacPolicy {
    roles: Map<string, RbacRole>;
}
```

#### <code v-pre>RbacRole</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L13) <code v-pre>packages/security/src/authorization.ts</code>

```ts
export interface RbacRole {
    name: string;
    permissions: string[];
    /** parent roles — permissions を継承する上位 role 名。 */
    parents?: string[];
}
```

#### <code v-pre>RbacSubject</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L20) <code v-pre>packages/security/src/authorization.ts</code>

```ts
export interface RbacSubject {
    id: string;
    roles: string[];
}
```
