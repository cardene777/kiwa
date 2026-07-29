# Perf Suite — feature-flag-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 0.0062ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 0.0066ms | 0.01ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| rule_error_handling (5 unknown flag + attribute mismatch) | 0.0031ms | 0.0067ms | 100ms | 0.00049ms | PASS | stable (p10 -5% (閾値未満)、 p95 +25% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 0.07ms | 200ms | PASS |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 0.04ms | 200ms | PASS |
| rule_error_handling (5 unknown flag + attribute mismatch) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 19680 B | 0 B | 102400 B | yes | PASS |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 9696 B | 0 B | 102400 B | yes | PASS |
| rule_error_handling (5 unknown flag + attribute mismatch) | -360 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluation_workflow (10 evaluateFlag across 4 providers)

# Perf Report — evaluation_workflow (10 evaluateFlag across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0062ms |
| p50 | 0.0083ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0098ms |
| stdev | 0.0041ms |
| min | 0.0062ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0062ms | 0.0063ms | -0.000087ms | -1.38% |
| p50 | 0.0083ms | 0.0066ms | +0.0017ms | +25.15% |
| p95 | 0.02ms | 0.02ms | +0.00059ms | +3.51% |
| p99 | 0.02ms | 0.02ms | -0.0013ms | -6.36% |
| mean | 0.0098ms | 0.0088ms | +0.00096ms | +10.92% |
| min | 0.0062ms | 0.0062ms | -0.000041ms | -0.66% |
| max | 0.02ms | 0.02ms | -0.0018ms | -8.32% |
| total | 0.20ms | 0.18ms | +0.02ms | +10.92% |

### all_flags_batch (5 evaluateAllFlags with 3 flags)

# Perf Report — all_flags_batch (5 evaluateAllFlags with 3 flags).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0066ms |
| p50 | 0.0067ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0074ms |
| stdev | 0.0016ms |
| min | 0.0065ms |
| max | 0.01ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0066ms | 0.0059ms | +0.00072ms | +12.21% |
| p50 | 0.0067ms | 0.0071ms | -0.00038ms | -5.30% |
| p95 | 0.01ms | 0.02ms | -0.0070ms | -37.63% |
| p99 | 0.01ms | 0.03ms | -0.02ms | -61.14% |
| mean | 0.0074ms | 0.0095ms | -0.0022ms | -22.59% |
| min | 0.0065ms | 0.0058ms | +0.00071ms | +12.24% |
| max | 0.01ms | 0.03ms | -0.02ms | -64.30% |
| total | 0.15ms | 0.19ms | -0.04ms | -22.59% |

### rule_error_handling (5 unknown flag + attribute mismatch)

# Perf Report — rule_error_handling (5 unknown flag + attribute mismatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0031ms |
| p50 | 0.0032ms |
| p95 | 0.0067ms |
| p99 | 0.0072ms |
| mean | 0.0037ms |
| stdev | 0.0012ms |
| min | 0.0030ms |
| max | 0.0073ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0031ms | 0.0032ms | -0.00017ms | -5.11% |
| p50 | 0.0032ms | 0.0033ms | -0.00017ms | -4.98% |
| p95 | 0.0067ms | 0.0054ms | +0.0014ms | +25.30% |
| p99 | 0.0072ms | 0.0067ms | +0.00051ms | +7.58% |
| mean | 0.0037ms | 0.0037ms | -0.000070ms | -1.88% |
| min | 0.0030ms | 0.0032ms | -0.00021ms | -6.40% |
| max | 0.0073ms | 0.0070ms | +0.00029ms | +4.17% |
| total | 0.07ms | 0.07ms | -0.0014ms | -1.88% |

