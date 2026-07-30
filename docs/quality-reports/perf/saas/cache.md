# Perf Suite — cache

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| redisEnvAccessor | 0.00013ms | 0.0018ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| memcachedEnvAccessor | 0.00013ms | 0.00021ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +264%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| keydbEnvAccessor | 0.00013ms | 0.00025ms | 5ms | 0.00034ms | PASS | stable (検知には +0.00034ms (baseline 比 +270%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| redisEnvAccessor | cpu | 0.08ms | 0.11ms | 0.00013ms | 0.002 | 0.002 | 0.00012ms | 0.00013ms |
| memcachedEnvAccessor | cpu | 0.08ms | 0.10ms | 0.00013ms | 0.002 | 0.002 | 0.00012ms | 0.00013ms |
| keydbEnvAccessor | cpu | 0.08ms | 0.09ms | 0.00013ms | 0.002 | 0.002 | 0.00013ms | 0.00013ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| redisEnvAccessor | 0.00ms | 10ms | PASS |
| memcachedEnvAccessor | 0.01ms | 10ms | PASS |
| keydbEnvAccessor | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| redisEnvAccessor | -18624 B | 0 B | 102400 B | yes | PASS |
| memcachedEnvAccessor | -16432 B | 0 B | 102400 B | yes | PASS |
| keydbEnvAccessor | 744 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### redisEnvAccessor

# Perf Report — redisEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.0018ms |
| p99 | 0.0040ms |
| mean | 0.00040ms |
| stdev | 0.0012ms |
| min | 0.000083ms |
| max | 0.01ms |
| total | 0.08ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.998)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00012ms | 0.00013ms | -3.1e-7ms | -0.25% |
| p50 | 0.00017ms | 0.00017ms | -4.1e-7ms | -0.25% |
| p95 | 0.0017ms | 0.0012ms | +0.00058ms | +49.68% |
| p99 | 0.0040ms | 0.0031ms | +0.00093ms | +30.44% |
| mean | 0.00040ms | 0.00030ms | +0.000094ms | +30.77% |
| min | 0.000083ms | 0.00013ms | -0.000042ms | -33.76% |
| max | 0.01ms | 0.0068ms | +0.0071ms | +103.77% |
| total | 0.08ms | 0.06ms | +0.02ms | +30.77% |

### memcachedEnvAccessor

# Perf Report — memcachedEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00021ms |
| p99 | 0.0016ms |
| mean | 0.00021ms |
| stdev | 0.00042ms |
| min | 0.00013ms |
| max | 0.0053ms |
| total | 0.04ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.989)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00012ms | 0.00013ms | -0.0000013ms | -1.06% |
| p50 | 0.00016ms | 0.00013ms | +0.000039ms | +31.39% |
| p95 | 0.00021ms | 0.00025ms | -0.000041ms | -16.48% |
| p99 | 0.0016ms | 0.0019ms | -0.00024ms | -12.72% |
| mean | 0.00021ms | 0.00020ms | +0.0000032ms | +1.60% |
| min | 0.00012ms | 0.000084ms | +0.000040ms | +47.23% |
| max | 0.0052ms | 0.0045ms | +0.00069ms | +15.43% |
| total | 0.04ms | 0.04ms | +0.00065ms | +1.60% |

### keydbEnvAccessor

# Perf Report — keydbEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00025ms |
| p99 | 0.0037ms |
| mean | 0.00032ms |
| stdev | 0.0014ms |
| min | 0.000083ms |
| max | 0.02ms |
| total | 0.06ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.009)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | +0.0000012ms | +0.92% |
| p50 | 0.00013ms | 0.00013ms | +0.0000012ms | +0.92% |
| p95 | 0.00025ms | 0.00026ms | -0.0000019ms | -0.73% |
| p99 | 0.0038ms | 0.0034ms | +0.00038ms | +11.39% |
| mean | 0.00032ms | 0.00030ms | +0.000020ms | +6.47% |
| min | 0.000084ms | 0.000083ms | +7.7e-7ms | +0.92% |
| max | 0.02ms | 0.02ms | -0.0012ms | -6.30% |
| total | 0.06ms | 0.06ms | +0.0039ms | +6.47% |

