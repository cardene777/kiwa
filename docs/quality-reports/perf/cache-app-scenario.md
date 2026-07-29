# Perf Suite — cache-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.07ms | 30ms | PASS | stable (検知には +0.5ms (baseline 比 +1481%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.11ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +500%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.02ms | 30ms | PASS | stable (検知には +0.5ms (baseline 比 +2437%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.06ms | 60ms | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.13ms | 200ms | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 6.47ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | -11944 B | 0 B | 102400 B | yes | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | -14672 B | 0 B | 102400 B | yes | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 672 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### read_heavy_workload (80 get / 20 set / 100 ops burst)

# Perf Report — read_heavy_workload (80 get / 20 set / 100 ops burst).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.07ms |
| p99 | 0.15ms |
| mean | 0.03ms |
| stdev | 0.03ms |
| min | 0.01ms |
| max | 0.17ms |
| total | 0.84ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -9.05% |
| p95 | 0.07ms | 0.03ms | +0.04ms | +108.81% |
| p99 | 0.15ms | 0.04ms | +0.11ms | +266.18% |
| mean | 0.03ms | 0.02ms | +0.01ms | +29.90% |
| min | 0.01ms | 0.01ms | -0.00ms | -25.43% |
| max | 0.17ms | 0.04ms | +0.13ms | +294.84% |
| total | 0.84ms | 0.64ms | +0.19ms | +29.90% |

### pub_sub_burst (subscribe + 50 publish + drain)

# Perf Report — pub_sub_burst (subscribe + 50 publish + drain).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.04ms |
| p95 | 0.11ms |
| p99 | 1.49ms |
| mean | 0.11ms |
| stdev | 0.36ms |
| min | 0.02ms |
| max | 2.04ms |
| total | 3.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | +0.00ms | +5.58% |
| p95 | 0.11ms | 0.10ms | +0.01ms | +8.14% |
| p99 | 1.49ms | 0.15ms | +1.34ms | +907.82% |
| mean | 0.11ms | 0.04ms | +0.06ms | +146.14% |
| min | 0.02ms | 0.02ms | -0.00ms | -8.06% |
| max | 2.04ms | 0.16ms | +1.87ms | +1156.14% |
| total | 3.26ms | 1.32ms | +1.93ms | +146.14% |

### ttl_expiry_cycle (set with TTL + get + assertTTL loop)

# Perf Report — ttl_expiry_cycle (set with TTL + get + assertTTL loop).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.08ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.10ms |
| total | 0.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.00ms | +12.64% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -0.70% |
| p99 | 0.08ms | 0.02ms | +0.06ms | +232.37% |
| mean | 0.02ms | 0.02ms | +0.00ms | +28.20% |
| min | 0.02ms | 0.01ms | +0.00ms | +15.77% |
| max | 0.10ms | 0.02ms | +0.08ms | +317.12% |
| total | 0.58ms | 0.45ms | +0.13ms | +28.20% |

