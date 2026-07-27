# Perf Suite — realtime

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| supabasePresenceTrack | 0.00ms | 20ms | PASS | stable |
| ablyPublish | 0.00ms | 20ms | PASS | stable |
| pusherSubscribeChannel | 0.00ms | 20ms | PASS | stable |
| socketioEmit | 0.00ms | 20ms | PASS | stable |

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
| supabasePresenceTrack | -22512 B | -80459 B | 102400 B | yes | PASS |
| ablyPublish | 34240 B | 0 B | 102400 B | yes | PASS |
| pusherSubscribeChannel | 448 B | 0 B | 102400 B | yes | PASS |
| socketioEmit | 46040 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### supabasePresenceTrack

# Perf Report — supabasePresenceTrack.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.14ms |
| total | 0.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +3.36% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +5.56% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +132.73% |
| mean | 0.00ms | 0.00ms | +0.00ms | +54.78% |
| min | 0.00ms | 0.00ms | -0.00ms | -3.52% |
| max | 0.14ms | 0.01ms | +0.12ms | +899.35% |
| total | 0.53ms | 0.34ms | +0.19ms | +54.78% |

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
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +116.30% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +54.08% |
| mean | 0.00ms | 0.00ms | +0.00ms | +13.60% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +7.61% |
| total | 0.09ms | 0.08ms | +0.01ms | +13.60% |

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
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +24.55% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +19.62% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +141.95% |
| mean | 0.00ms | 0.00ms | +0.00ms | +20.54% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +15.10% |
| total | 0.06ms | 0.05ms | +0.01ms | +20.54% |

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
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -0.30% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +10.56% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +13.79% |
| mean | 0.00ms | 0.00ms | +0.00ms | +4.80% |
| min | 0.00ms | 0.00ms | -0.00ms | -0.34% |
| max | 0.01ms | 0.01ms | +0.00ms | +58.38% |
| total | 0.08ms | 0.08ms | +0.00ms | +4.80% |

