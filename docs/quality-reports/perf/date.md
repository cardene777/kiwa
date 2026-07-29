# Perf Suite — date

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| addDays | 0.00021ms | 0.0021ms | 5ms | 0.00034ms | PASS | stable (検知には +0.00034ms (baseline 比 +161%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| formatDate | 0.00088ms | 0.0085ms | 5ms | 0.00033ms | PASS | stable (p10 -6% (閾値未満)、 p95 +25% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| createDateClient | 0.00029ms | 0.00096ms | 5ms | 0.00035ms | PASS | stable (検知には +0.00035ms (baseline 比 +104%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| addDays | cpu | 0.08ms | 0.00021ms | 0.003 | 0.003 | 0.00021ms | 0.00021ms |
| formatDate | cpu | 0.08ms | 0.00088ms | 0.011 | 0.011 | 0.00086ms | 0.00092ms |
| createDateClient | cpu | 0.08ms | 0.00029ms | 0.004 | 0.004 | 0.00030ms | 0.00033ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| addDays | 0.01ms | 10ms | PASS |
| formatDate | 0.02ms | 10ms | PASS |
| createDateClient | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| addDays | -19584 B | 0 B | 102400 B | yes | PASS |
| formatDate | -19544 B | 0 B | 102400 B | yes | PASS |
| createDateClient | 16624 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### addDays

# Perf Report — addDays.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00023ms |
| p95 | 0.0021ms |
| p99 | 0.0075ms |
| mean | 0.00061ms |
| stdev | 0.0013ms |
| min | 0.00017ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p50 | 0.00023ms | 0.00025ms | -0.000021ms | -8.20% |
| p95 | 0.0021ms | 0.0013ms | +0.00084ms | +64.60% |
| p99 | 0.0075ms | 0.0077ms | -0.00018ms | -2.31% |
| mean | 0.00061ms | 0.00054ms | +0.000067ms | +12.30% |
| min | 0.00017ms | 0.00021ms | -0.000042ms | -20.19% |
| max | 0.01ms | 0.01ms | +0.00092ms | +8.80% |
| total | 0.12ms | 0.11ms | +0.01ms | +12.30% |

### formatDate

# Perf Report — formatDate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.0010ms |
| p95 | 0.0085ms |
| p99 | 0.03ms |
| mean | 0.0023ms |
| stdev | 0.0057ms |
| min | 0.00083ms |
| max | 0.06ms |
| total | 0.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00088ms | 0.00092ms | -0.000042ms | -4.57% |
| p50 | 0.0010ms | 0.0010ms | -0.000041ms | -3.94% |
| p95 | 0.0085ms | 0.0067ms | +0.0018ms | +27.50% |
| p99 | 0.03ms | 0.02ms | +0.0087ms | +52.16% |
| mean | 0.0023ms | 0.0019ms | +0.00046ms | +24.18% |
| min | 0.00083ms | 0.00083ms | -0.0000010ms | -0.12% |
| max | 0.06ms | 0.03ms | +0.03ms | +123.08% |
| total | 0.47ms | 0.38ms | +0.09ms | +24.18% |

### createDateClient

# Perf Report — createDateClient.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00096ms |
| p99 | 0.0092ms |
| mean | 0.00079ms |
| stdev | 0.0031ms |
| min | 0.00029ms |
| max | 0.03ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000041ms | -12.34% |
| p50 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p95 | 0.00096ms | 0.0035ms | -0.0025ms | -72.39% |
| p99 | 0.0092ms | 0.01ms | -0.0021ms | -18.62% |
| mean | 0.00079ms | 0.00090ms | -0.00011ms | -11.97% |
| min | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| max | 0.03ms | 0.02ms | +0.0074ms | +31.78% |
| total | 0.16ms | 0.18ms | -0.02ms | -11.97% |

