# Perf Suite — cache-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.02ms | 30ms | PASS | stable |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.06ms | 100ms | PASS | stable |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.03ms | 30ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.06ms | 60ms | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.10ms | 200ms | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.05ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | -12024 B | 0 B | 102400 B | yes | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | -17768 B | 0 B | 102400 B | yes | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 2400 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### read_heavy_workload (80 get / 20 set / 100 ops burst)

# Perf Report — read_heavy_workload (80 get / 20 set / 100 ops burst).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.00ms | +5.51% |
| p95 | 0.02ms | 0.03ms | -0.00ms | -10.04% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -13.89% |
| mean | 0.02ms | 0.02ms | +0.00ms | +1.56% |
| min | 0.01ms | 0.01ms | +0.00ms | +15.66% |
| max | 0.03ms | 0.03ms | -0.00ms | -14.00% |
| total | 0.50ms | 0.49ms | +0.01ms | +1.56% |

### pub_sub_burst (subscribe + 50 publish + drain)

# Perf Report — pub_sub_burst (subscribe + 50 publish + drain).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.03ms |
| p95 | 0.06ms |
| p99 | 0.08ms |
| mean | 0.03ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.09ms |
| total | 1.01ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | -0.00ms | -3.93% |
| p95 | 0.06ms | 0.06ms | -0.01ms | -11.26% |
| p99 | 0.08ms | 0.07ms | +0.01ms | +12.01% |
| mean | 0.03ms | 0.03ms | -0.00ms | -1.42% |
| min | 0.02ms | 0.02ms | -0.00ms | -1.07% |
| max | 0.09ms | 0.07ms | +0.02ms | +24.47% |
| total | 1.01ms | 1.03ms | -0.01ms | -1.42% |

### ttl_expiry_cycle (set with TTL + get + assertTTL loop)

# Perf Report — ttl_expiry_cycle (set with TTL + get + assertTTL loop).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.10ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.12ms |
| total | 0.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +10.08% |
| p95 | 0.03ms | 0.02ms | +0.01ms | +54.89% |
| p99 | 0.10ms | 0.02ms | +0.08ms | +388.52% |
| mean | 0.02ms | 0.01ms | +0.01ms | +42.39% |
| min | 0.01ms | 0.01ms | +0.00ms | +8.45% |
| max | 0.12ms | 0.02ms | +0.10ms | +499.00% |
| total | 0.57ms | 0.40ms | +0.17ms | +42.39% |

