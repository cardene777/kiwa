# Perf Suite — date-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 0.0030ms | 0.0086ms | 100ms | 0.00051ms | PASS | stable — gate 無効 (regressionGate=false) |
| format_parse_batch (5 format + parse round-trip) | 0.0058ms | 0.0076ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| parse_error_handling (5 invalid string throw + catch) | 0.01ms | 0.02ms | 100ms | 0.00052ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | cpu | 0.08ms | 0.10ms | 0.0030ms | 0.037 | 0.037 | 0.0031ms | 0.0031ms |
| format_parse_batch (5 format + parse round-trip) | cpu | 0.08ms | 0.09ms | 0.0058ms | 0.072 | 0.072 | 0.0059ms | 0.0059ms |
| parse_error_handling (5 invalid string throw + catch) | cpu | 0.08ms | 0.08ms | 0.01ms | 0.183 | 0.181 | 0.02ms | 0.02ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 0.03ms | 200ms | PASS |
| format_parse_batch (5 format + parse round-trip) | 0.03ms | 200ms | PASS |
| parse_error_handling (5 invalid string throw + catch) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 16256 B | 0 B | 102400 B | yes | PASS |
| format_parse_batch (5 format + parse round-trip) | -3392 B | 0 B | 102400 B | yes | PASS |
| parse_error_handling (5 invalid string throw + catch) | -776 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_provider_workflow (10 arithmetic across 4 providers)

# Perf Report — multi_provider_workflow (10 arithmetic across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0030ms |
| p50 | 0.0032ms |
| p95 | 0.0086ms |
| p99 | 0.0088ms |
| mean | 0.0044ms |
| stdev | 0.0018ms |
| min | 0.0030ms |
| max | 0.0088ms |
| total | 0.09ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.026)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0031ms | 0.0031ms | -0.0000053ms | -0.17% |
| p50 | 0.0033ms | 0.0032ms | +0.00013ms | +3.90% |
| p95 | 0.0089ms | 0.0087ms | +0.00011ms | +1.23% |
| p99 | 0.0090ms | 0.0094ms | -0.00040ms | -4.22% |
| mean | 0.0045ms | 0.0044ms | +0.000089ms | +2.01% |
| min | 0.0031ms | 0.0030ms | +0.000078ms | +2.59% |
| max | 0.0090ms | 0.0095ms | -0.00052ms | -5.46% |
| total | 0.09ms | 0.09ms | +0.0018ms | +2.01% |

### format_parse_batch (5 format + parse round-trip)

# Perf Report — format_parse_batch (5 format + parse round-trip).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0058ms |
| p50 | 0.0060ms |
| p95 | 0.0076ms |
| p99 | 0.01ms |
| mean | 0.0064ms |
| stdev | 0.0013ms |
| min | 0.0056ms |
| max | 0.01ms |
| total | 0.13ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.005)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0059ms | 0.0059ms | -0.000015ms | -0.25% |
| p50 | 0.0060ms | 0.0061ms | -0.000093ms | -1.51% |
| p95 | 0.0077ms | 0.0077ms | +0.0000097ms | +0.13% |
| p99 | 0.01ms | 0.01ms | -0.00045ms | -3.95% |
| mean | 0.0065ms | 0.0065ms | -0.000063ms | -0.97% |
| min | 0.0057ms | 0.0057ms | -0.000095ms | -1.65% |
| max | 0.01ms | 0.01ms | -0.00056ms | -4.59% |
| total | 0.13ms | 0.13ms | -0.0013ms | -0.97% |

### parse_error_handling (5 invalid string throw + catch)

# Perf Report — parse_error_handling (5 invalid string throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.0015ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.31ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.034)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00012ms | +0.80% |
| p50 | 0.02ms | 0.02ms | +0.00010ms | +0.68% |
| p95 | 0.02ms | 0.02ms | +0.00015ms | +0.82% |
| p99 | 0.02ms | 0.02ms | -0.0021ms | -9.00% |
| mean | 0.02ms | 0.02ms | -0.000037ms | -0.23% |
| min | 0.02ms | 0.01ms | +0.000073ms | +0.49% |
| max | 0.02ms | 0.02ms | -0.0027ms | -10.81% |
| total | 0.32ms | 0.32ms | -0.00073ms | -0.23% |

