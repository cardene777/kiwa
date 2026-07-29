# Perf Suite — realtime

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| supabasePresenceTrack | 0.0012ms | 0.0034ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| ablyPublish | 0.00033ms | 0.00059ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| pusherSubscribeChannel | 0.00017ms | 0.00025ms | 20ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +199%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| socketioEmit | 0.00033ms | 0.00050ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| supabasePresenceTrack | 0.02ms | 40ms | PASS |
| ablyPublish | 0.01ms | 40ms | PASS |
| pusherSubscribeChannel | 0.00ms | 40ms | PASS |
| socketioEmit | 0.01ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| supabasePresenceTrack | -18304 B | 0 B | 102400 B | yes | PASS |
| ablyPublish | 29696 B | 0 B | 102400 B | yes | PASS |
| pusherSubscribeChannel | 616 B | 0 B | 102400 B | yes | PASS |
| socketioEmit | 45840 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### supabasePresenceTrack

# Perf Report — supabasePresenceTrack.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0012ms |
| p50 | 0.0013ms |
| p95 | 0.0034ms |
| p99 | 0.0072ms |
| mean | 0.0018ms |
| stdev | 0.0014ms |
| min | 0.0011ms |
| max | 0.01ms |
| total | 0.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0012ms | 0.0013ms | -0.00012ms | -9.67% |
| p50 | 0.0013ms | 0.0016ms | -0.00037ms | -23.08% |
| p95 | 0.0034ms | 0.0061ms | -0.0027ms | -44.02% |
| p99 | 0.0072ms | 0.02ms | -0.02ms | -68.91% |
| mean | 0.0018ms | 0.0073ms | -0.0056ms | -75.90% |
| min | 0.0011ms | 0.0013ms | -0.00013ms | -10.00% |
| max | 0.01ms | 0.87ms | -0.86ms | -98.29% |
| total | 0.35ms | 1.46ms | -1.11ms | -75.90% |

### ablyPublish

# Perf Report — ablyPublish.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00033ms |
| p95 | 0.00059ms |
| p99 | 0.0031ms |
| mean | 0.00049ms |
| stdev | 0.00090ms |
| min | 0.00029ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p50 | 0.00033ms | 0.00038ms | -0.000041ms | -10.93% |
| p95 | 0.00059ms | 0.00063ms | -0.000033ms | -5.23% |
| p99 | 0.0031ms | 0.0019ms | +0.0012ms | +60.66% |
| mean | 0.00049ms | 0.00045ms | +0.000046ms | +10.31% |
| min | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| max | 0.01ms | 0.0023ms | +0.0095ms | +407.24% |
| total | 0.10ms | 0.09ms | +0.0092ms | +10.31% |

### pusherSubscribeChannel

# Perf Report — pusherSubscribeChannel.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00025ms |
| p99 | 0.0012ms |
| mean | 0.00023ms |
| stdev | 0.00036ms |
| min | 0.00013ms |
| max | 0.0050ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | -0.0000010ms | -0.60% |
| p50 | 0.00017ms | 0.00021ms | -0.000041ms | -19.71% |
| p95 | 0.00025ms | 0.00025ms | -0.0000020ms | -0.81% |
| p99 | 0.0012ms | 0.0011ms | +0.00012ms | +11.49% |
| mean | 0.00023ms | 0.00028ms | -0.000049ms | -17.59% |
| min | 0.00013ms | 0.00017ms | -0.000041ms | -24.70% |
| max | 0.0050ms | 0.01ms | -0.0062ms | -55.60% |
| total | 0.05ms | 0.06ms | -0.0097ms | -17.59% |

### socketioEmit

# Perf Report — socketioEmit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.00050ms |
| p99 | 0.0014ms |
| mean | 0.00046ms |
| stdev | 0.00068ms |
| min | 0.00033ms |
| max | 0.0094ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00038ms | -0.000041ms | -10.96% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.00050ms | 0.00046ms | +0.000039ms | +8.45% |
| p99 | 0.0014ms | 0.0012ms | +0.00018ms | +14.54% |
| mean | 0.00046ms | 0.00045ms | +0.000011ms | +2.43% |
| min | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| max | 0.0094ms | 0.0077ms | +0.0017ms | +21.51% |
| total | 0.09ms | 0.09ms | +0.0022ms | +2.43% |

