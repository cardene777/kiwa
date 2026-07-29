# Perf Suite — cache-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00053ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0011ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.01ms | 0.04ms | 30ms | 0.0011ms | PASS | improved — gate 無効 (regressionGate=false) |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.04ms | 0.06ms | 100ms | 0.0011ms | PASS | regressed — gate 無効 (regressionGate=false) |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.01ms | 0.02ms | 30ms | 0.0011ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.10ms | 60ms | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.16ms | 200ms | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.05ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | -2768 B | -14812 B | 102400 B | yes | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 19488 B | 0 B | 102400 B | yes | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 7224 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### read_heavy_workload (80 get / 20 set / 100 ops burst)

# Perf Report — read_heavy_workload (80 get / 20 set / 100 ops burst).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.06ms |
| total | 0.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0059ms | -34.85% |
| p50 | 0.02ms | 0.02ms | +0.00065ms | +3.36% |
| p95 | 0.04ms | 0.03ms | +0.0069ms | +21.93% |
| p99 | 0.05ms | 0.04ms | +0.01ms | +34.36% |
| mean | 0.02ms | 0.02ms | +0.00017ms | +0.80% |
| min | 0.01ms | 0.01ms | -0.0041ms | -27.68% |
| max | 0.06ms | 0.04ms | +0.02ms | +39.27% |
| total | 0.65ms | 0.65ms | +0.0052ms | +0.80% |

### pub_sub_burst (subscribe + 50 publish + drain)

# Perf Report — pub_sub_burst (subscribe + 50 publish + drain).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.06ms |
| p99 | 0.08ms |
| mean | 0.04ms |
| stdev | 0.0090ms |
| min | 0.04ms |
| max | 0.08ms |
| total | 1.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.02ms | +0.02ms | +91.64% |
| p50 | 0.04ms | 0.05ms | -0.0061ms | -13.19% |
| p95 | 0.06ms | 1.16ms | -1.11ms | -95.26% |
| p99 | 0.08ms | 2.08ms | -2.00ms | -96.33% |
| mean | 0.04ms | 0.22ms | -0.18ms | -79.87% |
| min | 0.04ms | 0.02ms | +0.02ms | +84.18% |
| max | 0.08ms | 2.40ms | -2.32ms | -96.49% |
| total | 1.34ms | 6.63ms | -5.30ms | -79.87% |

### ttl_expiry_cycle (set with TTL + get + assertTTL loop)

# Perf Report — ttl_expiry_cycle (set with TTL + get + assertTTL loop).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.09ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.11ms |
| total | 0.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.0013ms | +10.10% |
| p50 | 0.02ms | 0.01ms | +0.0014ms | +9.83% |
| p95 | 0.02ms | 0.06ms | -0.04ms | -62.13% |
| p99 | 0.09ms | 0.10ms | -0.01ms | -11.89% |
| mean | 0.02ms | 0.02ms | -0.0017ms | -7.91% |
| min | 0.01ms | 0.01ms | +0.0011ms | +8.80% |
| max | 0.11ms | 0.11ms | +0.0082ms | +7.79% |
| total | 0.58ms | 0.63ms | -0.05ms | -7.91% |

