# Perf Suite — agent-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | 0.0018ms | 0.01ms | 50ms | 0.00051ms | PASS | stable — gate 無効 (regressionGate=false) |
| multi_thread_conversation (5 thread × 3 message) | 0.0081ms | 0.01ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| tool_call_chain (10 toolCall build) | 0.0016ms | 0.0018ms | 30ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | cpu | 0.08ms | 0.09ms | 0.0018ms | 0.022 | 0.022 | 0.0019ms | 0.0018ms |
| multi_thread_conversation (5 thread × 3 message) | cpu | 0.08ms | 0.09ms | 0.0081ms | 0.099 | 0.076 | 0.0081ms | 0.0062ms |
| tool_call_chain (10 toolCall build) | cpu | 0.08ms | 0.08ms | 0.0016ms | 0.019 | 0.019 | 0.0016ms | 0.0016ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | 0.01ms | 100ms | PASS |
| multi_thread_conversation (5 thread × 3 message) | 0.06ms | 200ms | PASS |
| tool_call_chain (10 toolCall build) | 0.01ms | 60ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | -6160 B | 0 B | 102400 B | yes | PASS |
| multi_thread_conversation (5 thread × 3 message) | -5104 B | 0 B | 102400 B | yes | PASS |
| tool_call_chain (10 toolCall build) | 8976 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### assistant_run_cycle (create + thread + run + poll)

# Perf Report — assistant_run_cycle (create + thread + run + poll).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0018ms |
| p50 | 0.0032ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0062ms |
| stdev | 0.0061ms |
| min | 0.0018ms |
| max | 0.03ms |
| total | 0.12ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.014)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0018ms | +0.000031ms | +1.70% |
| p50 | 0.0032ms | 0.0031ms | +0.00017ms | +5.56% |
| p95 | 0.01ms | 0.01ms | +0.00065ms | +4.80% |
| p99 | 0.02ms | 0.02ms | +0.000059ms | +0.25% |
| mean | 0.0062ms | 0.0063ms | -0.000075ms | -1.19% |
| min | 0.0018ms | 0.0018ms | +0.000066ms | +3.79% |
| max | 0.03ms | 0.03ms | -0.000090ms | -0.34% |
| total | 0.12ms | 0.13ms | -0.0015ms | -1.19% |

### multi_thread_conversation (5 thread × 3 message)

# Perf Report — multi_thread_conversation (5 thread × 3 message).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0081ms |
| p50 | 0.0092ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0032ms |
| min | 0.0075ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.999)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0081ms | 0.0062ms | +0.0019ms | +30.15% |
| p50 | 0.0092ms | 0.0071ms | +0.0021ms | +30.14% |
| p95 | 0.01ms | 0.01ms | +0.0031ms | +28.13% |
| p99 | 0.02ms | 0.01ms | +0.0073ms | +57.56% |
| mean | 0.01ms | 0.0076ms | +0.0027ms | +35.44% |
| min | 0.0074ms | 0.0062ms | +0.0013ms | +20.80% |
| max | 0.02ms | 0.01ms | +0.0084ms | +63.83% |
| total | 0.21ms | 0.15ms | +0.05ms | +35.44% |

### tool_call_chain (10 toolCall build)

# Perf Report — tool_call_chain (10 toolCall build).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0016ms |
| p50 | 0.0016ms |
| p95 | 0.0018ms |
| p99 | 0.0021ms |
| mean | 0.0017ms |
| stdev | 0.00013ms |
| min | 0.0016ms |
| max | 0.0022ms |
| total | 0.03ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.000)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0016ms | 0.0016ms | -1.9e-9ms | -0.00% |
| p50 | 0.0016ms | 0.0016ms | +0.000020ms | +1.28% |
| p95 | 0.0018ms | 0.0024ms | -0.00058ms | -24.35% |
| p99 | 0.0021ms | 0.0033ms | -0.0012ms | -36.08% |
| mean | 0.0017ms | 0.0017ms | -0.000079ms | -4.53% |
| min | 0.0016ms | 0.0015ms | +0.000041ms | +2.66% |
| max | 0.0022ms | 0.0035ms | -0.0013ms | -38.09% |
| total | 0.03ms | 0.03ms | -0.0016ms | -4.53% |

