# Perf Suite — dogfood-nats-jetstream

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveJetStream | 0.0057ms | 0.02ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveKV | 0.0036ms | 0.0092ms | 80ms | 0.00033ms | PASS | stable (p10 +5% (閾値未満)、 p95 +50% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveObject | 0.0098ms | 0.03ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveRouting | 0.01ms | 0.02ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveJetStream | 0.11ms | 160ms | PASS |
| driveKV | 0.05ms | 160ms | PASS |
| driveObject | 0.12ms | 160ms | PASS |
| driveRouting | 0.22ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveJetStream | -13840 B | 0 B | 102400 B | yes | PASS |
| driveKV | -3904 B | 0 B | 102400 B | yes | PASS |
| driveObject | -12536 B | 43142 B | 102400 B | yes | PASS |
| driveRouting | 5080 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveJetStream

# Perf Report — driveJetStream.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0057ms |
| p50 | 0.0069ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0082ms |
| stdev | 0.0045ms |
| min | 0.0053ms |
| max | 0.04ms |
| total | 1.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0057ms | 0.0055ms | +0.00021ms | +3.83% |
| p50 | 0.0069ms | 0.0064ms | +0.00050ms | +7.78% |
| p95 | 0.02ms | 0.01ms | +0.0020ms | +15.47% |
| p99 | 0.03ms | 0.03ms | -0.0019ms | -6.01% |
| mean | 0.0082ms | 0.0075ms | +0.00065ms | +8.66% |
| min | 0.0053ms | 0.0053ms | +0.000043ms | +0.81% |
| max | 0.04ms | 0.04ms | +0.0016ms | +3.86% |
| total | 1.63ms | 1.50ms | +0.13ms | +8.66% |

### driveKV

# Perf Report — driveKV.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0036ms |
| p50 | 0.0037ms |
| p95 | 0.0092ms |
| p99 | 0.02ms |
| mean | 0.0049ms |
| stdev | 0.0086ms |
| min | 0.0035ms |
| max | 0.12ms |
| total | 0.99ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0036ms | 0.0034ms | +0.00017ms | +4.86% |
| p50 | 0.0037ms | 0.0035ms | +0.00013ms | +3.53% |
| p95 | 0.0092ms | 0.0061ms | +0.0031ms | +49.98% |
| p99 | 0.02ms | 0.02ms | +0.0061ms | +37.45% |
| mean | 0.0049ms | 0.0041ms | +0.00083ms | +20.18% |
| min | 0.0035ms | 0.0034ms | +0.00013ms | +3.70% |
| max | 0.12ms | 0.02ms | +0.10ms | +496.07% |
| total | 0.99ms | 0.82ms | +0.17ms | +20.18% |

### driveObject

# Perf Report — driveObject.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0098ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0096ms |
| max | 0.13ms |
| total | 2.97ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0098ms | 0.010ms | -0.00013ms | -1.26% |
| p50 | 0.01ms | 0.01ms | -0.00021ms | -1.95% |
| p95 | 0.03ms | 0.03ms | -0.0018ms | -6.04% |
| p99 | 0.04ms | 0.04ms | -0.0022ms | -5.10% |
| mean | 0.01ms | 0.01ms | +0.000090ms | +0.61% |
| min | 0.0096ms | 0.0095ms | +0.00013ms | +1.32% |
| max | 0.13ms | 0.05ms | +0.08ms | +181.08% |
| total | 2.97ms | 2.95ms | +0.02ms | +0.61% |

### driveRouting

# Perf Report — driveRouting.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.0085ms |
| min | 0.01ms |
| max | 0.11ms |
| total | 2.92ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00029ms | -2.56% |
| p50 | 0.01ms | 0.01ms | -0.00021ms | -1.68% |
| p95 | 0.02ms | 0.02ms | +0.0010ms | +4.81% |
| p99 | 0.04ms | 0.03ms | +0.01ms | +40.86% |
| mean | 0.01ms | 0.01ms | +0.00040ms | +2.82% |
| min | 0.01ms | 0.01ms | -0.00021ms | -1.89% |
| max | 0.11ms | 0.11ms | +0.0052ms | +4.90% |
| total | 2.92ms | 2.84ms | +0.08ms | +2.82% |

