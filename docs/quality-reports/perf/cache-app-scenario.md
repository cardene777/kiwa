# Perf Suite — cache-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00054ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0011ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.02ms | 0.03ms | 30ms | 0.0011ms | PASS | regressed — gate 無効 (regressionGate=false) |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.03ms | 0.06ms | 100ms | 0.0011ms | PASS | regressed — gate 無効 (regressionGate=false) |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.01ms | 0.03ms | 30ms | 0.0011ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.09ms | 60ms | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.12ms | 200ms | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.06ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | -10240 B | 0 B | 102400 B | yes | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 1080 B | 0 B | 102400 B | yes | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 7744 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0036ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.0038ms | +22.60% |
| p50 | 0.02ms | 0.02ms | +0.0028ms | +14.54% |
| p95 | 0.03ms | 0.03ms | -0.00036ms | -1.13% |
| p99 | 0.03ms | 0.04ms | -0.0065ms | -17.24% |
| mean | 0.02ms | 0.02ms | +0.0022ms | +10.32% |
| min | 0.02ms | 0.01ms | +0.0045ms | +30.22% |
| max | 0.03ms | 0.04ms | -0.0087ms | -21.77% |
| total | 0.72ms | 0.65ms | +0.07ms | +10.32% |

### pub_sub_burst (subscribe + 50 publish + drain)

# Perf Report — pub_sub_burst (subscribe + 50 publish + drain).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.06ms |
| p99 | 0.09ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.10ms |
| total | 1.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.02ms | +0.01ms | +53.87% |
| p50 | 0.04ms | 0.05ms | -0.0096ms | -20.62% |
| p95 | 0.06ms | 1.16ms | -1.10ms | -94.73% |
| p99 | 0.09ms | 2.08ms | -1.99ms | -95.86% |
| mean | 0.04ms | 0.22ms | -0.18ms | -80.92% |
| min | 0.03ms | 0.02ms | +0.0096ms | +48.73% |
| max | 0.10ms | 2.40ms | -2.31ms | -96.00% |
| total | 1.27ms | 6.63ms | -5.37ms | -80.92% |

### ttl_expiry_cycle (set with TTL + get + assertTTL loop)

# Perf Report — ttl_expiry_cycle (set with TTL + get + assertTTL loop).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.18ms |
| mean | 0.02ms |
| stdev | 0.04ms |
| min | 0.01ms |
| max | 0.24ms |
| total | 0.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.0010ms | +7.58% |
| p50 | 0.01ms | 0.01ms | +0.00081ms | +5.90% |
| p95 | 0.03ms | 0.06ms | -0.03ms | -56.09% |
| p99 | 0.18ms | 0.10ms | +0.08ms | +82.55% |
| mean | 0.02ms | 0.02ms | +0.0031ms | +14.58% |
| min | 0.01ms | 0.01ms | +0.0012ms | +9.45% |
| max | 0.24ms | 0.11ms | +0.14ms | +130.84% |
| total | 0.72ms | 0.63ms | +0.09ms | +14.58% |

