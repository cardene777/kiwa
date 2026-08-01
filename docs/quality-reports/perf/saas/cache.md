# Perf Suite — cache

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| redisEnvAccessor | 0.00013ms | 0.0010ms | 5ms | 0.00030ms | PASS | stable (検知には +0.00030ms (baseline 比 +238%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| memcachedEnvAccessor | 0.00017ms | 0.0017ms | 5ms | 0.00029ms | PASS | stable (検知には +0.00029ms (baseline 比 +234%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| keydbEnvAccessor | 0.00013ms | 0.00034ms | 5ms | 0.00029ms | PASS | stable (検知には +0.00029ms (baseline 比 +233%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| redisEnvAccessor | cpu | 0.09ms | 0.12ms | 0.00013ms | 0.001 | 0.002 | n/a | 20.0% | 0.00011ms | 0.00013ms |
| memcachedEnvAccessor | cpu | 0.09ms | 0.13ms | 0.00017ms | 0.002 | 0.002 | n/a | 20.0% | 0.00015ms | 0.00013ms |
| keydbEnvAccessor | cpu | 0.09ms | 0.09ms | 0.00013ms | 0.001 | 0.002 | n/a | 20.0% | 0.00011ms | 0.00013ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| redisEnvAccessor | 0.01ms | 10ms | PASS |
| memcachedEnvAccessor | 0.01ms | 10ms | PASS |
| keydbEnvAccessor | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| redisEnvAccessor | -20848 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| memcachedEnvAccessor | -15104 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| keydbEnvAccessor | 1648 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### redisEnvAccessor

# Perf Report — redisEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.0010ms |
| p99 | 0.0032ms |
| mean | 0.00037ms |
| stdev | 0.0013ms |
| min | 0.00013ms |
| max | 0.02ms |
| total | 0.07ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.891)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00011ms | 0.00013ms | -0.000014ms | -10.90% |
| p50 | 0.00015ms | 0.00017ms | -0.000018ms | -10.90% |
| p95 | 0.00090ms | 0.0012ms | -0.00027ms | -22.99% |
| p99 | 0.0028ms | 0.0031ms | -0.00024ms | -7.79% |
| mean | 0.00033ms | 0.00030ms | +0.000026ms | +8.63% |
| min | 0.00011ms | 0.00013ms | -0.000014ms | -10.90% |
| max | 0.02ms | 0.0068ms | +0.0085ms | +124.94% |
| total | 0.07ms | 0.06ms | +0.0053ms | +8.63% |

### memcachedEnvAccessor

# Perf Report — memcachedEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.0017ms |
| p99 | 0.0034ms |
| mean | 0.00043ms |
| stdev | 0.00064ms |
| min | 0.00013ms |
| max | 0.0037ms |
| total | 0.09ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.874)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00015ms | 0.00013ms | +0.000020ms | +16.09% |
| p50 | 0.00015ms | 0.00013ms | +0.000021ms | +16.79% |
| p95 | 0.0015ms | 0.00025ms | +0.0012ms | +498.70% |
| p99 | 0.0030ms | 0.0019ms | +0.0011ms | +59.43% |
| mean | 0.00038ms | 0.00020ms | +0.00018ms | +87.43% |
| min | 0.00011ms | 0.000084ms | +0.000025ms | +30.08% |
| max | 0.0033ms | 0.0045ms | -0.0012ms | -27.15% |
| total | 0.08ms | 0.04ms | +0.04ms | +87.43% |

### keydbEnvAccessor

# Perf Report — keydbEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00034ms |
| p99 | 0.0033ms |
| mean | 0.00032ms |
| stdev | 0.0014ms |
| min | 0.00013ms |
| max | 0.02ms |
| total | 0.06ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.873)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00011ms | 0.00013ms | -0.000016ms | -12.69% |
| p50 | 0.00015ms | 0.00013ms | +0.000021ms | +16.65% |
| p95 | 0.00029ms | 0.00026ms | +0.000037ms | +14.50% |
| p99 | 0.0029ms | 0.0034ms | -0.00048ms | -14.26% |
| mean | 0.00028ms | 0.00030ms | -0.000021ms | -6.80% |
| min | 0.00011ms | 0.000083ms | +0.000026ms | +31.49% |
| max | 0.02ms | 0.02ms | -0.0038ms | -19.12% |
| total | 0.06ms | 0.06ms | -0.0041ms | -6.80% |

