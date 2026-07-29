# Perf Suite — cache-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.02ms | 0.03ms | 30ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.02ms | 0.16ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.02ms | 0.03ms | 30ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.06ms | 60ms | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.15ms | 200ms | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.07ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | -8272 B | 0 B | 102400 B | yes | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 2656 B | 0 B | 102400 B | yes | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 1680 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### read_heavy_workload (80 get / 20 set / 100 ops burst)

# Perf Report — read_heavy_workload (80 get / 20 set / 100 ops burst).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0067ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0011ms | -6.33% |
| p50 | 0.02ms | 0.02ms | +0.0027ms | +13.88% |
| p95 | 0.03ms | 0.03ms | +0.0019ms | +6.14% |
| p99 | 0.04ms | 0.04ms | +0.0037ms | +9.83% |
| mean | 0.02ms | 0.02ms | +0.0012ms | +5.47% |
| min | 0.01ms | 0.01ms | -0.00046ms | -3.11% |
| max | 0.04ms | 0.04ms | +0.0043ms | +10.73% |
| total | 0.68ms | 0.65ms | +0.04ms | +5.47% |

### pub_sub_burst (subscribe + 50 publish + drain)

# Perf Report — pub_sub_burst (subscribe + 50 publish + drain).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.04ms |
| p95 | 0.16ms |
| p99 | 0.19ms |
| mean | 0.06ms |
| stdev | 0.05ms |
| min | 0.02ms |
| max | 0.21ms |
| total | 1.69ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0025ms | -12.19% |
| p50 | 0.04ms | 0.05ms | -0.01ms | -22.45% |
| p95 | 0.16ms | 1.16ms | -1.00ms | -86.47% |
| p99 | 0.19ms | 2.08ms | -1.89ms | -90.74% |
| mean | 0.06ms | 0.22ms | -0.16ms | -74.52% |
| min | 0.02ms | 0.02ms | -0.0022ms | -11.39% |
| max | 0.21ms | 2.40ms | -2.20ms | -91.44% |
| total | 1.69ms | 6.63ms | -4.94ms | -74.52% |

### ttl_expiry_cycle (set with TTL + get + assertTTL loop)

# Perf Report — ttl_expiry_cycle (set with TTL + get + assertTTL loop).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.31ms |
| mean | 0.03ms |
| stdev | 0.07ms |
| min | 0.02ms |
| max | 0.43ms |
| total | 0.94ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.01ms | +0.0026ms | +19.54% |
| p50 | 0.02ms | 0.01ms | +0.0024ms | +17.55% |
| p95 | 0.03ms | 0.06ms | -0.03ms | -56.42% |
| p99 | 0.31ms | 0.10ms | +0.21ms | +212.59% |
| mean | 0.03ms | 0.02ms | +0.01ms | +49.31% |
| min | 0.02ms | 0.01ms | +0.0028ms | +22.16% |
| max | 0.43ms | 0.11ms | +0.32ms | +304.43% |
| total | 0.94ms | 0.63ms | +0.31ms | +49.31% |

