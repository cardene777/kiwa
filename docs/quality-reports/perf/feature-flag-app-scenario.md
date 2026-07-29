# Perf Suite — feature-flag-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 0.0093ms | 0.01ms | 100ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 0.0077ms | 0.01ms | 100ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |
| rule_error_handling (5 unknown flag + attribute mismatch) | 0.0033ms | 0.0069ms | 100ms | 0.00042ms | PASS | stable (p10 +1% (閾値未満)、 p95 +28% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 0.06ms | 200ms | PASS |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 0.04ms | 200ms | PASS |
| rule_error_handling (5 unknown flag + attribute mismatch) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 17952 B | 0 B | 102400 B | yes | PASS |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 5840 B | 0 B | 102400 B | yes | PASS |
| rule_error_handling (5 unknown flag + attribute mismatch) | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluation_workflow (10 evaluateFlag across 4 providers)

# Perf Report — evaluation_workflow (10 evaluateFlag across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0093ms |
| p50 | 0.0095ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0099ms |
| stdev | 0.0016ms |
| min | 0.0091ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0093ms | 0.0063ms | +0.0030ms | +47.24% |
| p50 | 0.0095ms | 0.0066ms | +0.0028ms | +42.76% |
| p95 | 0.01ms | 0.02ms | -0.0051ms | -30.78% |
| p99 | 0.02ms | 0.02ms | -0.0047ms | -23.27% |
| mean | 0.0099ms | 0.0088ms | +0.0012ms | +13.15% |
| min | 0.0091ms | 0.0062ms | +0.0029ms | +46.99% |
| max | 0.02ms | 0.02ms | -0.0046ms | -21.79% |
| total | 0.20ms | 0.18ms | +0.02ms | +13.15% |

### all_flags_batch (5 evaluateAllFlags with 3 flags)

# Perf Report — all_flags_batch (5 evaluateAllFlags with 3 flags).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0077ms |
| p50 | 0.0079ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0088ms |
| stdev | 0.0019ms |
| min | 0.0077ms |
| max | 0.01ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0077ms | 0.0059ms | +0.0019ms | +32.03% |
| p50 | 0.0079ms | 0.0071ms | +0.00083ms | +11.76% |
| p95 | 0.01ms | 0.02ms | -0.0048ms | -25.97% |
| p99 | 0.01ms | 0.03ms | -0.02ms | -55.95% |
| mean | 0.0088ms | 0.0095ms | -0.00069ms | -7.25% |
| min | 0.0077ms | 0.0058ms | +0.0019ms | +33.10% |
| max | 0.01ms | 0.03ms | -0.02ms | -59.98% |
| total | 0.18ms | 0.19ms | -0.01ms | -7.25% |

### rule_error_handling (5 unknown flag + attribute mismatch)

# Perf Report — rule_error_handling (5 unknown flag + attribute mismatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0033ms |
| p50 | 0.0033ms |
| p95 | 0.0069ms |
| p99 | 0.0082ms |
| mean | 0.0039ms |
| stdev | 0.0014ms |
| min | 0.0033ms |
| max | 0.0085ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0033ms | 0.0032ms | +0.000042ms | +1.29% |
| p50 | 0.0033ms | 0.0033ms | 0.00ms | 0.00% |
| p95 | 0.0069ms | 0.0054ms | +0.0015ms | +27.92% |
| p99 | 0.0082ms | 0.0067ms | +0.0015ms | +22.98% |
| mean | 0.0039ms | 0.0037ms | +0.00014ms | +3.73% |
| min | 0.0033ms | 0.0032ms | +0.000042ms | +1.29% |
| max | 0.0085ms | 0.0070ms | +0.0015ms | +22.03% |
| total | 0.08ms | 0.07ms | +0.0028ms | +3.73% |

