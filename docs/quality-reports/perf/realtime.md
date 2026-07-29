# Perf Suite — realtime

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| supabasePresenceTrack | 0.0029ms | 0.0086ms | 20ms | 0.00033ms | PASS | regressed — gate 無効 (regressionGate=false) |
| ablyPublish | 0.00033ms | 0.00058ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| pusherSubscribeChannel | 0.00017ms | 0.00029ms | 20ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +199%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| socketioEmit | 0.00033ms | 0.00047ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| supabasePresenceTrack | 0.02ms | 40ms | PASS |
| ablyPublish | 0.01ms | 40ms | PASS |
| pusherSubscribeChannel | 0.01ms | 40ms | PASS |
| socketioEmit | 0.01ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| supabasePresenceTrack | -17808 B | 0 B | 102400 B | yes | PASS |
| ablyPublish | 29696 B | 0 B | 102400 B | yes | PASS |
| pusherSubscribeChannel | 616 B | 0 B | 102400 B | yes | PASS |
| socketioEmit | 52168 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### supabasePresenceTrack

# Perf Report — supabasePresenceTrack.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0029ms |
| p50 | 0.0031ms |
| p95 | 0.0086ms |
| p99 | 0.04ms |
| mean | 0.0045ms |
| stdev | 0.0053ms |
| min | 0.0012ms |
| max | 0.05ms |
| total | 0.89ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0029ms | 0.0013ms | +0.0016ms | +125.77% |
| p50 | 0.0031ms | 0.0016ms | +0.0015ms | +92.31% |
| p95 | 0.0086ms | 0.0061ms | +0.0025ms | +41.64% |
| p99 | 0.04ms | 0.02ms | +0.01ms | +57.21% |
| mean | 0.0045ms | 0.0073ms | -0.0029ms | -38.98% |
| min | 0.0012ms | 0.0013ms | -0.000042ms | -3.36% |
| max | 0.05ms | 0.87ms | -0.82ms | -94.54% |
| total | 0.89ms | 1.46ms | -0.57ms | -38.98% |

### ablyPublish

# Perf Report — ablyPublish.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.00058ms |
| p99 | 0.0018ms |
| mean | 0.00044ms |
| stdev | 0.00037ms |
| min | 0.00033ms |
| max | 0.0047ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.00058ms | 0.00063ms | -0.000042ms | -6.72% |
| p99 | 0.0018ms | 0.0019ms | -0.000081ms | -4.22% |
| mean | 0.00044ms | 0.00045ms | -0.0000058ms | -1.30% |
| min | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| max | 0.0047ms | 0.0023ms | +0.0023ms | +100.00% |
| total | 0.09ms | 0.09ms | -0.0012ms | -1.30% |

### pusherSubscribeChannel

# Perf Report — pusherSubscribeChannel.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00029ms |
| p99 | 0.0016ms |
| mean | 0.00028ms |
| stdev | 0.00066ms |
| min | 0.00017ms |
| max | 0.0092ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p95 | 0.00029ms | 0.00025ms | +0.000040ms | +15.85% |
| p99 | 0.0016ms | 0.0011ms | +0.00050ms | +46.14% |
| mean | 0.00028ms | 0.00028ms | +0.0000032ms | +1.15% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.0092ms | 0.01ms | -0.0019ms | -17.17% |
| total | 0.06ms | 0.06ms | +0.00064ms | +1.15% |

### socketioEmit

# Perf Report — socketioEmit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.00047ms |
| p99 | 0.0026ms |
| mean | 0.00052ms |
| stdev | 0.0012ms |
| min | 0.00033ms |
| max | 0.02ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.00047ms | 0.00046ms | +0.000010ms | +2.26% |
| p99 | 0.0026ms | 0.0012ms | +0.0014ms | +117.11% |
| mean | 0.00052ms | 0.00045ms | +0.000073ms | +16.26% |
| min | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.0077ms | +0.0074ms | +95.16% |
| total | 0.10ms | 0.09ms | +0.01ms | +16.26% |

