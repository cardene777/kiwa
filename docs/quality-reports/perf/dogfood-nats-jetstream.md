# Perf Suite — dogfood-nats-jetstream

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveJetStream | 0.0063ms | 0.01ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveKV | 0.0035ms | 0.0092ms | 80ms | 0.00033ms | PASS | stable (p10 +1% (閾値未満)、 p95 +50% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveObject | 0.01ms | 0.03ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveRouting | 0.01ms | 0.02ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveJetStream | 0.11ms | 160ms | PASS |
| driveKV | 0.06ms | 160ms | PASS |
| driveObject | 0.18ms | 160ms | PASS |
| driveRouting | 0.18ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveJetStream | -13744 B | 0 B | 102400 B | yes | PASS |
| driveKV | -4368 B | 0 B | 102400 B | yes | PASS |
| driveObject | -12328 B | 99250 B | 102400 B | yes | PASS |
| driveRouting | -1928 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveJetStream

# Perf Report — driveJetStream.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0063ms |
| p50 | 0.0069ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0085ms |
| stdev | 0.0070ms |
| min | 0.0053ms |
| max | 0.09ms |
| total | 1.69ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0063ms | 0.0055ms | +0.00079ms | +14.51% |
| p50 | 0.0069ms | 0.0064ms | +0.00050ms | +7.78% |
| p95 | 0.01ms | 0.01ms | +0.0017ms | +12.65% |
| p99 | 0.03ms | 0.03ms | -0.0011ms | -3.57% |
| mean | 0.0085ms | 0.0075ms | +0.00094ms | +12.55% |
| min | 0.0053ms | 0.0053ms | +0.0000010ms | +0.02% |
| max | 0.09ms | 0.04ms | +0.04ms | +108.83% |
| total | 1.69ms | 1.50ms | +0.19ms | +12.55% |

### driveKV

# Perf Report — driveKV.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0035ms |
| p50 | 0.0036ms |
| p95 | 0.0092ms |
| p99 | 0.02ms |
| mean | 0.0049ms |
| stdev | 0.0082ms |
| min | 0.0034ms |
| max | 0.10ms |
| total | 0.99ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0035ms | 0.0034ms | +0.000041ms | +1.20% |
| p50 | 0.0036ms | 0.0035ms | +0.000083ms | +2.34% |
| p95 | 0.0092ms | 0.0061ms | +0.0031ms | +50.27% |
| p99 | 0.02ms | 0.02ms | +0.0052ms | +31.99% |
| mean | 0.0049ms | 0.0041ms | +0.00084ms | +20.54% |
| min | 0.0034ms | 0.0034ms | 0.00ms | 0.00% |
| max | 0.10ms | 0.02ms | +0.08ms | +420.55% |
| total | 0.99ms | 0.82ms | +0.17ms | +20.54% |

### driveObject

# Perf Report — driveObject.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.0097ms |
| max | 0.15ms |
| total | 3.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.010ms | +0.00012ms | +1.20% |
| p50 | 0.01ms | 0.01ms | +0.00033ms | +3.11% |
| p95 | 0.03ms | 0.03ms | -0.00080ms | -2.62% |
| p99 | 0.04ms | 0.04ms | -0.0012ms | -2.81% |
| mean | 0.02ms | 0.01ms | +0.00049ms | +3.33% |
| min | 0.0097ms | 0.0095ms | +0.00021ms | +2.19% |
| max | 0.15ms | 0.05ms | +0.10ms | +219.71% |
| total | 3.05ms | 2.95ms | +0.10ms | +3.33% |

### driveRouting

# Perf Report — driveRouting.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.14ms |
| total | 3.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00012ms | +1.05% |
| p50 | 0.01ms | 0.01ms | +0.00040ms | +3.19% |
| p95 | 0.02ms | 0.02ms | +0.0024ms | +11.36% |
| p99 | 0.03ms | 0.03ms | +0.0032ms | +10.65% |
| mean | 0.02ms | 0.01ms | +0.0010ms | +7.33% |
| min | 0.01ms | 0.01ms | +0.000083ms | +0.75% |
| max | 0.14ms | 0.11ms | +0.03ms | +31.59% |
| total | 3.04ms | 2.84ms | +0.21ms | +7.33% |

