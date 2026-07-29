# Perf Suite — macos-app-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00062ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 0.03ms | 0.04ms | 100ms | 0.0012ms | PASS | regressed — gate 無効 (regressionGate=false) |
| a11y_batch (5 accessibility tree capture) | 0.0038ms | 0.0070ms | 100ms | 0.0012ms | PASS | stable (差 0.00075ms が下限 0.0012ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| notification_error_handling (5 empty title/body reject) | 0.0016ms | 0.0023ms | 100ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.10ms | 100ms | 0.0012ms | PASS | stable (p10 +11% (閾値未満)、 p95 +168% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0097ms | 0.02ms | 100ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 0.13ms | 200ms | PASS |
| a11y_batch (5 accessibility tree capture) | 0.03ms | 200ms | PASS |
| notification_error_handling (5 empty title/body reject) | 0.01ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.13ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 8688 B | -66294 B | 102400 B | yes | PASS |
| a11y_batch (5 accessibility tree capture) | 1792 B | 0 B | 102400 B | yes | PASS |
| notification_error_handling (5 empty title/body reject) | 1472 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 12664 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 16040 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### user_flow_workflow (10 interaction+screencap cycle across modes)

# Perf Report — user_flow_workflow (10 interaction+screencap cycle across modes).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.0045ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.01ms | +0.02ms | +109.42% |
| p50 | 0.03ms | 0.02ms | +0.0067ms | +27.08% |
| p95 | 0.04ms | 0.04ms | +0.000074ms | +0.19% |
| p99 | 0.05ms | 0.04ms | +0.0044ms | +10.27% |
| mean | 0.03ms | 0.03ms | +0.0079ms | +31.34% |
| min | 0.03ms | 0.01ms | +0.02ms | +111.09% |
| max | 0.05ms | 0.04ms | +0.0055ms | +12.61% |
| total | 0.66ms | 0.50ms | +0.16ms | +31.34% |

### a11y_batch (5 accessibility tree capture)

# Perf Report — a11y_batch (5 accessibility tree capture).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0038ms |
| p50 | 0.0048ms |
| p95 | 0.0070ms |
| p99 | 0.0071ms |
| mean | 0.0048ms |
| stdev | 0.00099ms |
| min | 0.0035ms |
| max | 0.0071ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0038ms | 0.0030ms | +0.00075ms | +24.52% |
| p50 | 0.0048ms | 0.0031ms | +0.0016ms | +52.33% |
| p95 | 0.0070ms | 0.0061ms | +0.00089ms | +14.71% |
| p99 | 0.0071ms | 0.0065ms | +0.00055ms | +8.37% |
| mean | 0.0048ms | 0.0035ms | +0.0012ms | +34.61% |
| min | 0.0035ms | 0.0030ms | +0.00046ms | +15.27% |
| max | 0.0071ms | 0.0066ms | +0.00046ms | +6.91% |
| total | 0.10ms | 0.07ms | +0.02ms | +34.61% |

### notification_error_handling (5 empty title/body reject)

# Perf Report — notification_error_handling (5 empty title/body reject).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0016ms |
| p50 | 0.0017ms |
| p95 | 0.0023ms |
| p99 | 0.0047ms |
| mean | 0.0019ms |
| stdev | 0.00080ms |
| min | 0.0016ms |
| max | 0.0053ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0016ms | 0.0014ms | +0.00021ms | +14.76% |
| p50 | 0.0017ms | 0.0014ms | +0.00023ms | +15.97% |
| p95 | 0.0023ms | 0.0021ms | +0.00026ms | +12.51% |
| p99 | 0.0047ms | 0.0036ms | +0.0010ms | +27.95% |
| mean | 0.0019ms | 0.0017ms | +0.00027ms | +16.25% |
| min | 0.0016ms | 0.0014ms | +0.00021ms | +14.76% |
| max | 0.0053ms | 0.0040ms | +0.0012ms | +29.92% |
| total | 0.04ms | 0.03ms | +0.0054ms | +16.25% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.10ms |
| p99 | 0.31ms |
| mean | 0.05ms |
| stdev | 0.07ms |
| min | 0.03ms |
| max | 0.36ms |
| total | 1.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.0028ms | +10.51% |
| p50 | 0.03ms | 0.03ms | +0.0041ms | +14.68% |
| p95 | 0.10ms | 0.04ms | +0.06ms | +168.13% |
| p99 | 0.31ms | 0.04ms | +0.27ms | +697.41% |
| mean | 0.05ms | 0.03ms | +0.03ms | +88.68% |
| min | 0.03ms | 0.03ms | +0.0020ms | +7.60% |
| max | 0.36ms | 0.04ms | +0.32ms | +820.53% |
| total | 1.10ms | 0.58ms | +0.51ms | +88.68% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0097ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0028ms |
| min | 0.0097ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0097ms | 0.0095ms | +0.00029ms | +3.03% |
| p50 | 0.01ms | 0.01ms | +0.00015ms | +1.41% |
| p95 | 0.02ms | 0.02ms | +0.0021ms | +13.36% |
| p99 | 0.02ms | 0.02ms | -0.00085ms | -4.51% |
| mean | 0.01ms | 0.01ms | +0.00072ms | +6.47% |
| min | 0.0097ms | 0.0094ms | +0.00029ms | +3.10% |
| max | 0.02ms | 0.02ms | -0.0016ms | -7.98% |
| total | 0.24ms | 0.22ms | +0.01ms | +6.47% |

