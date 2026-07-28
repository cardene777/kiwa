---
title: "@kiwa-lab/security-devsecops orchestrator-summary の API 契約"
---

# <code v-pre>@kiwa-lab/security-devsecops</code> <code v-pre>orchestrator-summary</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/orchestrator/summary.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>summarizeAuditReport</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/orchestrator/summary.ts#L8) <code v-pre>packages/security-devsecops/src/orchestrator/summary.ts</code>

Audit report 集約 API — skill 出力層 (STRIDE / DREAD 分類 tag 添付) に流し込む。 threat-model preset の時のみ STRIDE tag 添付、 他 preset は tag 空。

```ts
export declare function summarizeAuditReport(report: AuditReport): AuditSummary;
```


