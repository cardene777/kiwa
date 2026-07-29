# Perf Suite — realtime

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| supabasePresenceTrack | 0.0012ms | 0.0039ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| ablyPublish | 0.00029ms | 0.0011ms | 20ms | 0.00033ms | PASS | stable (差 0.000083ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| pusherSubscribeChannel | 0.00017ms | 0.00025ms | 20ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +199%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| socketioEmit | 0.00029ms | 0.00042ms | 20ms | 0.00033ms | PASS | stable (差 0.000084ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

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
| supabasePresenceTrack | -18448 B | 0 B | 102400 B | yes | PASS |
| ablyPublish | 28320 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.0039ms |
| p99 | 0.0066ms |
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
| p95 | 0.0039ms | 0.0061ms | -0.0022ms | -36.10% |
| p99 | 0.0066ms | 0.02ms | -0.02ms | -71.24% |
| mean | 0.0018ms | 0.0073ms | -0.0056ms | -76.01% |
| min | 0.0011ms | 0.0013ms | -0.00013ms | -10.00% |
| max | 0.01ms | 0.87ms | -0.86ms | -98.43% |
| total | 0.35ms | 1.46ms | -1.11ms | -76.01% |

### ablyPublish

# Perf Report — ablyPublish.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.0011ms |
| p99 | 0.0045ms |
| mean | 0.00084ms |
| stdev | 0.0052ms |
| min | 0.00025ms |
| max | 0.07ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00038ms | -0.000083ms | -22.13% |
| p50 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p95 | 0.0011ms | 0.00063ms | +0.00043ms | +69.05% |
| p99 | 0.0045ms | 0.0019ms | +0.0026ms | +134.08% |
| mean | 0.00084ms | 0.00045ms | +0.00039ms | +88.15% |
| min | 0.00025ms | 0.00033ms | -0.000083ms | -24.92% |
| max | 0.07ms | 0.0023ms | +0.07ms | +3032.62% |
| total | 0.17ms | 0.09ms | +0.08ms | +88.15% |

### pusherSubscribeChannel

# Perf Report — pusherSubscribeChannel.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00025ms |
| p99 | 0.0011ms |
| mean | 0.00023ms |
| stdev | 0.00041ms |
| min | 0.00013ms |
| max | 0.0056ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | -0.0000010ms | -0.60% |
| p50 | 0.00017ms | 0.00021ms | -0.000041ms | -19.71% |
| p95 | 0.00025ms | 0.00025ms | +5.0e-8ms | +0.02% |
| p99 | 0.0011ms | 0.0011ms | +0.000048ms | +4.43% |
| mean | 0.00023ms | 0.00028ms | -0.000048ms | -17.44% |
| min | 0.00013ms | 0.00017ms | -0.000041ms | -24.70% |
| max | 0.0056ms | 0.01ms | -0.0056ms | -50.00% |
| total | 0.05ms | 0.06ms | -0.0096ms | -17.44% |

### socketioEmit

# Perf Report — socketioEmit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00042ms |
| p99 | 0.0012ms |
| mean | 0.00039ms |
| stdev | 0.00060ms |
| min | 0.00029ms |
| max | 0.0082ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00038ms | -0.000084ms | -22.40% |
| p50 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p95 | 0.00042ms | 0.00046ms | -0.000042ms | -9.11% |
| p99 | 0.0012ms | 0.0012ms | -0.000034ms | -2.81% |
| mean | 0.00039ms | 0.00045ms | -0.000052ms | -11.65% |
| min | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| max | 0.0082ms | 0.0077ms | +0.00046ms | +5.92% |
| total | 0.08ms | 0.09ms | -0.01ms | -11.65% |

