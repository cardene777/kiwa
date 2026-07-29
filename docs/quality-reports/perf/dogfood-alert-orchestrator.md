# Perf Suite — dogfood-alert-orchestrator

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluateRules | 0.0017ms | 0.0069ms | 30ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| routeAlert | 0.00083ms | 0.0059ms | 20ms | 0.00034ms | PASS | stable (p10 +2% (閾値未満)、 p95 +43% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| advanceEscalation | 0.00096ms | 0.0022ms | 20ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| evaluateRules | cpu | 0.08ms | 0.0017ms | 0.021 | 0.023 | 0.0017ms | 0.0019ms |
| routeAlert | cpu | 0.08ms | 0.00083ms | 0.010 | 0.010 | 0.00085ms | 0.00083ms |
| advanceEscalation | cpu | 0.08ms | 0.00096ms | 0.012 | 0.012 | 0.00098ms | 0.0010ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateRules | 0.03ms | 60ms | PASS |
| routeAlert | 0.02ms | 40ms | PASS |
| advanceEscalation | 0.02ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateRules | 15232 B | 0 B | 102400 B | yes | PASS |
| routeAlert | 32840 B | 0 B | 102400 B | yes | PASS |
| advanceEscalation | 23320 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluateRules

# Perf Report — evaluateRules.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0017ms |
| p50 | 0.0019ms |
| p95 | 0.0069ms |
| p99 | 0.0076ms |
| mean | 0.0026ms |
| stdev | 0.0016ms |
| min | 0.0016ms |
| max | 0.0077ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0017ms | 0.0019ms | -0.00025ms | -13.05% |
| p50 | 0.0019ms | 0.0022ms | -0.00027ms | -12.27% |
| p95 | 0.0069ms | 0.0068ms | +0.000062ms | +0.92% |
| p99 | 0.0076ms | 0.02ms | -0.0080ms | -51.33% |
| mean | 0.0026ms | 0.0033ms | -0.00072ms | -21.41% |
| min | 0.0016ms | 0.0018ms | -0.00017ms | -9.27% |
| max | 0.0077ms | 0.02ms | -0.0094ms | -54.86% |
| total | 0.11ms | 0.13ms | -0.03ms | -21.41% |

### routeAlert

# Perf Report — routeAlert.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00083ms |
| p50 | 0.00092ms |
| p95 | 0.0059ms |
| p99 | 0.0085ms |
| mean | 0.0017ms |
| stdev | 0.0019ms |
| min | 0.00079ms |
| max | 0.0085ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00083ms | 0.00083ms | -0.0000041ms | -0.49% |
| p50 | 0.00092ms | 0.00088ms | +0.000042ms | +4.80% |
| p95 | 0.0059ms | 0.0042ms | +0.0017ms | +39.00% |
| p99 | 0.0085ms | 0.0089ms | -0.00043ms | -4.81% |
| mean | 0.0017ms | 0.0015ms | +0.00029ms | +20.08% |
| min | 0.00079ms | 0.00079ms | -0.0000010ms | -0.13% |
| max | 0.0085ms | 0.0091ms | -0.00054ms | -5.97% |
| total | 0.07ms | 0.06ms | +0.01ms | +20.08% |

### advanceEscalation

# Perf Report — advanceEscalation.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00096ms |
| p50 | 0.0010ms |
| p95 | 0.0022ms |
| p99 | 0.0083ms |
| mean | 0.0014ms |
| stdev | 0.0016ms |
| min | 0.00096ms |
| max | 0.0099ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00096ms | 0.0010ms | -0.000042ms | -4.20% |
| p50 | 0.0010ms | 0.0011ms | -0.00010ms | -9.46% |
| p95 | 0.0022ms | 0.0064ms | -0.0042ms | -65.71% |
| p99 | 0.0083ms | 0.02ms | -0.0076ms | -47.82% |
| mean | 0.0014ms | 0.0023ms | -0.00086ms | -37.36% |
| min | 0.00096ms | 0.00096ms | 0.00ms | 0.00% |
| max | 0.0099ms | 0.02ms | -0.01ms | -54.76% |
| total | 0.06ms | 0.09ms | -0.03ms | -37.36% |

