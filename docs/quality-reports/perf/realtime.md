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
| supabasePresenceTrack | 0.03ms | 40ms | PASS |
| ablyPublish | 0.01ms | 40ms | PASS |
| pusherSubscribeChannel | 0.00ms | 40ms | PASS |
| socketioEmit | 0.01ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| supabasePresenceTrack | -23832 B | 0 B | 102400 B | yes | PASS |
| ablyPublish | 13032 B | 0 B | 102400 B | yes | PASS |
| pusherSubscribeChannel | -480 B | 0 B | 102400 B | yes | PASS |
| socketioEmit | 44552 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +1.64% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +5.36% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +22.78% |
| mean | 0.00ms | 0.00ms | +0.00ms | +9.88% |
| min | 0.00ms | 0.00ms | -0.00ms | -3.52% |
| max | 0.02ms | 0.01ms | +0.00ms | +13.55% |
| total | 0.38ms | 0.34ms | +0.03ms | +9.88% |

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
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.30% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +57.74% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +40.61% |
| mean | 0.00ms | 0.00ms | +0.00ms | +10.59% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.00ms | +0.00ms | +34.29% |
| total | 0.09ms | 0.08ms | +0.01ms | +10.59% |

### pusherSubscribeChannel

# Perf Report — pusherSubscribeChannel.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.10ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +19.62% |
| p99 | 0.01ms | 0.00ms | +0.01ms | +777.85% |
| mean | 0.00ms | 0.00ms | +0.00ms | +215.15% |
| min | 0.00ms | 0.00ms | -0.00ms | -24.70% |
| max | 0.10ms | 0.01ms | +0.09ms | +1110.42% |
| total | 0.15ms | 0.05ms | +0.10ms | +215.15% |

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
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -0.30% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +60.44% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +212.17% |
| mean | 0.00ms | 0.00ms | +0.00ms | +24.08% |
| min | 0.00ms | 0.00ms | -0.00ms | -0.34% |
| max | 0.01ms | 0.01ms | +0.01ms | +159.97% |
| total | 0.10ms | 0.08ms | +0.02ms | +24.08% |

