# Perf Suite — cache-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00020ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00041ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.01ms | 0.03ms | 30ms | 0.00041ms | PASS | improved — gate 無効 (regressionGate=false) |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.02ms | 0.06ms | 100ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.01ms | 0.02ms | 30ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.06ms | 60ms | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.07ms | 200ms | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.05ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | -10024 B | 0 B | 102400 B | yes | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 1368 B | 0 B | 102400 B | yes | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 672 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.0065ms |
| min | 0.0099ms |
| max | 0.04ms |
| total | 0.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0056ms | -33.20% |
| p50 | 0.02ms | 0.02ms | -0.0030ms | -15.83% |
| p95 | 0.03ms | 0.03ms | -0.0012ms | -3.78% |
| p99 | 0.03ms | 0.04ms | -0.0036ms | -9.49% |
| mean | 0.02ms | 0.02ms | -0.0035ms | -16.16% |
| min | 0.0099ms | 0.01ms | -0.0048ms | -32.77% |
| max | 0.04ms | 0.04ms | -0.0047ms | -11.77% |
| total | 0.54ms | 0.65ms | -0.10ms | -16.16% |

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
| mean | 0.03ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.09ms |
| total | 1.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0012ms | -5.76% |
| p50 | 0.03ms | 0.05ms | -0.02ms | -35.29% |
| p95 | 0.06ms | 1.16ms | -1.10ms | -95.00% |
| p99 | 0.08ms | 2.08ms | -2.00ms | -95.97% |
| mean | 0.03ms | 0.22ms | -0.19ms | -84.43% |
| min | 0.02ms | 0.02ms | -0.00075ms | -3.80% |
| max | 0.09ms | 2.40ms | -2.31ms | -96.08% |
| total | 1.03ms | 6.63ms | -5.60ms | -84.43% |

### ttl_expiry_cycle (set with TTL + get + assertTTL loop)

# Perf Report — ttl_expiry_cycle (set with TTL + get + assertTTL loop).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.06ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.08ms |
| total | 0.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00050ms | -3.74% |
| p50 | 0.01ms | 0.01ms | -0.00073ms | -5.29% |
| p95 | 0.02ms | 0.06ms | -0.04ms | -66.52% |
| p99 | 0.06ms | 0.10ms | -0.04ms | -37.64% |
| mean | 0.02ms | 0.02ms | -0.0049ms | -23.15% |
| min | 0.01ms | 0.01ms | -0.0020ms | -15.64% |
| max | 0.08ms | 0.11ms | -0.03ms | -25.27% |
| total | 0.48ms | 0.63ms | -0.15ms | -23.15% |

