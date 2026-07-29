# Perf Suite — observability

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| collectRunHistory | 0.02ms | 0.03ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| detectFlaky | 0.0056ms | 0.02ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| checkThresholds | 0.00038ms | 0.00067ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderDashboard | 0.0060ms | 0.0069ms | 5ms | 0.00033ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| collectRunHistory | 0.21ms | 10ms | PASS |
| detectFlaky | 0.07ms | 10ms | PASS |
| checkThresholds | 0.01ms | 10ms | PASS |
| renderDashboard | 0.03ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| collectRunHistory | 3344 B | 0 B | 102400 B | yes | PASS |
| detectFlaky | 536 B | 0 B | 102400 B | yes | PASS |
| checkThresholds | 2656 B | 0 B | 102400 B | yes | PASS |
| renderDashboard | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### collectRunHistory

# Perf Report — collectRunHistory.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.27ms |
| total | 4.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0025ms | -13.80% |
| p50 | 0.02ms | 0.02ms | -0.0017ms | -8.87% |
| p95 | 0.03ms | 0.03ms | -0.0051ms | -15.56% |
| p99 | 0.05ms | 0.04ms | +0.0020ms | +4.60% |
| mean | 0.02ms | 0.02ms | -0.0039ms | -15.93% |
| min | 0.02ms | 0.02ms | -0.0013ms | -7.82% |
| max | 0.27ms | 0.51ms | -0.24ms | -46.78% |
| total | 4.09ms | 4.87ms | -0.78ms | -15.93% |

### detectFlaky

# Perf Report — detectFlaky.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0056ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0060ms |
| min | 0.0055ms |
| max | 0.04ms |
| total | 2.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0056ms | 0.0055ms | +0.000042ms | +0.76% |
| p50 | 0.02ms | 0.0057ms | +0.0096ms | +169.00% |
| p95 | 0.02ms | 0.02ms | +0.0031ms | +18.71% |
| p99 | 0.03ms | 0.03ms | -0.00011ms | -0.43% |
| mean | 0.01ms | 0.0099ms | +0.0017ms | +17.36% |
| min | 0.0055ms | 0.0055ms | +0.000042ms | +0.77% |
| max | 0.04ms | 0.04ms | -0.0011ms | -2.57% |
| total | 2.32ms | 1.97ms | +0.34ms | +17.36% |

### checkThresholds

# Perf Report — checkThresholds.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00067ms |
| p99 | 0.0031ms |
| mean | 0.00051ms |
| stdev | 0.00067ms |
| min | 0.00038ms |
| max | 0.0073ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| p50 | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| p95 | 0.00067ms | 0.00071ms | -0.000041ms | -5.78% |
| p99 | 0.0031ms | 0.0030ms | +0.000072ms | +2.38% |
| mean | 0.00051ms | 0.00053ms | -0.000019ms | -3.64% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.0073ms | 0.0088ms | -0.0015ms | -17.47% |
| total | 0.10ms | 0.11ms | -0.0039ms | -3.64% |

### renderDashboard

# Perf Report — renderDashboard.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0060ms |
| p50 | 0.0061ms |
| p95 | 0.0069ms |
| p99 | 0.02ms |
| mean | 0.0064ms |
| stdev | 0.0019ms |
| min | 0.0021ms |
| max | 0.02ms |
| total | 1.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0060ms | 0.0020ms | +0.0039ms | +191.77% |
| p50 | 0.0061ms | 0.0047ms | +0.0014ms | +28.95% |
| p95 | 0.0069ms | 0.0077ms | -0.00083ms | -10.82% |
| p99 | 0.02ms | 0.02ms | +0.00025ms | +1.37% |
| mean | 0.0064ms | 0.0048ms | +0.0016ms | +32.68% |
| min | 0.0021ms | 0.0020ms | +0.00017ms | +8.53% |
| max | 0.02ms | 0.03ms | -0.0072ms | -23.80% |
| total | 1.28ms | 0.96ms | +0.32ms | +32.68% |

