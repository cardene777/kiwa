# Perf Suite — dapp

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| eventEmitterEmit | 0.00017ms | 0.00080ms | 5ms | 0.00035ms | PASS | stable (検知には +0.00035ms (baseline 比 +167%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| anvilKeyLookup | 0.00013ms | 0.00076ms | 5ms | 0.00034ms | PASS | stable (差 0.000038ms が下限 0.00034ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| eventEmitterEmit | cpu | 0.08ms | 0.00017ms | 0.002 | 0.002 | 0.00017ms | 0.00021ms |
| anvilKeyLookup | cpu | 0.08ms | 0.00013ms | 0.002 | 0.002 | 0.00013ms | 0.00017ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| eventEmitterEmit | 0.01ms | 10ms | PASS |
| anvilKeyLookup | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| eventEmitterEmit | -46400 B | 0 B | 102400 B | yes | PASS |
| anvilKeyLookup | -2456 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### eventEmitterEmit

# Perf Report — eventEmitterEmit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00080ms |
| p99 | 0.0043ms |
| mean | 0.00038ms |
| stdev | 0.00079ms |
| min | 0.00017ms |
| max | 0.0073ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00021ms | -0.000041ms | -19.71% |
| p50 | 0.00021ms | 0.00025ms | -0.000042ms | -16.80% |
| p95 | 0.00080ms | 0.00080ms | 0.00ms | 0.00% |
| p99 | 0.0043ms | 0.0048ms | -0.00059ms | -12.13% |
| mean | 0.00038ms | 0.00047ms | -0.000088ms | -18.67% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.0073ms | 0.02ms | -0.01ms | -58.53% |
| total | 0.08ms | 0.09ms | -0.02ms | -18.67% |

### anvilKeyLookup

# Perf Report — anvilKeyLookup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00076ms |
| p99 | 0.0030ms |
| mean | 0.00027ms |
| stdev | 0.00052ms |
| min | 0.00013ms |
| max | 0.0046ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00017ms | -0.000041ms | -24.70% |
| p50 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p95 | 0.00076ms | 0.00029ms | +0.00047ms | +159.31% |
| p99 | 0.0030ms | 0.0039ms | -0.00090ms | -23.31% |
| mean | 0.00027ms | 0.00029ms | -0.000018ms | -6.22% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0046ms | 0.0076ms | -0.0030ms | -39.90% |
| total | 0.05ms | 0.06ms | -0.0036ms | -6.22% |

