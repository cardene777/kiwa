# Perf Suite — api

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| requestClientGet | 0.0091ms | 0.03ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| requestClientPost | 0.0077ms | 0.03ms | 5ms | 0.00032ms | PASS | stable (p10 +7% (閾値未満)、 p95 +136% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| requestClientGet | cpu | 0.08ms | 0.0091ms | 0.111 | 0.116 | 0.0090ms | 0.0094ms |
| requestClientPost | cpu | 0.08ms | 0.0077ms | 0.092 | 0.086 | 0.0074ms | 0.0069ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| requestClientGet | 0.14ms | 10ms | PASS |
| requestClientPost | 0.15ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| requestClientGet | -16600 B | -19838 B | 102400 B | yes | PASS |
| requestClientPost | 584 B | -10469 B | 102400 B | yes | PASS |

## Detailed serial reports

### requestClientGet

# Perf Report — requestClientGet.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0091ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.11ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.0086ms |
| max | 0.13ms |
| total | 2.93ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0091ms | 0.0094ms | -0.00025ms | -2.62% |
| p50 | 0.01ms | 0.01ms | -0.00046ms | -4.18% |
| p95 | 0.03ms | 0.04ms | -0.0097ms | -23.44% |
| p99 | 0.11ms | 0.10ms | +0.0087ms | +8.98% |
| mean | 0.01ms | 0.02ms | -0.0010ms | -6.54% |
| min | 0.0086ms | 0.0087ms | -0.000083ms | -0.95% |
| max | 0.13ms | 0.13ms | -0.00071ms | -0.53% |
| total | 2.93ms | 3.13ms | -0.20ms | -6.54% |

### requestClientPost

# Perf Report — requestClientPost.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0077ms |
| p50 | 0.0086ms |
| p95 | 0.03ms |
| p99 | 0.10ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.0074ms |
| max | 0.25ms |
| total | 2.96ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0077ms | 0.0069ms | +0.00075ms | +10.84% |
| p50 | 0.0086ms | 0.0074ms | +0.0012ms | +16.67% |
| p95 | 0.03ms | 0.01ms | +0.02ms | +144.33% |
| p99 | 0.10ms | 0.03ms | +0.06ms | +184.44% |
| mean | 0.01ms | 0.0090ms | +0.0058ms | +64.85% |
| min | 0.0074ms | 0.0068ms | +0.00062ms | +9.20% |
| max | 0.25ms | 0.13ms | +0.12ms | +98.49% |
| total | 2.96ms | 1.80ms | +1.17ms | +64.85% |

