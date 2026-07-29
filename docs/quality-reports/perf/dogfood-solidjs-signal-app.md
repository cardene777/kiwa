# Perf Suite — dogfood-solidjs-signal-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveCounter | 0.0093ms | 0.03ms | 50ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveTodos | 0.01ms | 0.03ms | 80ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveResource | 0.0041ms | 0.01ms | 100ms | 0.00034ms | PASS | regressed — gate 無効 (regressionGate=false) |
| driveSuspense | 1.28ms | 1.36ms | 150ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| driveCounter | cpu | 0.08ms | 0.0093ms | 0.116 | 0.117 | 0.0095ms | 0.0096ms |
| driveTodos | cpu | 0.08ms | 0.01ms | 0.175 | 0.181 | 0.01ms | 0.01ms |
| driveResource | cpu | 0.08ms | 0.0041ms | 0.051 | 0.040 | 0.0042ms | 0.0033ms |
| driveSuspense | cpu | 0.08ms | 1.28ms | 15.765 | 14.067 | 1.31ms | 1.17ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveCounter | 0.19ms | 100ms | PASS |
| driveTodos | 0.27ms | 160ms | PASS |
| driveResource | 0.06ms | 200ms | PASS |
| driveSuspense | 1.40ms | 300ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveCounter | -3696 B | 0 B | 102400 B | yes | PASS |
| driveTodos | 7192 B | 0 B | 102400 B | yes | PASS |
| driveResource | 2840 B | 0 B | 102400 B | yes | PASS |
| driveSuspense | -440 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveCounter

# Perf Report — driveCounter.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0093ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.10ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.0086ms |
| max | 0.26ms |
| total | 3.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0093ms | 0.0096ms | -0.00029ms | -3.01% |
| p50 | 0.01ms | 0.01ms | +0.000020ms | +0.17% |
| p95 | 0.03ms | 0.03ms | +0.0047ms | +15.53% |
| p99 | 0.10ms | 0.06ms | +0.04ms | +73.10% |
| mean | 0.02ms | 0.02ms | +0.0016ms | +10.62% |
| min | 0.0086ms | 0.0088ms | -0.00021ms | -2.35% |
| max | 0.26ms | 0.23ms | +0.03ms | +15.07% |
| total | 3.39ms | 3.07ms | +0.33ms | +10.62% |

### driveTodos

# Perf Report — driveTodos.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0079ms |
| min | 0.01ms |
| max | 0.10ms |
| total | 3.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00096ms | -6.41% |
| p50 | 0.01ms | 0.02ms | -0.0017ms | -10.77% |
| p95 | 0.03ms | 0.05ms | -0.02ms | -42.41% |
| p99 | 0.04ms | 0.10ms | -0.05ms | -54.93% |
| mean | 0.02ms | 0.02ms | -0.0040ms | -19.41% |
| min | 0.01ms | 0.01ms | -0.00071ms | -4.95% |
| max | 0.10ms | 0.15ms | -0.05ms | -35.10% |
| total | 3.28ms | 4.07ms | -0.79ms | -19.41% |

### driveResource

# Perf Report — driveResource.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0041ms |
| p50 | 0.0043ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0060ms |
| stdev | 0.0064ms |
| min | 0.0032ms |
| max | 0.06ms |
| total | 1.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0041ms | 0.0033ms | +0.00073ms | +21.96% |
| p50 | 0.0043ms | 0.0041ms | +0.00025ms | +6.12% |
| p95 | 0.01ms | 0.01ms | -0.0013ms | -8.71% |
| p99 | 0.03ms | 0.03ms | -0.0010ms | -2.94% |
| mean | 0.0060ms | 0.0057ms | +0.00031ms | +5.50% |
| min | 0.0032ms | 0.0032ms | -0.000042ms | -1.29% |
| max | 0.06ms | 0.05ms | +0.0098ms | +21.26% |
| total | 1.20ms | 1.14ms | +0.06ms | +5.50% |

### driveSuspense

# Perf Report — driveSuspense.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 1.28ms |
| p50 | 1.30ms |
| p95 | 1.36ms |
| p99 | 1.42ms |
| mean | 1.29ms |
| stdev | 0.34ms |
| min | 0.02ms |
| max | 5.14ms |
| total | 257.78ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.28ms | 1.17ms | +0.11ms | +9.43% |
| p50 | 1.30ms | 1.22ms | +0.08ms | +6.68% |
| p95 | 1.36ms | 1.57ms | -0.21ms | -13.60% |
| p99 | 1.42ms | 1.79ms | -0.37ms | -20.79% |
| mean | 1.29ms | 1.23ms | +0.06ms | +4.69% |
| min | 0.02ms | 0.03ms | -0.0090ms | -28.62% |
| max | 5.14ms | 2.13ms | +3.01ms | +141.05% |
| total | 257.78ms | 246.22ms | +11.56ms | +4.69% |

