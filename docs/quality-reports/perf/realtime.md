# Perf Suite — realtime

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| supabasePresenceTrack | 0.00ms | 20ms | PASS | stable (検知には +0.5ms (baseline 比 +11211%) 以上の悪化が必要) |
| ablyPublish | 0.00ms | 20ms | PASS | stable (検知には +0.5ms (baseline 比 +92064%) 以上の悪化が必要) |
| pusherSubscribeChannel | 0.00ms | 20ms | PASS | stable (検知には +0.5ms (baseline 比 +200000%) 以上の悪化が必要) |
| socketioEmit | 0.00ms | 20ms | PASS | stable (検知には +0.5ms (baseline 比 +33241%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| supabasePresenceTrack | 0.02ms | 40ms | PASS |
| ablyPublish | 0.01ms | 40ms | PASS |
| pusherSubscribeChannel | 0.03ms | 40ms | PASS |
| socketioEmit | 0.01ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| supabasePresenceTrack | -24600 B | -80523 B | 102400 B | yes | PASS |
| ablyPublish | 13680 B | 0 B | 102400 B | yes | PASS |
| pusherSubscribeChannel | 2560 B | 0 B | 102400 B | yes | PASS |
| socketioEmit | 52168 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### supabasePresenceTrack

# Perf Report — supabasePresenceTrack.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.14ms |
| min | 0.00ms |
| max | 1.99ms |
| total | 2.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +13.78% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -6.31% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +14.01% |
| mean | 0.01ms | 0.00ms | +0.01ms | +551.19% |
| min | 0.00ms | 0.00ms | +0.00ms | +11.54% |
| max | 1.99ms | 0.02ms | +1.97ms | +11853.38% |
| total | 2.41ms | 0.37ms | +2.04ms | +551.19% |

### ablyPublish

# Perf Report — ablyPublish.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.00ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.30% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +7.73% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +17.98% |
| mean | 0.00ms | 0.00ms | +0.00ms | +8.33% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +92.58% |
| total | 0.08ms | 0.08ms | +0.01ms | +8.33% |

### pusherSubscribeChannel

# Perf Report — pusherSubscribeChannel.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +24.55% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +16.80% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +49.61% |
| mean | 0.00ms | 0.00ms | +0.00ms | +5.04% |
| min | 0.00ms | 0.00ms | +0.00ms | +32.80% |
| max | 0.01ms | 0.01ms | -0.01ms | -40.45% |
| total | 0.05ms | 0.05ms | +0.00ms | +5.04% |

### socketioEmit

# Perf Report — socketioEmit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +12.28% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -66.21% |
| p99 | 0.00ms | 0.01ms | -0.01ms | -90.63% |
| mean | 0.00ms | 0.00ms | -0.00ms | -47.72% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.05ms | -0.04ms | -83.01% |
| total | 0.09ms | 0.17ms | -0.08ms | -47.72% |

