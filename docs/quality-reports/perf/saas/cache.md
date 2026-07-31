# Perf Suite — cache

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| redisEnvAccessor | 0.00013ms | 0.00093ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +262%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| memcachedEnvAccessor | 0.00013ms | 0.0023ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +264%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| keydbEnvAccessor | 0.00013ms | 0.00072ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +262%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| redisEnvAccessor | cpu | 0.08ms | 0.09ms | 0.00013ms | 0.001 | 0.002 | 0.00012ms | 0.00013ms |
| memcachedEnvAccessor | cpu | 0.08ms | 0.14ms | 0.00013ms | 0.002 | 0.002 | 0.00012ms | 0.00013ms |
| keydbEnvAccessor | cpu | 0.08ms | 0.09ms | 0.00013ms | 0.002 | 0.002 | 0.00012ms | 0.00013ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| redisEnvAccessor | 0.01ms | 10ms | PASS |
| memcachedEnvAccessor | 0.00ms | 10ms | PASS |
| keydbEnvAccessor | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| redisEnvAccessor | -19408 B | 0 B | 102400 B | yes | PASS |
| memcachedEnvAccessor | -16280 B | 0 B | 102400 B | yes | PASS |
| keydbEnvAccessor | 2776 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### redisEnvAccessor

# Perf Report — redisEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00093ms |
| p99 | 0.0023ms |
| mean | 0.00028ms |
| stdev | 0.00055ms |
| min | 0.00013ms |
| max | 0.0063ms |
| total | 0.06ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.988)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00012ms | 0.00013ms | -0.0000015ms | -1.19% |
| p50 | 0.00017ms | 0.00017ms | -9.9e-7ms | -0.60% |
| p95 | 0.00091ms | 0.0012ms | -0.00025ms | -21.79% |
| p99 | 0.0023ms | 0.0031ms | -0.00080ms | -26.17% |
| mean | 0.00028ms | 0.00030ms | -0.000024ms | -7.75% |
| min | 0.00012ms | 0.00013ms | -0.0000015ms | -1.19% |
| max | 0.0062ms | 0.0068ms | -0.00062ms | -9.03% |
| total | 0.06ms | 0.06ms | -0.0047ms | -7.75% |

### memcachedEnvAccessor

# Perf Report — memcachedEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.0023ms |
| p99 | 0.0034ms |
| mean | 0.00053ms |
| stdev | 0.0022ms |
| min | 0.00013ms |
| max | 0.03ms |
| total | 0.11ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.994)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00012ms | 0.00013ms | -7.0e-7ms | -0.56% |
| p50 | 0.00017ms | 0.00013ms | +0.000041ms | +32.85% |
| p95 | 0.0022ms | 0.00025ms | +0.0020ms | +799.94% |
| p99 | 0.0034ms | 0.0019ms | +0.0016ms | +83.74% |
| mean | 0.00053ms | 0.00020ms | +0.00032ms | +160.18% |
| min | 0.00012ms | 0.000084ms | +0.000040ms | +47.98% |
| max | 0.03ms | 0.0045ms | +0.03ms | +557.42% |
| total | 0.11ms | 0.04ms | +0.06ms | +160.18% |

### keydbEnvAccessor

# Perf Report — keydbEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00072ms |
| p99 | 0.0045ms |
| mean | 0.00041ms |
| stdev | 0.0017ms |
| min | 0.000083ms |
| max | 0.02ms |
| total | 0.08ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.988)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00012ms | 0.00013ms | -0.0000015ms | -1.17% |
| p50 | 0.00012ms | 0.00013ms | -0.0000015ms | -1.17% |
| p95 | 0.00071ms | 0.00026ms | +0.00045ms | +177.35% |
| p99 | 0.0044ms | 0.0034ms | +0.0010ms | +30.56% |
| mean | 0.00040ms | 0.00030ms | +0.000098ms | +32.39% |
| min | 0.000082ms | 0.000083ms | -9.7e-7ms | -1.17% |
| max | 0.02ms | 0.02ms | +0.0019ms | +9.65% |
| total | 0.08ms | 0.06ms | +0.02ms | +32.39% |

