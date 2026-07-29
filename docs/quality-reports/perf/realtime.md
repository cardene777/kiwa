# Perf Suite — realtime

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| supabasePresenceTrack | 0.0012ms | 0.0039ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| ablyPublish | 0.00029ms | 0.00076ms | 20ms | 0.00033ms | PASS | stable (差 0.000083ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| pusherSubscribeChannel | 0.00017ms | 0.00025ms | 20ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +199%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| socketioEmit | 0.00029ms | 0.00046ms | 20ms | 0.00033ms | PASS | stable (差 0.000083ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

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
| supabasePresenceTrack | -17184 B | 0 B | 102400 B | yes | PASS |
| ablyPublish | 28320 B | 0 B | 102400 B | yes | PASS |
| pusherSubscribeChannel | 712 B | 0 B | 102400 B | yes | PASS |
| socketioEmit | 51592 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### supabasePresenceTrack

# Perf Report — supabasePresenceTrack.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0012ms |
| p50 | 0.0013ms |
| p95 | 0.0039ms |
| p99 | 0.0061ms |
| mean | 0.0020ms |
| stdev | 0.0042ms |
| min | 0.0011ms |
| max | 0.06ms |
| total | 0.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0012ms | 0.0013ms | -0.00013ms | -9.75% |
| p50 | 0.0013ms | 0.0016ms | -0.00037ms | -23.08% |
| p95 | 0.0039ms | 0.0061ms | -0.0022ms | -36.36% |
| p99 | 0.0061ms | 0.02ms | -0.02ms | -73.54% |
| mean | 0.0020ms | 0.0073ms | -0.0053ms | -72.32% |
| min | 0.0011ms | 0.0013ms | -0.00013ms | -10.00% |
| max | 0.06ms | 0.87ms | -0.81ms | -93.26% |
| total | 0.40ms | 1.46ms | -1.06ms | -72.32% |

### ablyPublish

# Perf Report — ablyPublish.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00076ms |
| p99 | 0.0030ms |
| mean | 0.00051ms |
| stdev | 0.0012ms |
| min | 0.00025ms |
| max | 0.02ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00038ms | -0.000083ms | -22.16% |
| p50 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p95 | 0.00076ms | 0.00063ms | +0.00013ms | +21.00% |
| p99 | 0.0030ms | 0.0019ms | +0.0011ms | +57.38% |
| mean | 0.00051ms | 0.00045ms | +0.000065ms | +14.56% |
| min | 0.00025ms | 0.00033ms | -0.000083ms | -24.92% |
| max | 0.02ms | 0.0023ms | +0.01ms | +575.10% |
| total | 0.10ms | 0.09ms | +0.01ms | +14.56% |

### pusherSubscribeChannel

# Perf Report — pusherSubscribeChannel.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00025ms |
| p99 | 0.0010ms |
| mean | 0.00023ms |
| stdev | 0.00050ms |
| min | 0.00013ms |
| max | 0.0071ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | -0.0000010ms | -0.60% |
| p50 | 0.00017ms | 0.00021ms | -0.000041ms | -19.71% |
| p95 | 0.00025ms | 0.00025ms | -0.0000020ms | -0.81% |
| p99 | 0.0010ms | 0.0011ms | -0.000086ms | -7.89% |
| mean | 0.00023ms | 0.00028ms | -0.000050ms | -18.03% |
| min | 0.00013ms | 0.00017ms | -0.000041ms | -24.70% |
| max | 0.0071ms | 0.01ms | -0.0040ms | -36.20% |
| total | 0.05ms | 0.06ms | -0.010ms | -18.03% |

### socketioEmit

# Perf Report — socketioEmit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00046ms |
| p99 | 0.0010ms |
| mean | 0.00039ms |
| stdev | 0.00059ms |
| min | 0.00029ms |
| max | 0.0085ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00038ms | -0.000083ms | -22.13% |
| p50 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p95 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p99 | 0.0010ms | 0.0012ms | -0.00017ms | -13.90% |
| mean | 0.00039ms | 0.00045ms | -0.000052ms | -11.60% |
| min | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| max | 0.0085ms | 0.0077ms | +0.00079ms | +10.22% |
| total | 0.08ms | 0.09ms | -0.01ms | -11.60% |

