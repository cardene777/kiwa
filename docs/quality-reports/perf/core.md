# Perf Suite — core

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| parseSpec | 0.0025ms | 0.0075ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| createPool | 0.0012ms | 0.0047ms | 5ms | 0.00032ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| parseSpec | cpu | 0.08ms | 0.0025ms | 0.031 | 0.032 | 0.0025ms | 0.0026ms |
| createPool | cpu | 0.08ms | 0.0012ms | 0.014 | 0.014 | 0.0011ms | 0.0011ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| parseSpec | 0.04ms | 10ms | PASS |
| createPool | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| parseSpec | 1432 B | 0 B | 102400 B | yes | PASS |
| createPool | 5880 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### parseSpec

# Perf Report — parseSpec.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0025ms |
| p50 | 0.0038ms |
| p95 | 0.0075ms |
| p99 | 0.01ms |
| mean | 0.0042ms |
| stdev | 0.0025ms |
| min | 0.0025ms |
| max | 0.02ms |
| total | 0.84ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0025ms | 0.0026ms | -0.000041ms | -1.59% |
| p50 | 0.0038ms | 0.0037ms | +0.000083ms | +2.21% |
| p95 | 0.0075ms | 0.0081ms | -0.00062ms | -7.62% |
| p99 | 0.01ms | 0.02ms | -0.0077ms | -37.80% |
| mean | 0.0042ms | 0.0043ms | -0.00012ms | -2.72% |
| min | 0.0025ms | 0.0025ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.03ms | -0.0098ms | -28.85% |
| total | 0.84ms | 0.87ms | -0.02ms | -2.72% |

### createPool

# Perf Report — createPool.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0012ms |
| p50 | 0.0013ms |
| p95 | 0.0047ms |
| p99 | 0.02ms |
| mean | 0.0020ms |
| stdev | 0.0027ms |
| min | 0.0011ms |
| max | 0.02ms |
| total | 0.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0012ms | 0.0011ms | +0.000083ms | +7.66% |
| p50 | 0.0013ms | 0.0013ms | 0.00ms | 0.00% |
| p95 | 0.0047ms | 0.0040ms | +0.00063ms | +15.49% |
| p99 | 0.02ms | 0.01ms | +0.0029ms | +21.08% |
| mean | 0.0020ms | 0.0020ms | -0.0000052ms | -0.27% |
| min | 0.0011ms | 0.0010ms | +0.00012ms | +12.50% |
| max | 0.02ms | 0.03ms | -0.02ms | -44.03% |
| total | 0.39ms | 0.39ms | -0.0010ms | -0.27% |

