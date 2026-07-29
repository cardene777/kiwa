# Perf Suite — security

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| buildCspHeader | 0.0046ms | 0.06ms | 5ms | 0.00032ms | PASS | regressed — gate 無効 (regressionGate=false) |
| validateNonce | 0.00017ms | 0.0016ms | 5ms | 0.00034ms | PASS | stable (検知には +0.00034ms (baseline 比 +164%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| buildCspHeader | cpu | 0.08ms | 0.0046ms | 0.055 | 0.043 | 0.0045ms | 0.0035ms |
| validateNonce | cpu | 0.08ms | 0.00017ms | 0.002 | 0.003 | 0.00017ms | 0.00021ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| buildCspHeader | 0.14ms | 10ms | PASS |
| validateNonce | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| buildCspHeader | -1312 B | 0 B | 102400 B | yes | PASS |
| validateNonce | -3056 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### buildCspHeader

# Perf Report — buildCspHeader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0046ms |
| p50 | 0.0096ms |
| p95 | 0.06ms |
| p99 | 0.12ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.0025ms |
| max | 0.17ms |
| total | 3.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0046ms | 0.0035ms | +0.0011ms | +32.35% |
| p50 | 0.0096ms | 0.0050ms | +0.0046ms | +93.30% |
| p95 | 0.06ms | 0.02ms | +0.04ms | +271.82% |
| p99 | 0.12ms | 0.03ms | +0.09ms | +290.79% |
| mean | 0.02ms | 0.0064ms | +0.01ms | +179.10% |
| min | 0.0025ms | 0.0025ms | +0.000042ms | +1.68% |
| max | 0.17ms | 0.06ms | +0.10ms | +162.94% |
| total | 3.59ms | 1.29ms | +2.30ms | +179.10% |

### validateNonce

# Perf Report — validateNonce.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.0016ms |
| p99 | 0.0033ms |
| mean | 0.00043ms |
| stdev | 0.0011ms |
| min | 0.00017ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00021ms | -0.000041ms | -19.71% |
| p50 | 0.00021ms | 0.00025ms | -0.000041ms | -16.40% |
| p95 | 0.0016ms | 0.0022ms | -0.00060ms | -27.23% |
| p99 | 0.0033ms | 0.0088ms | -0.0055ms | -62.94% |
| mean | 0.00043ms | 0.00059ms | -0.00016ms | -27.15% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00087ms | +7.89% |
| total | 0.09ms | 0.12ms | -0.03ms | -27.15% |

