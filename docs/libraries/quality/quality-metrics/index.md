# Quality Metrics

`@kiwa-lab/quality-metrics` は、coverage、test count、fidelity、performance、mutation、accessibility の測定値を `QualityReport` に集約し、release gate を評価する library です。測定器そのものではありません。Vitest、mutation runner、a11y scanner、performance job が出した値を呼び出し側で正規化し、この library で出荷基準と照合します。

![テストと mutation の指標から report と tier を組み立て passed か blockers を返す流れ](/images/kiwa-docs/quality/quality-metrics-overview.png)

## 数値を release の判断に変える

collector helper は raw measurement を report の metric に変換します。`mutationFromCounts` は mutation 数と killed 数から kill rate を、`perfFromSamples` は sample から percentile を、`fidelityFromMethodCounts` は mock と real の対応率を作ります。`evaluateReleaseGate` は report を既定値または project 固有の threshold と比べ、`passed` と axis ごとの `blockers` を返します。最初の失格だけで止まらないため、coverage と mutation が同時に不足していることも同じ結果から確認できます。

mutation tier と a11y tier は通常 gate より厳しい基準を加えるための context です。mutation が 0 件なら kill rate は 0 で、十分な test がある証明にはなりません。一方で a11y の violation が 0 件は期待する成功です。数値の意味を一律に扱わず、axis ごとの gate を assertion します。

## AI provider の追加基準

provider 名が `@kiwa-lab/ai-` で始まる report では、通常の品質信号に cost、latency、token、accuracy が追加されます。これらの値が欠けている場合も blocker です。通常 provider に同じ metric を入れても AI の gate は有効になりません。測定 job の不備を合格として扱わないため、provider 名と report の必須 axis を合わせてください。

report の収集、real provider との fidelity 実行、CI の artifact 保存はこの library の外です。ここでは与えられた数値を決定的に評価します。測定の信頼性、代表的な workload、cost の集計期間、threshold を緩める理由は release policy と CI に残します。

## 読み進める

[Quickstart](./quickstart) では mutation metric と fidelity を作ります。[使い方](./how-to) では完全な report を tier 付き release gate に渡します。全 metric、threshold、blocker の shape は [リファレンス](./reference) にあります。
