# Perf Suite — cache-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.0098ms | 0.02ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.02ms | 0.09ms | 100ms | 0.00041ms | PASS | stable (換算後 p10 -5% (閾値未満)、 p95 +27% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.01ms | 0.02ms | 30ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | cpu | 0.08ms | 0.09ms | 0.0098ms | 0.119 | 0.122 | 0.0098ms | 0.01ms |
| pub_sub_burst (subscribe + 50 publish + drain) | cpu | 0.08ms | 0.09ms | 0.02ms | 0.222 | 0.234 | 0.02ms | 0.02ms |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | cpu | 0.08ms | 0.09ms | 0.01ms | 0.140 | 0.144 | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.06ms | 60ms | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.10ms | 200ms | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.10ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | -8776 B | 0 B | 102400 B | yes | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 9528 B | 0 B | 102400 B | yes | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 2232 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### read_heavy_workload (80 get / 20 set / 100 ops burst)

# Perf Report — read_heavy_workload (80 get / 20 set / 100 ops burst).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0098ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.0046ms |
| min | 0.0094ms |
| max | 0.02ms |
| total | 0.45ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.002)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0098ms | 0.01ms | -0.00025ms | -2.51% |
| p50 | 0.01ms | 0.01ms | +0.0025ms | +22.32% |
| p95 | 0.02ms | 0.02ms | +0.0020ms | +8.95% |
| p99 | 0.02ms | 0.03ms | -0.0018ms | -7.07% |
| mean | 0.02ms | 0.01ms | +0.0013ms | +9.73% |
| min | 0.0094ms | 0.0096ms | -0.00023ms | -2.44% |
| max | 0.02ms | 0.03ms | -0.0033ms | -12.28% |
| total | 0.46ms | 0.41ms | +0.04ms | +9.73% |

### pub_sub_burst (subscribe + 50 publish + drain)

# Perf Report — pub_sub_burst (subscribe + 50 publish + drain).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.09ms |
| p99 | 0.11ms |
| mean | 0.03ms |
| stdev | 0.03ms |
| min | 0.02ms |
| max | 0.11ms |
| total | 0.98ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.994)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00099ms | -5.26% |
| p50 | 0.02ms | 0.02ms | -0.0014ms | -6.92% |
| p95 | 0.09ms | 0.07ms | +0.02ms | +27.07% |
| p99 | 0.11ms | 0.18ms | -0.08ms | -41.60% |
| mean | 0.03ms | 0.04ms | -0.0032ms | -8.80% |
| min | 0.02ms | 0.02ms | -0.00089ms | -4.81% |
| max | 0.11ms | 0.22ms | -0.11ms | -50.87% |
| total | 0.98ms | 1.07ms | -0.09ms | -8.80% |

### ttl_expiry_cycle (set with TTL + get + assertTTL loop)

# Perf Report — ttl_expiry_cycle (set with TTL + get + assertTTL loop).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.09ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.12ms |
| total | 0.52ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.991)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00039ms | -3.32% |
| p50 | 0.01ms | 0.01ms | -0.00026ms | -2.04% |
| p95 | 0.02ms | 0.03ms | -0.0020ms | -7.59% |
| p99 | 0.09ms | 0.03ms | +0.06ms | +164.61% |
| mean | 0.02ms | 0.01ms | +0.0027ms | +19.21% |
| min | 0.01ms | 0.01ms | +0.000067ms | +0.60% |
| max | 0.12ms | 0.04ms | +0.08ms | +221.28% |
| total | 0.51ms | 0.43ms | +0.08ms | +19.21% |

