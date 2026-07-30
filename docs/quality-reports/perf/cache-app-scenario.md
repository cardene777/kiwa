# Perf Suite — cache-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.01ms | 0.02ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.02ms | 0.05ms | 100ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.01ms | 0.02ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | cpu | 0.08ms | 0.09ms | 0.01ms | 0.134 | 0.122 | 0.01ms | 0.01ms |
| pub_sub_burst (subscribe + 50 publish + drain) | cpu | 0.08ms | 0.09ms | 0.02ms | 0.218 | 0.234 | 0.02ms | 0.02ms |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | cpu | 0.08ms | 0.09ms | 0.01ms | 0.136 | 0.144 | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.07ms | 60ms | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.07ms | 200ms | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.05ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | -11224 B | 0 B | 102400 B | yes | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 9608 B | 0 B | 102400 B | yes | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 704 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### read_heavy_workload (80 get / 20 set / 100 ops burst)

# Perf Report — read_heavy_workload (80 get / 20 set / 100 ops burst).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.0039ms |
| min | 0.0099ms |
| max | 0.02ms |
| total | 0.46ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.006)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00093ms | +9.26% |
| p50 | 0.01ms | 0.01ms | +0.0030ms | +26.38% |
| p95 | 0.02ms | 0.02ms | +0.0013ms | +5.91% |
| p99 | 0.02ms | 0.03ms | -0.0016ms | -6.14% |
| mean | 0.02ms | 0.01ms | +0.0017ms | +12.39% |
| min | 0.0099ms | 0.0096ms | +0.00031ms | +3.24% |
| max | 0.02ms | 0.03ms | -0.0030ms | -10.95% |
| total | 0.47ms | 0.41ms | +0.05ms | +12.39% |

### pub_sub_burst (subscribe + 50 publish + drain)

# Perf Report — pub_sub_burst (subscribe + 50 publish + drain).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.05ms |
| p99 | 0.08ms |
| mean | 0.03ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.09ms |
| total | 0.82ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.988)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0013ms | -6.96% |
| p50 | 0.02ms | 0.02ms | -0.0016ms | -7.81% |
| p95 | 0.05ms | 0.07ms | -0.03ms | -34.16% |
| p99 | 0.08ms | 0.18ms | -0.11ms | -58.47% |
| mean | 0.03ms | 0.04ms | -0.0089ms | -24.90% |
| min | 0.02ms | 0.02ms | -0.0010ms | -5.40% |
| max | 0.09ms | 0.22ms | -0.13ms | -60.58% |
| total | 0.81ms | 1.07ms | -0.27ms | -24.90% |

### ttl_expiry_cycle (set with TTL + get + assertTTL loop)

# Perf Report — ttl_expiry_cycle (set with TTL + get + assertTTL loop).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.07ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.09ms |
| total | 0.45ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.001)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00067ms | -5.69% |
| p50 | 0.01ms | 0.01ms | -0.00087ms | -6.87% |
| p95 | 0.02ms | 0.03ms | -0.0078ms | -30.19% |
| p99 | 0.07ms | 0.03ms | +0.04ms | +112.40% |
| mean | 0.02ms | 0.01ms | +0.00077ms | +5.38% |
| min | 0.01ms | 0.01ms | -0.00033ms | -2.96% |
| max | 0.09ms | 0.04ms | +0.06ms | +157.44% |
| total | 0.45ms | 0.43ms | +0.02ms | +5.38% |

