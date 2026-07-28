---
title: "@kiwa-lab/security-devsecops orchestrator__run-audit の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/security-devsecops</code> <code v-pre>orchestrator&#95;&#95;run-audit</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/orchestrator/run-audit.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>runSecurityAudit</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/orchestrator/run-audit.ts#L53) <code v-pre>packages/security-devsecops/src/orchestrator/run-audit.ts</code>

DevSecOps library single entry (v0.3、 Phase 3)。 skill 4 種の workflow を library 内に集約、 skill 側は preset 選択だけで 6 axis を横断的に扱える。 backward compat 維持 = v0.1 semantics 直接使用 + v0.2 adapter 個別使用も引き続き動作。

```ts
export declare function runSecurityAudit(input: AuditInvocation): Promise<AuditReport>;
```


