# Perf Suite — realtime

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| supabasePresenceTrack | 0.0012ms | 0.0034ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| ablyPublish | 0.00029ms | 0.00050ms | 20ms | 0.00033ms | PASS | stable (差 0.000083ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| pusherSubscribeChannel | 0.00017ms | 0.00021ms | 20ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +199%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| socketioEmit | 0.00033ms | 0.00059ms | 20ms | 0.00033ms | PASS | stable (p10 -11% (閾値未満)、 p95 +27% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

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
| supabasePresenceTrack | -21632 B | 0 B | 102400 B | yes | PASS |
| ablyPublish | 29216 B | 0 B | 102400 B | yes | PASS |
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
| p99 | 0.0068ms |
| mean | 0.0017ms |
| stdev | 0.0013ms |
| min | 0.0011ms |
| max | 0.01ms |
| total | 0.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0012ms | 0.0013ms | -0.00012ms | -9.67% |
| p50 | 0.0013ms | 0.0016ms | -0.00037ms | -23.08% |
| p95 | 0.0034ms | 0.0061ms | -0.0026ms | -43.43% |
| p99 | 0.0068ms | 0.02ms | -0.02ms | -70.70% |
| mean | 0.0017ms | 0.0073ms | -0.0056ms | -76.40% |
| min | 0.0011ms | 0.0013ms | -0.00013ms | -10.00% |
| max | 0.01ms | 0.87ms | -0.86ms | -98.47% |
| total | 0.35ms | 1.46ms | -1.12ms | -76.40% |

### ablyPublish

# Perf Report — ablyPublish.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00050ms |
| p99 | 0.0020ms |
| mean | 0.00041ms |
| stdev | 0.00039ms |
| min | 0.00025ms |
| max | 0.0046ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00038ms | -0.000083ms | -22.13% |
| p50 | 0.00033ms | 0.00038ms | -0.000041ms | -10.93% |
| p95 | 0.00050ms | 0.00063ms | -0.00012ms | -19.67% |
| p99 | 0.0020ms | 0.0019ms | +0.000083ms | +4.35% |
| mean | 0.00041ms | 0.00045ms | -0.000033ms | -7.36% |
| min | 0.00025ms | 0.00033ms | -0.000083ms | -24.92% |
| max | 0.0046ms | 0.0023ms | +0.0023ms | +98.24% |
| total | 0.08ms | 0.09ms | -0.0066ms | -7.36% |

### pusherSubscribeChannel

# Perf Report — pusherSubscribeChannel.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00021ms |
| p99 | 0.0011ms |
| mean | 0.00024ms |
| stdev | 0.00050ms |
| min | 0.00017ms |
| max | 0.0070ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | -0.0000010ms | -0.60% |
| p50 | 0.00017ms | 0.00021ms | -0.000041ms | -19.71% |
| p95 | 0.00021ms | 0.00025ms | -0.000041ms | -16.27% |
| p99 | 0.0011ms | 0.0011ms | +0.0000050ms | +0.46% |
| mean | 0.00024ms | 0.00028ms | -0.000040ms | -14.36% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.0070ms | 0.01ms | -0.0042ms | -37.69% |
| total | 0.05ms | 0.06ms | -0.0079ms | -14.36% |

### socketioEmit

# Perf Report — socketioEmit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00033ms |
| p95 | 0.00059ms |
| p99 | 0.0029ms |
| mean | 0.00047ms |
| stdev | 0.00097ms |
| min | 0.00029ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p50 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p95 | 0.00059ms | 0.00046ms | +0.00013ms | +27.36% |
| p99 | 0.0029ms | 0.0012ms | +0.0016ms | +133.93% |
| mean | 0.00047ms | 0.00045ms | +0.000029ms | +6.44% |
| min | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| max | 0.01ms | 0.0077ms | +0.0031ms | +39.78% |
| total | 0.09ms | 0.09ms | +0.0057ms | +6.44% |

