# Perf Suite — visual

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00057ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0011ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| comparePngBuffersIdentical | 0.51ms | 1.62ms | 50ms | 0.0010ms | PASS | regressed — gate 無効 (regressionGate=false) |
| comparePngBuffersFullDiff | 7.85ms | 13.66ms | 200ms | 0.0010ms | PASS | regressed — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| comparePngBuffersIdentical | cpu | 0.09ms | 0.13ms | 0.51ms | 5.687 | 4.255 | n/a | 20.0% | 0.46ms | 0.34ms |
| comparePngBuffersFullDiff | cpu | 0.09ms | 0.13ms | 7.85ms | 86.825 | 65.521 | n/a | 20.0% | 7.06ms | 5.32ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| comparePngBuffersIdentical | 2.33ms | 100ms | PASS |
| comparePngBuffersFullDiff | 40.25ms | 400ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| comparePngBuffersIdentical | 9272 B | 749751 B | 8388608 B | yes | 33 (3 + 30) | PASS |
| comparePngBuffersFullDiff | 39392 B | 13701403 B | 16777216 B | yes | 33 (3 + 30) | WAIVED (arrayBuffers の振れ幅 26MB が上限 16.7MB を上回り判定が成立しない (#1719)) |

## Detailed serial reports

### comparePngBuffersIdentical

# Perf Report — comparePngBuffersIdentical.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.51ms |
| p50 | 0.95ms |
| p95 | 1.62ms |
| p99 | 1.79ms |
| mean | 0.99ms |
| stdev | 0.40ms |
| min | 0.47ms |
| max | 1.82ms |
| total | 29.77ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.902)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.46ms | 0.34ms | +0.12ms | +33.66% |
| p50 | 0.86ms | 0.40ms | +0.46ms | +112.66% |
| p95 | 1.46ms | 0.68ms | +0.78ms | +114.14% |
| p99 | 1.61ms | 0.80ms | +0.81ms | +101.69% |
| mean | 0.90ms | 0.46ms | +0.44ms | +96.38% |
| min | 0.42ms | 0.33ms | +0.09ms | +26.31% |
| max | 1.65ms | 0.83ms | +0.81ms | +97.33% |
| total | 26.86ms | 13.68ms | +13.18ms | +96.38% |

### comparePngBuffersFullDiff

# Perf Report — comparePngBuffersFullDiff.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 7.85ms |
| p50 | 10.26ms |
| p95 | 13.66ms |
| p99 | 14.54ms |
| mean | 10.15ms |
| stdev | 2.12ms |
| min | 7.13ms |
| max | 14.76ms |
| total | 304.57ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.899)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 7.06ms | 5.32ms | +1.73ms | +32.51% |
| p50 | 9.23ms | 6.11ms | +3.12ms | +51.10% |
| p95 | 12.28ms | 7.81ms | +4.47ms | +57.20% |
| p99 | 13.07ms | 8.31ms | +4.76ms | +57.32% |
| mean | 9.13ms | 6.27ms | +2.86ms | +45.61% |
| min | 6.41ms | 5.17ms | +1.24ms | +24.07% |
| max | 13.27ms | 8.46ms | +4.81ms | +56.79% |
| total | 273.79ms | 188.03ms | +85.76ms | +45.61% |

