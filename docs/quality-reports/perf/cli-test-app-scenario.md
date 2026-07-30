# Perf Suite — cli-test-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 2.89ms | 3.45ms | 500ms | 0.00058ms | PASS | stable — gate 無効 (regressionGate=false) |
| batch_cli_run (5x echo test) | 12.21ms | 17.14ms | 1000ms | 0.00045ms | PASS | stable — gate 無効 (regressionGate=false) |
| setup_cleanup_cycle (5 sequential setup+stop) | 2.04ms | 2.54ms | 500ms | 0.00047ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | fs-write | 0.08ms | 0.12ms | 2.89ms | 36.333 | 37.265 | 3.37ms | 3.45ms |
| batch_cli_run (5x echo test) | cpu | 0.09ms | 0.10ms | 12.21ms | 130.330 | 145.572 | 10.90ms | 12.17ms |
| setup_cleanup_cycle (5 sequential setup+stop) | fs-write | 0.07ms | 0.18ms | 2.04ms | 27.254 | 28.306 | 1.93ms | 2.01ms |

## Concurrent p95 (concurrency = 2, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 5.15ms | 1000ms | PASS |
| batch_cli_run (5x echo test) | 16.33ms | 2000ms | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | 3.18ms | 1000ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | -33376 B | 0 B | 102400 B | yes | WAIVED (fs の Buffer pool の伸びを拾うため実装の保持量を表さない (#1719)) |
| batch_cli_run (5x echo test) | 22912 B | 0 B | 102400 B | yes | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | -25040 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### file_scaffold_workflow (setup + 20 writeFile + listFiles)

# Perf Report — file_scaffold_workflow (setup + 20 writeFile + listFiles).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 2.89ms |
| p50 | 3.07ms |
| p95 | 3.45ms |
| p99 | 3.57ms |
| mean | 3.13ms |
| stdev | 0.22ms |
| min | 2.79ms |
| max | 3.60ms |
| total | 46.98ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.166)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.37ms | 3.45ms | -0.09ms | -2.50% |
| p50 | 3.59ms | 3.92ms | -0.34ms | -8.55% |
| p95 | 4.02ms | 6.89ms | -2.86ms | -41.57% |
| p99 | 4.16ms | 7.14ms | -2.98ms | -41.74% |
| mean | 3.65ms | 4.28ms | -0.63ms | -14.68% |
| min | 3.25ms | 3.29ms | -0.04ms | -1.14% |
| max | 4.19ms | 7.20ms | -3.01ms | -41.78% |
| total | 54.80ms | 64.23ms | -9.43ms | -14.68% |

### batch_cli_run (5x echo test)

# Perf Report — batch_cli_run (5x echo test).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 12.21ms |
| p50 | 12.78ms |
| p95 | 17.14ms |
| p99 | 17.34ms |
| mean | 13.61ms |
| stdev | 1.76ms |
| min | 11.81ms |
| max | 17.39ms |
| total | 204.20ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.892)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 10.90ms | 12.17ms | -1.27ms | -10.47% |
| p50 | 11.40ms | 13.49ms | -2.09ms | -15.52% |
| p95 | 15.30ms | 20.36ms | -5.06ms | -24.85% |
| p99 | 15.47ms | 22.30ms | -6.82ms | -30.61% |
| mean | 12.15ms | 14.97ms | -2.82ms | -18.84% |
| min | 10.54ms | 11.96ms | -1.42ms | -11.91% |
| max | 15.52ms | 22.78ms | -7.27ms | -31.89% |
| total | 182.21ms | 224.49ms | -42.28ms | -18.84% |

### setup_cleanup_cycle (5 sequential setup+stop)

# Perf Report — setup_cleanup_cycle (5 sequential setup+stop).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 2.04ms |
| p50 | 2.23ms |
| p95 | 2.54ms |
| p99 | 2.61ms |
| mean | 2.25ms |
| stdev | 0.20ms |
| min | 2.00ms |
| max | 2.62ms |
| total | 33.78ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.947)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.93ms | 2.01ms | -0.07ms | -3.72% |
| p50 | 2.12ms | 2.24ms | -0.12ms | -5.53% |
| p95 | 2.40ms | 3.03ms | -0.63ms | -20.64% |
| p99 | 2.47ms | 3.14ms | -0.67ms | -21.37% |
| mean | 2.13ms | 2.39ms | -0.25ms | -10.63% |
| min | 1.90ms | 1.98ms | -0.08ms | -4.10% |
| max | 2.49ms | 3.17ms | -0.68ms | -21.54% |
| total | 32.00ms | 35.81ms | -3.81ms | -10.63% |

