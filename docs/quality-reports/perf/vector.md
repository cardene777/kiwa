# Perf Suite — vector

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| upsertOne | 0.00075ms | 0.0025ms | 5ms | 0.00034ms | PASS | stable (p10 -3% (閾値未満)、 p95 +48% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| queryNearestTop5 | 0.0042ms | 0.02ms | 5ms | 0.00032ms | PASS | stable (p10 +8% (閾値未満)、 p95 +53% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| fetchById | 0.00025ms | 0.00038ms | 5ms | 0.00031ms | PASS | stable (検知には +0.00031ms (baseline 比 +147%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| upsertOne | cpu | 0.08ms | 0.00075ms | 0.009 | 0.010 | 0.00076ms | 0.00079ms |
| queryNearestTop5 | cpu | 0.08ms | 0.0042ms | 0.049 | 0.045 | 0.0040ms | 0.0037ms |
| fetchById | cpu | 0.09ms | 0.00025ms | 0.003 | 0.003 | 0.00023ms | 0.00021ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| upsertOne | 0.02ms | 10ms | PASS |
| queryNearestTop5 | 0.05ms | 10ms | PASS |
| fetchById | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| upsertOne | 321904 B | 0 B | 102400 B | yes | PASS |
| queryNearestTop5 | -16280 B | 0 B | 102400 B | yes | PASS |
| fetchById | 648 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### upsertOne

# Perf Report — upsertOne.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00075ms |
| p50 | 0.00083ms |
| p95 | 0.0025ms |
| p99 | 0.0060ms |
| mean | 0.0013ms |
| stdev | 0.0012ms |
| min | 0.00071ms |
| max | 0.01ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00075ms | 0.00079ms | -0.000041ms | -5.18% |
| p50 | 0.00083ms | 0.00083ms | 0.00ms | 0.00% |
| p95 | 0.0025ms | 0.0018ms | +0.00079ms | +45.09% |
| p99 | 0.0060ms | 0.0070ms | -0.0011ms | -15.14% |
| mean | 0.0013ms | 0.0011ms | +0.00019ms | +17.80% |
| min | 0.00071ms | 0.00071ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00087ms | +7.63% |
| total | 0.25ms | 0.21ms | +0.04ms | +17.80% |

### queryNearestTop5

# Perf Report — queryNearestTop5.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0042ms |
| p50 | 0.0045ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0071ms |
| stdev | 0.0059ms |
| min | 0.0038ms |
| max | 0.06ms |
| total | 1.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0042ms | 0.0037ms | +0.00045ms | +12.27% |
| p50 | 0.0045ms | 0.0038ms | +0.00071ms | +18.47% |
| p95 | 0.02ms | 0.0098ms | +0.0058ms | +58.66% |
| p99 | 0.03ms | 0.03ms | -0.0017ms | -6.12% |
| mean | 0.0071ms | 0.0052ms | +0.0019ms | +36.68% |
| min | 0.0038ms | 0.0035ms | +0.00025ms | +7.06% |
| max | 0.06ms | 0.05ms | +0.02ms | +33.30% |
| total | 1.42ms | 1.04ms | +0.38ms | +36.68% |

### fetchById

# Perf Report — fetchById.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00025ms |
| p95 | 0.00038ms |
| p99 | 0.0024ms |
| mean | 0.00037ms |
| stdev | 0.00097ms |
| min | 0.00021ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00021ms | +0.000041ms | +19.62% |
| p50 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p95 | 0.00038ms | 0.00038ms | -0.0000021ms | -0.55% |
| p99 | 0.0024ms | 0.0018ms | +0.00055ms | +30.71% |
| mean | 0.00037ms | 0.00037ms | -2.5e-8ms | -0.01% |
| min | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00067ms | -4.84% |
| total | 0.07ms | 0.07ms | -0.0000050ms | -0.01% |

