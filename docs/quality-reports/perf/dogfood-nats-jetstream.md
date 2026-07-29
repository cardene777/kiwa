# Perf Suite — dogfood-nats-jetstream

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveJetStream | 0.0070ms | 0.03ms | 80ms | 0.00033ms | PASS | regressed — gate 無効 (regressionGate=false) |
| driveKV | 0.0037ms | 0.0058ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveObject | 0.01ms | 0.14ms | 80ms | 0.00033ms | PASS | stable (p10 +4% (閾値未満)、 p95 +346% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveRouting | 0.01ms | 0.20ms | 80ms | 0.00033ms | PASS | stable (p10 +13% (閾値未満)、 p95 +840% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveJetStream | 0.24ms | 160ms | PASS |
| driveKV | 0.12ms | 160ms | PASS |
| driveObject | 4.52ms | 160ms | PASS |
| driveRouting | 4.70ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveJetStream | -13872 B | 0 B | 102400 B | yes | PASS |
| driveKV | -2608 B | 0 B | 102400 B | yes | PASS |
| driveObject | 2928 B | -2084 B | 102400 B | yes | PASS |
| driveRouting | -3120 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveJetStream

# Perf Report — driveJetStream.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0070ms |
| p50 | 0.0077ms |
| p95 | 0.03ms |
| p99 | 0.07ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.0065ms |
| max | 0.24ms |
| total | 2.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0070ms | 0.0055ms | +0.0015ms | +27.50% |
| p50 | 0.0077ms | 0.0064ms | +0.0013ms | +19.80% |
| p95 | 0.03ms | 0.01ms | +0.01ms | +107.04% |
| p99 | 0.07ms | 0.03ms | +0.04ms | +136.59% |
| mean | 0.01ms | 0.0075ms | +0.0043ms | +57.01% |
| min | 0.0065ms | 0.0053ms | +0.0012ms | +22.08% |
| max | 0.24ms | 0.04ms | +0.20ms | +488.32% |
| total | 2.36ms | 1.50ms | +0.86ms | +57.01% |

### driveKV

# Perf Report — driveKV.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0037ms |
| p50 | 0.0038ms |
| p95 | 0.0058ms |
| p99 | 0.02ms |
| mean | 0.0045ms |
| stdev | 0.0023ms |
| min | 0.0036ms |
| max | 0.02ms |
| total | 0.89ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0037ms | 0.0034ms | +0.00025ms | +7.29% |
| p50 | 0.0038ms | 0.0035ms | +0.00029ms | +8.22% |
| p95 | 0.0058ms | 0.0061ms | -0.00032ms | -5.16% |
| p99 | 0.02ms | 0.02ms | +0.00082ms | +5.05% |
| mean | 0.0045ms | 0.0041ms | +0.00037ms | +8.96% |
| min | 0.0036ms | 0.0034ms | +0.00021ms | +6.16% |
| max | 0.02ms | 0.02ms | -0.0022ms | -10.99% |
| total | 0.89ms | 0.82ms | +0.07ms | +8.96% |

### driveObject

# Perf Report — driveObject.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.14ms |
| p99 | 1.94ms |
| mean | 0.21ms |
| stdev | 2.19ms |
| min | 0.01ms |
| max | 30.76ms |
| total | 42.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.010ms | +0.00037ms | +3.76% |
| p50 | 0.02ms | 0.01ms | +0.0070ms | +64.98% |
| p95 | 0.14ms | 0.03ms | +0.11ms | +346.49% |
| p99 | 1.94ms | 0.04ms | +1.90ms | +4337.28% |
| mean | 0.21ms | 0.01ms | +0.20ms | +1340.30% |
| min | 0.01ms | 0.0095ms | +0.00058ms | +6.14% |
| max | 30.76ms | 0.05ms | +30.71ms | +65456.28% |
| total | 42.56ms | 2.95ms | +39.60ms | +1340.30% |

### driveRouting

# Perf Report — driveRouting.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.20ms |
| p99 | 7.90ms |
| mean | 0.32ms |
| stdev | 1.49ms |
| min | 0.01ms |
| max | 12.66ms |
| total | 63.85ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.0015ms | +12.77% |
| p50 | 0.01ms | 0.01ms | +0.0025ms | +20.01% |
| p95 | 0.20ms | 0.02ms | +0.18ms | +840.48% |
| p99 | 7.90ms | 0.03ms | +7.87ms | +26570.20% |
| mean | 0.32ms | 0.01ms | +0.31ms | +2150.79% |
| min | 0.01ms | 0.01ms | +0.0015ms | +13.15% |
| max | 12.66ms | 0.11ms | +12.55ms | +11910.60% |
| total | 63.85ms | 2.84ms | +61.02ms | +2150.79% |

