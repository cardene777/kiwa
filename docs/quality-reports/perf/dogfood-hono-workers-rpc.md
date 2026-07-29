# Perf Suite — dogfood-hono-workers-rpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveRoute | 0.02ms | 0.04ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveKv | 0.02ms | 0.11ms | 80ms | 0.00033ms | PASS | stable (p10 +7% (閾値未満)、 p95 +147% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveD1 | 0.01ms | 0.03ms | 80ms | 0.00033ms | PASS | stable (p10 +4% (閾値未満)、 p95 +45% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveR2 | 0.01ms | 0.06ms | 100ms | 0.00033ms | PASS | stable (p10 +3% (閾値未満)、 p95 +250% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveExecutionCtx | 0.0083ms | 0.01ms | 50ms | 0.00033ms | PASS | stable (p10 +2% (閾値未満)、 p95 +25% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveRoute | 1.06ms | 160ms | PASS |
| driveKv | 0.83ms | 160ms | PASS |
| driveD1 | 0.26ms | 160ms | PASS |
| driveR2 | 0.60ms | 200ms | PASS |
| driveExecutionCtx | 0.15ms | 100ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveRoute | -2392 B | 0 B | 102400 B | yes | PASS |
| driveKv | -50584 B | 0 B | 102400 B | yes | PASS |
| driveD1 | 1504 B | 0 B | 102400 B | yes | PASS |
| driveR2 | 5960 B | 0 B | 102400 B | yes | PASS |
| driveExecutionCtx | -320 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveRoute

# Perf Report — driveRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.09ms |
| mean | 0.03ms |
| stdev | 0.03ms |
| min | 0.02ms |
| max | 0.44ms |
| total | 5.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0033ms | -16.34% |
| p50 | 0.02ms | 0.02ms | -0.0013ms | -5.58% |
| p95 | 0.04ms | 0.04ms | +0.0026ms | +6.08% |
| p99 | 0.09ms | 0.06ms | +0.03ms | +42.45% |
| mean | 0.03ms | 0.03ms | -0.0022ms | -7.45% |
| min | 0.02ms | 0.02ms | -0.0027ms | -14.73% |
| max | 0.44ms | 0.78ms | -0.34ms | -43.66% |
| total | 5.41ms | 5.84ms | -0.44ms | -7.45% |

### driveKv

# Perf Report — driveKv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.11ms |
| p99 | 0.18ms |
| mean | 0.03ms |
| stdev | 0.03ms |
| min | 0.02ms |
| max | 0.25ms |
| total | 6.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.0011ms | +6.52% |
| p50 | 0.02ms | 0.02ms | +0.00031ms | +1.64% |
| p95 | 0.11ms | 0.04ms | +0.06ms | +147.24% |
| p99 | 0.18ms | 0.05ms | +0.13ms | +250.09% |
| mean | 0.03ms | 0.02ms | +0.0082ms | +35.66% |
| min | 0.02ms | 0.02ms | +0.00029ms | +1.76% |
| max | 0.25ms | 0.07ms | +0.18ms | +262.53% |
| total | 6.22ms | 4.58ms | +1.63ms | +35.66% |

### driveD1

# Perf Report — driveD1.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.08ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.22ms |
| total | 3.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00058ms | +4.48% |
| p50 | 0.01ms | 0.01ms | +0.00065ms | +4.74% |
| p95 | 0.03ms | 0.02ms | +0.0087ms | +44.58% |
| p99 | 0.08ms | 0.03ms | +0.05ms | +201.35% |
| mean | 0.02ms | 0.01ms | +0.0037ms | +26.05% |
| min | 0.01ms | 0.01ms | +0.00037ms | +2.97% |
| max | 0.22ms | 0.05ms | +0.18ms | +389.04% |
| total | 3.59ms | 2.85ms | +0.74ms | +26.05% |

### driveR2

# Perf Report — driveR2.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.06ms |
| p99 | 0.10ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.23ms |
| total | 4.93ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00037ms | +2.60% |
| p50 | 0.02ms | 0.02ms | +0.0026ms | +16.71% |
| p95 | 0.06ms | 0.02ms | +0.04ms | +250.34% |
| p99 | 0.10ms | 0.03ms | +0.07ms | +208.78% |
| mean | 0.02ms | 0.02ms | +0.0088ms | +55.18% |
| min | 0.01ms | 0.01ms | +0.000042ms | +0.30% |
| max | 0.23ms | 0.04ms | +0.19ms | +527.70% |
| total | 4.93ms | 3.18ms | +1.75ms | +55.18% |

### driveExecutionCtx

# Perf Report — driveExecutionCtx.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0083ms |
| p50 | 0.0090ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0097ms |
| stdev | 0.0047ms |
| min | 0.0081ms |
| max | 0.07ms |
| total | 1.94ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0083ms | 0.0081ms | +0.00013ms | +1.54% |
| p50 | 0.0090ms | 0.0090ms | +0.000084ms | +0.94% |
| p95 | 0.01ms | 0.01ms | +0.0025ms | +24.60% |
| p99 | 0.02ms | 0.01ms | +0.0062ms | +43.14% |
| mean | 0.0097ms | 0.0090ms | +0.00070ms | +7.72% |
| min | 0.0081ms | 0.0079ms | +0.00017ms | +2.12% |
| max | 0.07ms | 0.02ms | +0.05ms | +312.74% |
| total | 1.94ms | 1.80ms | +0.14ms | +7.72% |

