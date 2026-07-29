# Perf Suite — cache

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| redisEnvAccessor | 0.00013ms | 0.00029ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +263%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| memcachedEnvAccessor | 0.00013ms | 0.00025ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +265%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| keydbEnvAccessor | 0.00013ms | 0.0029ms | 5ms | 0.00032ms | PASS | stable (検知には +0.00032ms (baseline 比 +258%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| redisEnvAccessor | cpu | 0.08ms | 0.00013ms | 0.002 | 0.002 | 0.00012ms | 0.00013ms |
| memcachedEnvAccessor | cpu | 0.08ms | 0.00013ms | 0.002 | 0.002 | 0.00012ms | 0.00013ms |
| keydbEnvAccessor | cpu | 0.08ms | 0.00013ms | 0.002 | 0.002 | 0.00012ms | 0.00013ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| redisEnvAccessor | 0.01ms | 10ms | PASS |
| memcachedEnvAccessor | 0.00ms | 10ms | PASS |
| keydbEnvAccessor | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| redisEnvAccessor | -19728 B | 0 B | 102400 B | yes | PASS |
| memcachedEnvAccessor | -15104 B | 0 B | 102400 B | yes | PASS |
| keydbEnvAccessor | 3616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### redisEnvAccessor

# Perf Report — redisEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00029ms |
| p99 | 0.0012ms |
| mean | 0.00021ms |
| stdev | 0.00051ms |
| min | 0.000084ms |
| max | 0.0071ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p95 | 0.00029ms | 0.00046ms | -0.00017ms | -36.75% |
| p99 | 0.0012ms | 0.0033ms | -0.0021ms | -63.14% |
| mean | 0.00021ms | 0.00026ms | -0.000057ms | -21.54% |
| min | 0.000084ms | 0.000084ms | 0.00ms | 0.00% |
| max | 0.0071ms | 0.0083ms | -0.0012ms | -14.15% |
| total | 0.04ms | 0.05ms | -0.01ms | -21.54% |

### memcachedEnvAccessor

# Perf Report — memcachedEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00025ms |
| p99 | 0.00098ms |
| mean | 0.00019ms |
| stdev | 0.00038ms |
| min | 0.000083ms |
| max | 0.0046ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p95 | 0.00025ms | 0.00021ms | +0.000039ms | +18.46% |
| p99 | 0.00098ms | 0.0011ms | -0.000077ms | -7.26% |
| mean | 0.00019ms | 0.00017ms | +0.000017ms | +9.95% |
| min | 0.000083ms | 0.000083ms | 0.00ms | 0.00% |
| max | 0.0046ms | 0.0030ms | +0.0016ms | +52.04% |
| total | 0.04ms | 0.03ms | +0.0035ms | +9.95% |

### keydbEnvAccessor

# Perf Report — keydbEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.0029ms |
| p99 | 0.0050ms |
| mean | 0.00058ms |
| stdev | 0.0022ms |
| min | 0.000083ms |
| max | 0.03ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| p95 | 0.0029ms | 0.00021ms | +0.0027ms | +1270.91% |
| p99 | 0.0050ms | 0.0030ms | +0.0020ms | +67.64% |
| mean | 0.00058ms | 0.00028ms | +0.00030ms | +107.56% |
| min | 0.000083ms | 0.000083ms | 0.00ms | 0.00% |
| max | 0.03ms | 0.02ms | +0.0091ms | +45.44% |
| total | 0.12ms | 0.06ms | +0.06ms | +107.56% |

