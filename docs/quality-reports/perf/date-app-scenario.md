# Perf Suite — date-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 0.0030ms | 0.0090ms | 100ms | 0.00051ms | PASS | stable (p10 +6% (閾値未満)、 p95 +28% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| format_parse_batch (5 format + parse round-trip) | 0.0058ms | 0.01ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| parse_error_handling (5 invalid string throw + catch) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | cpu | 0.08ms | 0.0030ms | 0.037 | 0.034 | 0.0031ms | 0.0029ms |
| format_parse_batch (5 format + parse round-trip) | cpu | 0.08ms | 0.0058ms | 0.070 | 0.073 | 0.0057ms | 0.0060ms |
| parse_error_handling (5 invalid string throw + catch) | cpu | 0.08ms | 0.02ms | 0.185 | 0.185 | 0.02ms | 0.02ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 0.04ms | 200ms | PASS |
| format_parse_batch (5 format + parse round-trip) | 0.03ms | 200ms | PASS |
| parse_error_handling (5 invalid string throw + catch) | 0.07ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 13024 B | 0 B | 102400 B | yes | PASS |
| format_parse_batch (5 format + parse round-trip) | -2496 B | 0 B | 102400 B | yes | PASS |
| parse_error_handling (5 invalid string throw + catch) | -760 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_provider_workflow (10 arithmetic across 4 providers)

# Perf Report — multi_provider_workflow (10 arithmetic across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0030ms |
| p50 | 0.0047ms |
| p95 | 0.0090ms |
| p99 | 0.0096ms |
| mean | 0.0048ms |
| stdev | 0.0020ms |
| min | 0.0030ms |
| max | 0.0098ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0030ms | 0.0029ms | +0.00013ms | +4.44% |
| p50 | 0.0047ms | 0.0031ms | +0.0016ms | +51.65% |
| p95 | 0.0090ms | 0.0071ms | +0.0019ms | +26.13% |
| p99 | 0.0096ms | 0.0081ms | +0.0016ms | +19.51% |
| mean | 0.0048ms | 0.0042ms | +0.00060ms | +14.35% |
| min | 0.0030ms | 0.0029ms | +0.00013ms | +4.35% |
| max | 0.0098ms | 0.0083ms | +0.0015ms | +18.09% |
| total | 0.10ms | 0.08ms | +0.01ms | +14.35% |

### format_parse_batch (5 format + parse round-trip)

# Perf Report — format_parse_batch (5 format + parse round-trip).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0058ms |
| p50 | 0.0071ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0077ms |
| stdev | 0.0020ms |
| min | 0.0057ms |
| max | 0.01ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0058ms | 0.0060ms | -0.00016ms | -2.72% |
| p50 | 0.0071ms | 0.0062ms | +0.00090ms | +14.47% |
| p95 | 0.01ms | 0.02ms | -0.0069ms | -37.37% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -46.30% |
| mean | 0.0077ms | 0.0084ms | -0.00064ms | -7.60% |
| min | 0.0057ms | 0.0058ms | -0.000042ms | -0.73% |
| max | 0.01ms | 0.02ms | -0.01ms | -48.14% |
| total | 0.15ms | 0.17ms | -0.01ms | -7.60% |

### parse_error_handling (5 invalid string throw + catch)

# Perf Report — parse_error_handling (5 invalid string throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0058ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.000041ms | -0.27% |
| p50 | 0.02ms | 0.02ms | -0.00042ms | -2.59% |
| p95 | 0.03ms | 0.03ms | -0.0024ms | -8.10% |
| p99 | 0.04ms | 0.03ms | +0.0067ms | +22.12% |
| mean | 0.02ms | 0.02ms | -0.00041ms | -2.26% |
| min | 0.02ms | 0.02ms | -0.000083ms | -0.55% |
| max | 0.04ms | 0.03ms | +0.0089ms | +29.56% |
| total | 0.36ms | 0.36ms | -0.0082ms | -2.26% |

