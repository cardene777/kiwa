# Perf Suite — realtime

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| supabasePresenceTrack | 0.0012ms | 0.0035ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| ablyPublish | 0.00033ms | 0.00059ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| pusherSubscribeChannel | 0.00017ms | 0.00029ms | 20ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +199%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| socketioEmit | 0.00033ms | 0.00050ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| supabasePresenceTrack | 0.03ms | 40ms | PASS |
| ablyPublish | 0.01ms | 40ms | PASS |
| pusherSubscribeChannel | 0.00ms | 40ms | PASS |
| socketioEmit | 0.01ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| supabasePresenceTrack | -18408 B | -82247 B | 102400 B | yes | PASS |
| ablyPublish | 28320 B | 0 B | 102400 B | yes | PASS |
| pusherSubscribeChannel | 920 B | 0 B | 102400 B | yes | PASS |
| socketioEmit | 54808 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### supabasePresenceTrack

# Perf Report — supabasePresenceTrack.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0012ms |
| p50 | 0.0013ms |
| p95 | 0.0035ms |
| p99 | 0.0076ms |
| mean | 0.0018ms |
| stdev | 0.0014ms |
| min | 0.0011ms |
| max | 0.01ms |
| total | 0.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0012ms | 0.0013ms | -0.00013ms | -9.75% |
| p50 | 0.0013ms | 0.0016ms | -0.00037ms | -23.08% |
| p95 | 0.0035ms | 0.0061ms | -0.0026ms | -42.90% |
| p99 | 0.0076ms | 0.02ms | -0.02ms | -67.12% |
| mean | 0.0018ms | 0.0073ms | -0.0056ms | -75.99% |
| min | 0.0011ms | 0.0013ms | -0.00013ms | -10.00% |
| max | 0.01ms | 0.87ms | -0.86ms | -98.43% |
| total | 0.35ms | 1.46ms | -1.11ms | -75.99% |

### ablyPublish

# Perf Report — ablyPublish.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.00059ms |
| p99 | 0.0020ms |
| mean | 0.00044ms |
| stdev | 0.00036ms |
| min | 0.00033ms |
| max | 0.0043ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.00059ms | 0.00063ms | -0.000039ms | -6.23% |
| p99 | 0.0020ms | 0.0019ms | +0.000086ms | +4.48% |
| mean | 0.00044ms | 0.00045ms | -0.0000046ms | -1.02% |
| min | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| max | 0.0043ms | 0.0023ms | +0.0020ms | +85.73% |
| total | 0.09ms | 0.09ms | -0.00091ms | -1.02% |

### pusherSubscribeChannel

# Perf Report — pusherSubscribeChannel.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00029ms |
| p99 | 0.0020ms |
| mean | 0.00029ms |
| stdev | 0.00065ms |
| min | 0.00017ms |
| max | 0.0088ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p95 | 0.00029ms | 0.00025ms | +0.000040ms | +15.85% |
| p99 | 0.0020ms | 0.0011ms | +0.00092ms | +84.61% |
| mean | 0.00029ms | 0.00028ms | +0.000014ms | +5.09% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.0088ms | 0.01ms | -0.0024ms | -21.27% |
| total | 0.06ms | 0.06ms | +0.0028ms | +5.09% |

### socketioEmit

# Perf Report — socketioEmit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.00050ms |
| p99 | 0.0015ms |
| mean | 0.00046ms |
| stdev | 0.00067ms |
| min | 0.00033ms |
| max | 0.0091ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.00050ms | 0.00046ms | +0.000041ms | +8.90% |
| p99 | 0.0015ms | 0.0012ms | +0.00026ms | +21.28% |
| mean | 0.00046ms | 0.00045ms | +0.000011ms | +2.39% |
| min | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| max | 0.0091ms | 0.0077ms | +0.0014ms | +17.74% |
| total | 0.09ms | 0.09ms | +0.0021ms | +2.39% |

