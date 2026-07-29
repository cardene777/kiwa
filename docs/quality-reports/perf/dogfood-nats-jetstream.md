# Perf Suite — dogfood-nats-jetstream

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveJetStream | 0.0064ms | 0.02ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveKV | 0.0037ms | 0.02ms | 80ms | 0.00033ms | PASS | stable (p10 +7% (閾値未満)、 p95 +247% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveObject | 0.01ms | 0.05ms | 80ms | 0.00033ms | PASS | stable (p10 +4% (閾値未満)、 p95 +74% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveRouting | 0.01ms | 0.03ms | 80ms | 0.00033ms | PASS | stable (p10 +3% (閾値未満)、 p95 +29% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveJetStream | 0.38ms | 160ms | PASS |
| driveKV | 0.05ms | 160ms | PASS |
| driveObject | 0.25ms | 160ms | PASS |
| driveRouting | 0.31ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveJetStream | -13672 B | 0 B | 102400 B | yes | PASS |
| driveKV | -5088 B | 0 B | 102400 B | yes | PASS |
| driveObject | -13776 B | 75530 B | 102400 B | yes | PASS |
| driveRouting | -1432 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveJetStream

# Perf Report — driveJetStream.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0064ms |
| p50 | 0.0068ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0082ms |
| stdev | 0.0046ms |
| min | 0.0060ms |
| max | 0.05ms |
| total | 1.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0064ms | 0.0055ms | +0.00092ms | +16.80% |
| p50 | 0.0068ms | 0.0064ms | +0.00042ms | +6.50% |
| p95 | 0.02ms | 0.01ms | +0.0026ms | +19.50% |
| p99 | 0.03ms | 0.03ms | -0.0020ms | -6.39% |
| mean | 0.0082ms | 0.0075ms | +0.00067ms | +8.87% |
| min | 0.0060ms | 0.0053ms | +0.00075ms | +14.19% |
| max | 0.05ms | 0.04ms | +0.0050ms | +12.08% |
| total | 1.64ms | 1.50ms | +0.13ms | +8.87% |

### driveKV

# Perf Report — driveKV.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0037ms |
| p50 | 0.0041ms |
| p95 | 0.02ms |
| p99 | 0.05ms |
| mean | 0.0072ms |
| stdev | 0.01ms |
| min | 0.0035ms |
| max | 0.18ms |
| total | 1.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0037ms | 0.0034ms | +0.00025ms | +7.32% |
| p50 | 0.0041ms | 0.0035ms | +0.00054ms | +15.27% |
| p95 | 0.02ms | 0.0061ms | +0.02ms | +247.11% |
| p99 | 0.05ms | 0.02ms | +0.03ms | +197.81% |
| mean | 0.0072ms | 0.0041ms | +0.0031ms | +75.78% |
| min | 0.0035ms | 0.0034ms | +0.000083ms | +2.46% |
| max | 0.18ms | 0.02ms | +0.16ms | +773.87% |
| total | 1.44ms | 0.82ms | +0.62ms | +75.78% |

### driveObject

# Perf Report — driveObject.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.05ms |
| p99 | 0.09ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.13ms |
| total | 4.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.010ms | +0.00037ms | +3.76% |
| p50 | 0.01ms | 0.01ms | +0.0027ms | +25.49% |
| p95 | 0.05ms | 0.03ms | +0.02ms | +74.17% |
| p99 | 0.09ms | 0.04ms | +0.05ms | +108.78% |
| mean | 0.02ms | 0.01ms | +0.0057ms | +38.27% |
| min | 0.01ms | 0.0095ms | +0.00054ms | +5.69% |
| max | 0.13ms | 0.05ms | +0.08ms | +173.09% |
| total | 4.09ms | 2.95ms | +1.13ms | +38.27% |

### driveRouting

# Perf Report — driveRouting.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.15ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.18ms |
| total | 3.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00037ms | +3.28% |
| p50 | 0.01ms | 0.01ms | +0.00052ms | +4.21% |
| p95 | 0.03ms | 0.02ms | +0.0063ms | +29.34% |
| p99 | 0.15ms | 0.03ms | +0.12ms | +394.04% |
| mean | 0.02ms | 0.01ms | +0.0040ms | +28.20% |
| min | 0.01ms | 0.01ms | +0.00046ms | +4.13% |
| max | 0.18ms | 0.11ms | +0.07ms | +69.75% |
| total | 3.64ms | 2.84ms | +0.80ms | +28.20% |

