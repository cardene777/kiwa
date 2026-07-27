# Perf Suite — cache-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.08ms | 30ms | PASS | stable |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.06ms | 100ms | PASS | stable |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.03ms | 30ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.23ms | 60ms | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.15ms | 200ms | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.05ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | -10624 B | 0 B | 102400 B | yes | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | -1560 B | 0 B | 102400 B | yes | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 4856 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### read_heavy_workload (80 get / 20 set / 100 ops burst)

# Perf Report — read_heavy_workload (80 get / 20 set / 100 ops burst).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.04ms |
| p95 | 0.08ms |
| p99 | 0.09ms |
| mean | 0.05ms |
| stdev | 0.02ms |
| min | 0.03ms |
| max | 0.10ms |
| total | 1.45ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.01ms | +0.03ms | +186.07% |
| p95 | 0.08ms | 0.03ms | +0.05ms | +199.19% |
| p99 | 0.09ms | 0.03ms | +0.06ms | +211.72% |
| mean | 0.05ms | 0.02ms | +0.03ms | +196.87% |
| min | 0.03ms | 0.01ms | +0.02ms | +198.80% |
| max | 0.10ms | 0.03ms | +0.07ms | +220.40% |
| total | 1.45ms | 0.49ms | +0.96ms | +196.87% |

### pub_sub_burst (subscribe + 50 publish + drain)

# Perf Report — pub_sub_burst (subscribe + 50 publish + drain).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.04ms |
| p95 | 0.06ms |
| p99 | 0.08ms |
| mean | 0.05ms |
| stdev | 0.01ms |
| min | 0.04ms |
| max | 0.09ms |
| total | 1.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.03ms | +0.01ms | +45.35% |
| p95 | 0.06ms | 0.06ms | -0.00ms | -3.07% |
| p99 | 0.08ms | 0.07ms | +0.01ms | +16.79% |
| mean | 0.05ms | 0.03ms | +0.01ms | +33.91% |
| min | 0.04ms | 0.02ms | +0.02ms | +83.09% |
| max | 0.09ms | 0.07ms | +0.02ms | +28.55% |
| total | 1.37ms | 1.03ms | +0.35ms | +33.91% |

### ttl_expiry_cycle (set with TTL + get + assertTTL loop)

# Perf Report — ttl_expiry_cycle (set with TTL + get + assertTTL loop).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.12ms |
| mean | 0.02ms |
| stdev | 0.03ms |
| min | 0.01ms |
| max | 0.15ms |
| total | 0.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +17.14% |
| p95 | 0.03ms | 0.02ms | +0.01ms | +60.20% |
| p99 | 0.12ms | 0.02ms | +0.10ms | +496.19% |
| mean | 0.02ms | 0.01ms | +0.01ms | +55.83% |
| min | 0.01ms | 0.01ms | +0.00ms | +15.50% |
| max | 0.15ms | 0.02ms | +0.13ms | +638.55% |
| total | 0.63ms | 0.40ms | +0.22ms | +55.83% |

