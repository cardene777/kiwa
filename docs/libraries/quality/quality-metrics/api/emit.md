---
title: "@kiwa-lab/quality-metrics emit の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/quality-metrics</code> <code v-pre>emit</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/emit.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>diffReports</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/emit.ts#L155) <code v-pre>packages/quality-metrics/src/emit.ts</code>

Compute a diff between two reports for the same provider. Values are (`current - previous`) so callers can render "improved" / "regressed" labels next to each axis. AI-LLM 4 軸は両 report が該当 field を持つ場合 のみ diff を計算する。

```ts
export declare function diffReports(previous: QualityReport, current: QualityReport): QualityReportDiff;
```

#### <code v-pre>emitJson</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/emit.ts#L145) <code v-pre>packages/quality-metrics/src/emit.ts</code>

Emit the report as JSON — the machine-readable counterpart consumers use to persist raw metrics under `docs/quality-reports/`. Pretty-printed with 2-space indentation.

```ts
export declare function emitJson(report: QualityReport): string;
```

#### <code v-pre>emitMarkdown</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/emit.ts#L11) <code v-pre>packages/quality-metrics/src/emit.ts</code>

Emit a human-readable markdown report from a {@link QualityReport}. The output shape mirrors what `docs/quality-reports/{package}-{version}.md` consumers expect. When `verdict` is supplied, an additional release-gate section is appended. AI-LLM provider の場合は 4 軸行が追加される。

```ts
export declare function emitMarkdown(input: {
    report: QualityReport;
    verdict?: ReleaseGateVerdict;
    diff?: QualityReportDiff;
}): string;
```


