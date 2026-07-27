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
| supabasePresenceTrack | -24488 B | 0 B | 102400 B | yes | PASS |
| ablyPublish | 13976 B | 0 B | 102400 B | yes | PASS |
| pusherSubscribeChannel | 2760 B | 0 B | 102400 B | yes | PASS |
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
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +29.00% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +31.99% |
| mean | 0.00ms | 0.00ms | +0.00ms | +8.75% |
| min | 0.00ms | 0.00ms | -0.00ms | -3.52% |
| max | 0.02ms | 0.01ms | +0.00ms | +35.23% |
| total | 0.37ms | 0.34ms | +0.03ms | +8.75% |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +9.18% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +6.12% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.89% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +10.47% |
| total | 0.08ms | 0.08ms | +0.00ms | +3.89% |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +39.71% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +105.06% |
| mean | 0.00ms | 0.00ms | +0.00ms | +13.14% |
| min | 0.00ms | 0.00ms | -0.00ms | -24.70% |
| max | 0.01ms | 0.01ms | +0.00ms | +4.16% |
| total | 0.05ms | 0.05ms | +0.01ms | +13.14% |

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
| p95 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +17.89% |
| mean | 0.00ms | 0.00ms | +0.00ms | +5.10% |
| min | 0.00ms | 0.00ms | -0.00ms | -0.34% |
| max | 0.01ms | 0.01ms | +0.00ms | +60.78% |
| total | 0.08ms | 0.08ms | +0.00ms | +5.10% |

