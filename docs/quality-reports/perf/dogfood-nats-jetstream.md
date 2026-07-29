# Perf Suite — dogfood-nats-jetstream

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveJetStream | 0.0064ms | 0.02ms | 80ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveKV | 0.0036ms | 0.03ms | 80ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveObject | 0.01ms | 0.03ms | 80ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveRouting | 0.01ms | 0.02ms | 80ms | 0.00043ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| driveJetStream | cpu | 0.08ms | 0.0064ms | 0.079 | 0.082 | 0.0065ms | 0.0067ms |
| driveKV | cpu | 0.08ms | 0.0036ms | 0.044 | 0.045 | 0.0036ms | 0.0037ms |
| driveObject | cpu | 0.08ms | 0.01ms | 0.125 | 0.129 | 0.01ms | 0.01ms |
| driveRouting | cpu | 0.08ms | 0.01ms | 0.140 | 0.142 | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveJetStream | 0.27ms | 160ms | PASS |
| driveKV | 0.05ms | 160ms | PASS |
| driveObject | 0.12ms | 160ms | PASS |
| driveRouting | 0.22ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveJetStream | -6344 B | 0 B | 102400 B | yes | PASS |
| driveKV | -4656 B | 0 B | 102400 B | yes | PASS |
| driveObject | -12352 B | 59290 B | 102400 B | yes | PASS |
| driveRouting | -6800 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveJetStream

# Perf Report — driveJetStream.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0064ms |
| p50 | 0.0072ms |
| p95 | 0.02ms |
| p99 | 0.05ms |
| mean | 0.0094ms |
| stdev | 0.0075ms |
| min | 0.0060ms |
| max | 0.07ms |
| total | 1.89ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0064ms | 0.0067ms | -0.00029ms | -4.36% |
| p50 | 0.0072ms | 0.0079ms | -0.00065ms | -8.23% |
| p95 | 0.02ms | 0.09ms | -0.07ms | -75.69% |
| p99 | 0.05ms | 3.99ms | -3.94ms | -98.78% |
| mean | 0.0094ms | 0.13ms | -0.12ms | -92.52% |
| min | 0.0060ms | 0.0056ms | +0.00042ms | +7.47% |
| max | 0.07ms | 6.19ms | -6.12ms | -98.93% |
| total | 1.89ms | 25.23ms | -23.35ms | -92.52% |

### driveKV

# Perf Report — driveKV.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0036ms |
| p50 | 0.0038ms |
| p95 | 0.03ms |
| p99 | 0.06ms |
| mean | 0.0069ms |
| stdev | 0.01ms |
| min | 0.0035ms |
| max | 0.11ms |
| total | 1.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0036ms | 0.0037ms | -0.00012ms | -3.24% |
| p50 | 0.0038ms | 0.0040ms | -0.00013ms | -3.17% |
| p95 | 0.03ms | 0.03ms | -0.0052ms | -17.07% |
| p99 | 0.06ms | 1.30ms | -1.25ms | -95.73% |
| mean | 0.0069ms | 0.04ms | -0.03ms | -82.32% |
| min | 0.0035ms | 0.0036ms | -0.000083ms | -2.32% |
| max | 0.11ms | 2.51ms | -2.41ms | -95.71% |
| total | 1.38ms | 7.80ms | -6.42ms | -82.32% |

### driveObject

# Perf Report — driveObject.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.0093ms |
| min | 0.0096ms |
| max | 0.07ms |
| total | 3.00ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00046ms | -4.35% |
| p50 | 0.01ms | 0.01ms | -0.00052ms | -4.35% |
| p95 | 0.03ms | 0.06ms | -0.03ms | -45.16% |
| p99 | 0.05ms | 3.56ms | -3.51ms | -98.54% |
| mean | 0.02ms | 0.10ms | -0.08ms | -84.43% |
| min | 0.0096ms | 0.01ms | -0.00054ms | -5.32% |
| max | 0.07ms | 4.36ms | -4.28ms | -98.34% |
| total | 3.00ms | 19.28ms | -16.27ms | -84.43% |

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
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.16ms |
| total | 2.99ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00054ms | -4.61% |
| p50 | 0.01ms | 0.01ms | -0.0010ms | -7.58% |
| p95 | 0.02ms | 0.04ms | -0.02ms | -46.76% |
| p99 | 0.04ms | 0.18ms | -0.14ms | -77.45% |
| mean | 0.01ms | 0.02ms | -0.0059ms | -28.48% |
| min | 0.01ms | 0.01ms | -0.00050ms | -4.43% |
| max | 0.16ms | 0.31ms | -0.15ms | -49.50% |
| total | 2.99ms | 4.17ms | -1.19ms | -28.48% |

