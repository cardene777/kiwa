# Perf Suite — cache-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.01ms | 0.06ms | 30ms | 0.00049ms | PASS | improved — gate 無効 (regressionGate=false) |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.03ms | 0.06ms | 100ms | 0.00049ms | PASS | regressed — gate 無効 (regressionGate=false) |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.01ms | 0.02ms | 30ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.18ms | 60ms | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.10ms | 200ms | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.06ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | -8240 B | -14779 B | 102400 B | yes | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 1272 B | 0 B | 102400 B | yes | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 3936 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### read_heavy_workload (80 get / 20 set / 100 ops burst)

# Perf Report — read_heavy_workload (80 get / 20 set / 100 ops burst).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.06ms |
| p99 | 0.09ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.10ms |
| total | 0.73ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0058ms | -34.38% |
| p50 | 0.02ms | 0.02ms | -0.00075ms | -3.90% |
| p95 | 0.06ms | 0.03ms | +0.03ms | +86.17% |
| p99 | 0.09ms | 0.04ms | +0.05ms | +144.30% |
| mean | 0.02ms | 0.02ms | +0.0026ms | +12.13% |
| min | 0.01ms | 0.01ms | -0.0041ms | -27.69% |
| max | 0.10ms | 0.04ms | +0.06ms | +146.15% |
| total | 0.73ms | 0.65ms | +0.08ms | +12.13% |

### pub_sub_burst (subscribe + 50 publish + drain)

# Perf Report — pub_sub_burst (subscribe + 50 publish + drain).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.06ms |
| p99 | 0.10ms |
| mean | 0.04ms |
| stdev | 0.02ms |
| min | 0.03ms |
| max | 0.11ms |
| total | 1.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.02ms | +0.01ms | +52.53% |
| p50 | 0.04ms | 0.05ms | -0.0082ms | -17.67% |
| p95 | 0.06ms | 1.16ms | -1.10ms | -94.42% |
| p99 | 0.10ms | 2.08ms | -1.98ms | -95.18% |
| mean | 0.04ms | 0.22ms | -0.18ms | -79.91% |
| min | 0.03ms | 0.02ms | +0.01ms | +54.43% |
| max | 0.11ms | 2.40ms | -2.29ms | -95.26% |
| total | 1.33ms | 6.63ms | -5.30ms | -79.91% |

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
| total | 0.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.0017ms | +13.15% |
| p50 | 0.02ms | 0.01ms | +0.0015ms | +11.04% |
| p95 | 0.02ms | 0.06ms | -0.04ms | -60.85% |
| p99 | 0.09ms | 0.10ms | -0.01ms | -11.54% |
| mean | 0.02ms | 0.02ms | -0.0014ms | -6.72% |
| min | 0.01ms | 0.01ms | +0.0020ms | +15.32% |
| max | 0.11ms | 0.11ms | +0.0079ms | +7.51% |
| total | 0.59ms | 0.63ms | -0.04ms | -6.72% |

