# Perf Suite — realtime

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| supabasePresenceTrack | 0.0013ms | 0.0044ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| ablyPublish | 0.00038ms | 0.00063ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| pusherSubscribeChannel | 0.00017ms | 0.00025ms | 20ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +199%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| socketioEmit | 0.00033ms | 0.00050ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| supabasePresenceTrack | 0.02ms | 40ms | PASS |
| ablyPublish | 0.03ms | 40ms | PASS |
| pusherSubscribeChannel | 0.01ms | 40ms | PASS |
| socketioEmit | 0.01ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| supabasePresenceTrack | -18112 B | -65585 B | 102400 B | yes | PASS |
| ablyPublish | 27976 B | 0 B | 102400 B | yes | PASS |
| pusherSubscribeChannel | 4104 B | 0 B | 102400 B | yes | PASS |
| socketioEmit | 49464 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### supabasePresenceTrack

# Perf Report — supabasePresenceTrack.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0013ms |
| p50 | 0.0013ms |
| p95 | 0.0044ms |
| p99 | 0.01ms |
| mean | 0.0022ms |
| stdev | 0.0044ms |
| min | 0.0012ms |
| max | 0.06ms |
| total | 0.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0013ms | 0.0013ms | -0.000042ms | -3.25% |
| p50 | 0.0013ms | 0.0016ms | -0.00029ms | -17.91% |
| p95 | 0.0044ms | 0.0061ms | -0.0017ms | -28.21% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -53.51% |
| mean | 0.0022ms | 0.0073ms | -0.0051ms | -69.65% |
| min | 0.0012ms | 0.0013ms | -0.000041ms | -3.28% |
| max | 0.06ms | 0.87ms | -0.81ms | -93.19% |
| total | 0.44ms | 1.46ms | -1.02ms | -69.65% |

### ablyPublish

# Perf Report — ablyPublish.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00038ms |
| p95 | 0.00063ms |
| p99 | 0.0020ms |
| mean | 0.00047ms |
| stdev | 0.00039ms |
| min | 0.00033ms |
| max | 0.0047ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| p99 | 0.0020ms | 0.0019ms | +0.000087ms | +4.52% |
| mean | 0.00047ms | 0.00045ms | +0.000025ms | +5.51% |
| min | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| max | 0.0047ms | 0.0023ms | +0.0023ms | +100.00% |
| total | 0.09ms | 0.09ms | +0.0049ms | +5.51% |

### pusherSubscribeChannel

# Perf Report — pusherSubscribeChannel.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00025ms |
| p99 | 0.0014ms |
| mean | 0.00024ms |
| stdev | 0.00052ms |
| min | 0.00013ms |
| max | 0.0071ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | -0.0000010ms | -0.60% |
| p50 | 0.00017ms | 0.00021ms | -0.000041ms | -19.71% |
| p95 | 0.00025ms | 0.00025ms | +5.0e-8ms | +0.02% |
| p99 | 0.0014ms | 0.0011ms | +0.00029ms | +26.91% |
| mean | 0.00024ms | 0.00028ms | -0.000036ms | -12.91% |
| min | 0.00013ms | 0.00017ms | -0.000041ms | -24.70% |
| max | 0.0071ms | 0.01ms | -0.0040ms | -36.20% |
| total | 0.05ms | 0.06ms | -0.0071ms | -12.91% |

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
| mean | 0.00045ms |
| stdev | 0.00065ms |
| min | 0.00033ms |
| max | 0.0089ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.00050ms | 0.00046ms | +0.000041ms | +8.90% |
| p99 | 0.0014ms | 0.0012ms | +0.00018ms | +14.47% |
| mean | 0.00045ms | 0.00045ms | +0.0000087ms | +1.96% |
| min | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| max | 0.0089ms | 0.0077ms | +0.0012ms | +15.06% |
| total | 0.09ms | 0.09ms | +0.0017ms | +1.96% |

