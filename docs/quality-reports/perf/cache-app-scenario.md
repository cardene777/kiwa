# Perf Suite — cache-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.01ms | 0.03ms | 30ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.02ms | 0.06ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.01ms | 0.04ms | 30ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.06ms | 60ms | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.09ms | 200ms | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.05ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | -9824 B | 0 B | 102400 B | yes | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 1192 B | 0 B | 102400 B | yes | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 1680 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### read_heavy_workload (80 get / 20 set / 100 ops burst)

# Perf Report — read_heavy_workload (80 get / 20 set / 100 ops burst).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0063ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0027ms | -16.11% |
| p50 | 0.02ms | 0.02ms | -0.0025ms | -12.80% |
| p95 | 0.03ms | 0.03ms | +0.00039ms | +1.25% |
| p99 | 0.03ms | 0.04ms | -0.0031ms | -8.23% |
| mean | 0.02ms | 0.02ms | -0.0023ms | -10.55% |
| min | 0.01ms | 0.01ms | -0.0016ms | -10.74% |
| max | 0.04ms | 0.04ms | -0.0044ms | -10.94% |
| total | 0.58ms | 0.65ms | -0.07ms | -10.55% |

### pub_sub_burst (subscribe + 50 publish + drain)

# Perf Report — pub_sub_burst (subscribe + 50 publish + drain).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.03ms |
| p95 | 0.06ms |
| p99 | 0.08ms |
| mean | 0.04ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.09ms |
| total | 1.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.0015ms | +7.22% |
| p50 | 0.03ms | 0.05ms | -0.02ms | -36.76% |
| p95 | 0.06ms | 1.16ms | -1.10ms | -94.76% |
| p99 | 0.08ms | 2.08ms | -2.00ms | -95.96% |
| mean | 0.04ms | 0.22ms | -0.19ms | -84.12% |
| min | 0.02ms | 0.02ms | -0.00054ms | -2.74% |
| max | 0.09ms | 2.40ms | -2.31ms | -96.17% |
| total | 1.05ms | 6.63ms | -5.58ms | -84.12% |

### ttl_expiry_cycle (set with TTL + get + assertTTL loop)

# Perf Report — ttl_expiry_cycle (set with TTL + get + assertTTL loop).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.04ms |
| p99 | 0.28ms |
| mean | 0.03ms |
| stdev | 0.06ms |
| min | 0.01ms |
| max | 0.37ms |
| total | 0.87ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00067ms | +5.06% |
| p50 | 0.01ms | 0.01ms | +0.00075ms | +5.45% |
| p95 | 0.04ms | 0.06ms | -0.02ms | -39.07% |
| p99 | 0.28ms | 0.10ms | +0.18ms | +176.90% |
| mean | 0.03ms | 0.02ms | +0.0081ms | +38.41% |
| min | 0.01ms | 0.01ms | +0.0010ms | +8.15% |
| max | 0.37ms | 0.11ms | +0.26ms | +250.22% |
| total | 0.87ms | 0.63ms | +0.24ms | +38.41% |

