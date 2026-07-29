# Perf Suite — dogfood-nats-jetstream

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveJetStream | 0.0062ms | 0.02ms | 80ms | 0.00033ms | PASS | stable (p10 +14% (閾値未満)、 p95 +41% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveKV | 0.0035ms | 0.0062ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveObject | 0.0099ms | 0.03ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveRouting | 0.01ms | 0.02ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveJetStream | 0.13ms | 160ms | PASS |
| driveKV | 0.06ms | 160ms | PASS |
| driveObject | 0.12ms | 160ms | PASS |
| driveRouting | 0.27ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveJetStream | -13872 B | 0 B | 102400 B | yes | PASS |
| driveKV | -4368 B | 0 B | 102400 B | yes | PASS |
| driveObject | -13456 B | 39923 B | 102400 B | yes | PASS |
| driveRouting | -3048 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveJetStream

# Perf Report — driveJetStream.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0062ms |
| p50 | 0.0071ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0088ms |
| stdev | 0.0063ms |
| min | 0.0054ms |
| max | 0.07ms |
| total | 1.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0062ms | 0.0055ms | +0.00079ms | +14.43% |
| p50 | 0.0071ms | 0.0064ms | +0.00071ms | +11.03% |
| p95 | 0.02ms | 0.01ms | +0.0054ms | +41.32% |
| p99 | 0.03ms | 0.03ms | +0.00038ms | +1.21% |
| mean | 0.0088ms | 0.0075ms | +0.0013ms | +17.12% |
| min | 0.0054ms | 0.0053ms | +0.000084ms | +1.59% |
| max | 0.07ms | 0.04ms | +0.03ms | +65.07% |
| total | 1.76ms | 1.50ms | +0.26ms | +17.12% |

### driveKV

# Perf Report — driveKV.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0035ms |
| p50 | 0.0037ms |
| p95 | 0.0062ms |
| p99 | 0.02ms |
| mean | 0.0042ms |
| stdev | 0.0023ms |
| min | 0.0035ms |
| max | 0.02ms |
| total | 0.84ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0035ms | 0.0034ms | +0.00013ms | +3.66% |
| p50 | 0.0037ms | 0.0035ms | +0.00013ms | +3.53% |
| p95 | 0.0062ms | 0.0061ms | +0.000098ms | +1.60% |
| p99 | 0.02ms | 0.02ms | +0.0011ms | +6.90% |
| mean | 0.0042ms | 0.0041ms | +0.00012ms | +2.92% |
| min | 0.0035ms | 0.0034ms | +0.000083ms | +2.46% |
| max | 0.02ms | 0.02ms | +0.0017ms | +8.51% |
| total | 0.84ms | 0.82ms | +0.02ms | +2.92% |

### driveObject

# Perf Report — driveObject.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0099ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.0095ms |
| min | 0.0094ms |
| max | 0.11ms |
| total | 2.92ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0099ms | 0.010ms | -0.000084ms | -0.84% |
| p50 | 0.01ms | 0.01ms | -0.00040ms | -3.70% |
| p95 | 0.03ms | 0.03ms | -0.0024ms | -7.75% |
| p99 | 0.04ms | 0.04ms | -0.0017ms | -3.99% |
| mean | 0.01ms | 0.01ms | -0.00018ms | -1.22% |
| min | 0.0094ms | 0.0095ms | -0.00013ms | -1.32% |
| max | 0.11ms | 0.05ms | +0.06ms | +126.82% |
| total | 2.92ms | 2.95ms | -0.04ms | -1.22% |

### driveRouting

# Perf Report — driveRouting.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.14ms |
| total | 3.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00017ms | +1.46% |
| p50 | 0.01ms | 0.01ms | +0.00017ms | +1.34% |
| p95 | 0.02ms | 0.02ms | +0.0016ms | +7.21% |
| p99 | 0.05ms | 0.03ms | +0.02ms | +74.95% |
| mean | 0.02ms | 0.01ms | +0.0011ms | +7.96% |
| min | 0.01ms | 0.01ms | +0.00012ms | +1.12% |
| max | 0.14ms | 0.11ms | +0.04ms | +34.68% |
| total | 3.06ms | 2.84ms | +0.23ms | +7.96% |

