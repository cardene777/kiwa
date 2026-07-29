# Perf Suite — dogfood-nats-jetstream

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveJetStream | 0.0056ms | 0.01ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveKV | 0.0036ms | 0.0048ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveObject | 0.01ms | 0.03ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveRouting | 0.01ms | 0.02ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveJetStream | 0.09ms | 160ms | PASS |
| driveKV | 0.08ms | 160ms | PASS |
| driveObject | 0.15ms | 160ms | PASS |
| driveRouting | 0.18ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveJetStream | -13144 B | 0 B | 102400 B | yes | PASS |
| driveKV | -4368 B | 0 B | 102400 B | yes | PASS |
| driveObject | -13552 B | 82004 B | 102400 B | yes | PASS |
| driveRouting | -1960 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveJetStream

# Perf Report — driveJetStream.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0056ms |
| p50 | 0.0067ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0078ms |
| stdev | 0.0044ms |
| min | 0.0053ms |
| max | 0.04ms |
| total | 1.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0056ms | 0.0055ms | +0.00013ms | +2.31% |
| p50 | 0.0067ms | 0.0064ms | +0.00025ms | +3.90% |
| p95 | 0.01ms | 0.01ms | +0.00086ms | +6.55% |
| p99 | 0.03ms | 0.03ms | -0.0021ms | -6.77% |
| mean | 0.0078ms | 0.0075ms | +0.00032ms | +4.21% |
| min | 0.0053ms | 0.0053ms | -0.000041ms | -0.77% |
| max | 0.04ms | 0.04ms | +0.00058ms | +1.42% |
| total | 1.57ms | 1.50ms | +0.06ms | +4.21% |

### driveKV

# Perf Report — driveKV.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0036ms |
| p50 | 0.0037ms |
| p95 | 0.0048ms |
| p99 | 0.03ms |
| mean | 0.0051ms |
| stdev | 0.01ms |
| min | 0.0035ms |
| max | 0.15ms |
| total | 1.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0036ms | 0.0034ms | +0.00017ms | +4.86% |
| p50 | 0.0037ms | 0.0035ms | +0.00013ms | +3.53% |
| p95 | 0.0048ms | 0.0061ms | -0.0013ms | -21.22% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +79.58% |
| mean | 0.0051ms | 0.0041ms | +0.0010ms | +25.36% |
| min | 0.0035ms | 0.0034ms | +0.00013ms | +3.70% |
| max | 0.15ms | 0.02ms | +0.13ms | +647.11% |
| total | 1.03ms | 0.82ms | +0.21ms | +25.36% |

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
| stdev | 0.0096ms |
| min | 0.01ms |
| max | 0.07ms |
| total | 3.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.010ms | +0.00033ms | +3.34% |
| p50 | 0.01ms | 0.01ms | +0.00052ms | +4.87% |
| p95 | 0.03ms | 0.03ms | +0.0016ms | +5.07% |
| p99 | 0.04ms | 0.04ms | -0.00080ms | -1.83% |
| mean | 0.02ms | 0.01ms | +0.0025ms | +17.05% |
| min | 0.01ms | 0.0095ms | +0.00063ms | +6.58% |
| max | 0.07ms | 0.05ms | +0.02ms | +46.36% |
| total | 3.46ms | 2.95ms | +0.50ms | +17.05% |

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
| stdev | 0.0097ms |
| min | 0.01ms |
| max | 0.14ms |
| total | 2.89ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00013ms | -1.10% |
| p50 | 0.01ms | 0.01ms | -0.00019ms | -1.51% |
| p95 | 0.02ms | 0.02ms | -0.00015ms | -0.68% |
| p99 | 0.04ms | 0.03ms | +0.0091ms | +30.75% |
| mean | 0.01ms | 0.01ms | +0.00027ms | +1.93% |
| min | 0.01ms | 0.01ms | 0.00ms | 0.00% |
| max | 0.14ms | 0.11ms | +0.03ms | +30.05% |
| total | 2.89ms | 2.84ms | +0.05ms | +1.93% |

