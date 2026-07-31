# Perf Suite — cache

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| redisEnvAccessor | 0.00013ms | 0.0012ms | 5ms | 0.00034ms | PASS | stable (検知には +0.00034ms (baseline 比 +273%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| memcachedEnvAccessor | 0.00013ms | 0.00025ms | 5ms | 0.00034ms | PASS | stable (検知には +0.00034ms (baseline 比 +269%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| keydbEnvAccessor | 0.00013ms | 0.00030ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +265%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| redisEnvAccessor | cpu | 0.08ms | 0.09ms | 0.00013ms | 0.002 | 0.002 | 0.00013ms | 0.00013ms |
| memcachedEnvAccessor | cpu | 0.08ms | 0.08ms | 0.00013ms | 0.002 | 0.002 | 0.00013ms | 0.00013ms |
| keydbEnvAccessor | cpu | 0.08ms | 0.08ms | 0.00013ms | 0.002 | 0.002 | 0.00012ms | 0.00013ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| redisEnvAccessor | 0.01ms | 10ms | PASS |
| memcachedEnvAccessor | 0.01ms | 10ms | PASS |
| keydbEnvAccessor | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| redisEnvAccessor | -15496 B | 0 B | 102400 B | yes | PASS |
| memcachedEnvAccessor | -16432 B | 0 B | 102400 B | yes | PASS |
| keydbEnvAccessor | 648 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### redisEnvAccessor

# Perf Report — redisEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.0012ms |
| p99 | 0.0040ms |
| mean | 0.00032ms |
| stdev | 0.00063ms |
| min | 0.00013ms |
| max | 0.0042ms |
| total | 0.06ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.030)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | +0.0000037ms | +2.95% |
| p50 | 0.00017ms | 0.00017ms | +0.0000049ms | +2.95% |
| p95 | 0.0013ms | 0.0012ms | +0.000081ms | +6.94% |
| p99 | 0.0042ms | 0.0031ms | +0.0011ms | +35.61% |
| mean | 0.00033ms | 0.00030ms | +0.000024ms | +7.75% |
| min | 0.00013ms | 0.00013ms | +0.0000037ms | +2.95% |
| max | 0.0043ms | 0.0068ms | -0.0025ms | -37.23% |
| total | 0.07ms | 0.06ms | +0.0047ms | +7.75% |

### memcachedEnvAccessor

# Perf Report — memcachedEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00025ms |
| p99 | 0.0018ms |
| mean | 0.00020ms |
| stdev | 0.00038ms |
| min | 0.00013ms |
| max | 0.0046ms |
| total | 0.04ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.012)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | +0.0000016ms | +1.25% |
| p50 | 0.00013ms | 0.00013ms | +0.0000016ms | +1.25% |
| p95 | 0.00026ms | 0.00025ms | +0.0000052ms | +2.10% |
| p99 | 0.0018ms | 0.0019ms | -0.000030ms | -1.62% |
| mean | 0.00020ms | 0.00020ms | -4.6e-7ms | -0.23% |
| min | 0.00013ms | 0.000084ms | +0.000043ms | +50.66% |
| max | 0.0047ms | 0.0045ms | +0.00018ms | +4.06% |
| total | 0.04ms | 0.04ms | -0.000093ms | -0.23% |

### keydbEnvAccessor

# Perf Report — keydbEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00030ms |
| p99 | 0.0023ms |
| mean | 0.00028ms |
| stdev | 0.0011ms |
| min | 0.000083ms |
| max | 0.02ms |
| total | 0.06ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.998)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00012ms | 0.00013ms | -2.0e-7ms | -0.16% |
| p50 | 0.00012ms | 0.00013ms | -2.0e-7ms | -0.16% |
| p95 | 0.00030ms | 0.00026ms | +0.000039ms | +15.39% |
| p99 | 0.0023ms | 0.0034ms | -0.0011ms | -33.30% |
| mean | 0.00028ms | 0.00030ms | -0.000021ms | -6.79% |
| min | 0.000083ms | 0.000083ms | -1.3e-7ms | -0.16% |
| max | 0.02ms | 0.02ms | -0.0041ms | -20.76% |
| total | 0.06ms | 0.06ms | -0.0041ms | -6.79% |

