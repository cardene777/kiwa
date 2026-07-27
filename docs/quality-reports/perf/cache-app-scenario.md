# Perf Suite — cache-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.03ms | 30ms | PASS | stable |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.07ms | 100ms | PASS | stable |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.03ms | 30ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.05ms | 60ms | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.09ms | 200ms | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.05ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | -12504 B | 0 B | 102400 B | yes | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | -16656 B | 0 B | 102400 B | yes | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 1728 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### read_heavy_workload (80 get / 20 set / 100 ops burst)

# Perf Report — read_heavy_workload (80 get / 20 set / 100 ops burst).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.00ms | +8.56% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -0.15% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -0.86% |
| mean | 0.02ms | 0.02ms | +0.00ms | +5.37% |
| min | 0.01ms | 0.01ms | +0.00ms | +20.48% |
| max | 0.03ms | 0.03ms | -0.00ms | -2.13% |
| total | 0.52ms | 0.49ms | +0.03ms | +5.37% |

### pub_sub_burst (subscribe + 50 publish + drain)

# Perf Report — pub_sub_burst (subscribe + 50 publish + drain).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.03ms |
| p95 | 0.07ms |
| p99 | 0.10ms |
| mean | 0.03ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.10ms |
| total | 1.02ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | -0.00ms | -6.01% |
| p95 | 0.07ms | 0.06ms | +0.00ms | +5.62% |
| p99 | 0.10ms | 0.07ms | +0.02ms | +32.54% |
| mean | 0.03ms | 0.03ms | -0.00ms | -0.68% |
| min | 0.02ms | 0.02ms | +0.00ms | +0.22% |
| max | 0.10ms | 0.07ms | +0.03ms | +42.68% |
| total | 1.02ms | 1.03ms | -0.01ms | -0.68% |

### ttl_expiry_cycle (set with TTL + get + assertTTL loop)

# Perf Report — ttl_expiry_cycle (set with TTL + get + assertTTL loop).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.07ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.08ms |
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +7.40% |
| p95 | 0.03ms | 0.02ms | +0.01ms | +52.83% |
| p99 | 0.07ms | 0.02ms | +0.05ms | +238.22% |
| mean | 0.02ms | 0.01ms | +0.00ms | +25.30% |
| min | 0.01ms | 0.01ms | +0.00ms | +8.10% |
| max | 0.08ms | 0.02ms | +0.06ms | +295.58% |
| total | 0.50ms | 0.40ms | +0.10ms | +25.30% |

