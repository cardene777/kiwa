# Perf Suite — cache

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| redisEnvAccessor | 0.00013ms | 0.00088ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +268%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| memcachedEnvAccessor | 0.00013ms | 0.00071ms | 5ms | 0.00034ms | PASS | stable (検知には +0.00034ms (baseline 比 +269%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| keydbEnvAccessor | 0.00013ms | 0.00029ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +265%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| redisEnvAccessor | cpu | 0.08ms | 0.09ms | 0.00013ms | 0.002 | 0.002 | 0.00013ms | 0.00013ms |
| memcachedEnvAccessor | cpu | 0.08ms | 0.09ms | 0.00013ms | 0.002 | 0.002 | 0.00013ms | 0.00013ms |
| keydbEnvAccessor | cpu | 0.08ms | 0.09ms | 0.00013ms | 0.002 | 0.002 | 0.00012ms | 0.00013ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| redisEnvAccessor | 0.01ms | 10ms | PASS |
| memcachedEnvAccessor | 0.01ms | 10ms | PASS |
| keydbEnvAccessor | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| redisEnvAccessor | -17760 B | 0 B | 102400 B | yes | PASS |
| memcachedEnvAccessor | -17672 B | 0 B | 102400 B | yes | PASS |
| keydbEnvAccessor | -360 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### redisEnvAccessor

# Perf Report — redisEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00088ms |
| p99 | 0.0029ms |
| mean | 0.00028ms |
| stdev | 0.00065ms |
| min | 0.000083ms |
| max | 0.0076ms |
| total | 0.06ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.009)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | +0.0000011ms | +0.86% |
| p50 | 0.00013ms | 0.00017ms | -0.000040ms | -24.05% |
| p95 | 0.00089ms | 0.0012ms | -0.00028ms | -23.79% |
| p99 | 0.0029ms | 0.0031ms | -0.00012ms | -3.99% |
| mean | 0.00028ms | 0.00030ms | -0.000026ms | -8.52% |
| min | 0.000084ms | 0.00013ms | -0.000041ms | -33.03% |
| max | 0.0076ms | 0.0068ms | +0.00082ms | +11.93% |
| total | 0.06ms | 0.06ms | -0.0052ms | -8.52% |

### memcachedEnvAccessor

# Perf Report — memcachedEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00071ms |
| p99 | 0.0028ms |
| mean | 0.00024ms |
| stdev | 0.00047ms |
| min | 0.000083ms |
| max | 0.0043ms |
| total | 0.05ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.012)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | +0.0000016ms | +1.24% |
| p50 | 0.00013ms | 0.00013ms | +0.0000016ms | +1.24% |
| p95 | 0.00072ms | 0.00025ms | +0.00047ms | +186.71% |
| p99 | 0.0028ms | 0.0019ms | +0.00098ms | +52.85% |
| mean | 0.00024ms | 0.00020ms | +0.000042ms | +20.74% |
| min | 0.000084ms | 0.000084ms | +2.9e-8ms | +0.04% |
| max | 0.0043ms | 0.0045ms | -0.00020ms | -4.38% |
| total | 0.05ms | 0.04ms | +0.0084ms | +20.74% |

### keydbEnvAccessor

# Perf Report — keydbEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00029ms |
| p99 | 0.0030ms |
| mean | 0.00027ms |
| stdev | 0.00095ms |
| min | 0.000083ms |
| max | 0.01ms |
| total | 0.05ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.996)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00012ms | 0.00013ms | -5.2e-7ms | -0.41% |
| p50 | 0.00012ms | 0.00013ms | -5.2e-7ms | -0.41% |
| p95 | 0.00029ms | 0.00026ms | +0.000035ms | +13.48% |
| p99 | 0.0030ms | 0.0034ms | -0.00034ms | -10.12% |
| mean | 0.00027ms | 0.00030ms | -0.000033ms | -10.72% |
| min | 0.000083ms | 0.000083ms | -3.4e-7ms | -0.41% |
| max | 0.01ms | 0.02ms | -0.0075ms | -37.73% |
| total | 0.05ms | 0.06ms | -0.0065ms | -10.72% |

