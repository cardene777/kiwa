# Perf Suite — observability

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| collectRunHistory | 0.01ms | 0.03ms | 5ms | 0.00032ms | PASS | stable — gate 無効 (regressionGate=false) |
| detectFlaky | 0.0047ms | 0.02ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| checkThresholds | 0.00025ms | 0.0010ms | 5ms | 0.00034ms | PASS | stable (検知には +0.00034ms (baseline 比 +161%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| renderDashboard | 0.0018ms | 0.0024ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| collectRunHistory | cpu | 0.08ms | 0.01ms | 0.180 | 0.204 | 0.01ms | 0.02ms |
| detectFlaky | cpu | 0.08ms | 0.0047ms | 0.058 | 0.061 | 0.0047ms | 0.0050ms |
| checkThresholds | cpu | 0.08ms | 0.00025ms | 0.003 | 0.003 | 0.00025ms | 0.00021ms |
| renderDashboard | cpu | 0.08ms | 0.0018ms | 0.022 | 0.022 | 0.0018ms | 0.0018ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| collectRunHistory | 0.19ms | 10ms | PASS |
| detectFlaky | 0.07ms | 10ms | PASS |
| checkThresholds | 0.01ms | 10ms | PASS |
| renderDashboard | 0.03ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| collectRunHistory | 3984 B | 0 B | 102400 B | yes | PASS |
| detectFlaky | -16256 B | 0 B | 102400 B | yes | PASS |
| checkThresholds | 1648 B | 0 B | 102400 B | yes | PASS |
| renderDashboard | -184 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### collectRunHistory

# Perf Report — collectRunHistory.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.27ms |
| total | 3.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0015ms | -9.42% |
| p50 | 0.02ms | 0.02ms | -0.00075ms | -4.30% |
| p95 | 0.03ms | 0.04ms | -0.0066ms | -18.58% |
| p99 | 0.04ms | 0.08ms | -0.04ms | -47.70% |
| mean | 0.02ms | 0.02ms | -0.0022ms | -10.53% |
| min | 0.01ms | 0.01ms | -0.00017ms | -1.15% |
| max | 0.27ms | 0.28ms | -0.0047ms | -1.70% |
| total | 3.79ms | 4.23ms | -0.45ms | -10.53% |

### detectFlaky

# Perf Report — detectFlaky.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0047ms |
| p50 | 0.0049ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0057ms |
| stdev | 0.0028ms |
| min | 0.0045ms |
| max | 0.02ms |
| total | 1.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0047ms | 0.0050ms | -0.00029ms | -5.79% |
| p50 | 0.0049ms | 0.0051ms | -0.00027ms | -5.28% |
| p95 | 0.02ms | 0.01ms | +0.00042ms | +2.85% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -49.85% |
| mean | 0.0057ms | 0.0069ms | -0.0012ms | -18.00% |
| min | 0.0045ms | 0.0048ms | -0.00025ms | -5.24% |
| max | 0.02ms | 0.07ms | -0.05ms | -69.05% |
| total | 1.13ms | 1.38ms | -0.25ms | -18.00% |

### checkThresholds

# Perf Report — checkThresholds.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00038ms |
| p95 | 0.0010ms |
| p99 | 0.0058ms |
| mean | 0.00062ms |
| stdev | 0.0017ms |
| min | 0.00017ms |
| max | 0.02ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00021ms | +0.000041ms | +19.62% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.0010ms | 0.00081ms | +0.00023ms | +28.78% |
| p99 | 0.0058ms | 0.0058ms | +0.0000077ms | +0.13% |
| mean | 0.00062ms | 0.00065ms | -0.000028ms | -4.37% |
| min | 0.00017ms | 0.00017ms | +0.0000010ms | +0.60% |
| max | 0.02ms | 0.02ms | +0.0047ms | +28.64% |
| total | 0.12ms | 0.13ms | -0.0057ms | -4.37% |

### renderDashboard

# Perf Report — renderDashboard.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0018ms |
| p95 | 0.0024ms |
| p99 | 0.01ms |
| mean | 0.0022ms |
| stdev | 0.0017ms |
| min | 0.0018ms |
| max | 0.02ms |
| total | 0.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0018ms | +0.0000041ms | +0.23% |
| p50 | 0.0018ms | 0.0019ms | -0.000041ms | -2.21% |
| p95 | 0.0024ms | 0.0048ms | -0.0024ms | -49.60% |
| p99 | 0.01ms | 0.02ms | -0.0088ms | -42.77% |
| mean | 0.0022ms | 0.0026ms | -0.00038ms | -14.96% |
| min | 0.0018ms | 0.0018ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | -0.0056ms | -24.86% |
| total | 0.43ms | 0.51ms | -0.08ms | -14.96% |

