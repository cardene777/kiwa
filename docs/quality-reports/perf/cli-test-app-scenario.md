# Perf Suite — cli-test-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 3.60ms | 7.85ms | 500ms | 0.00047ms | PASS | stable — gate 無効 (regressionGate=false) |
| batch_cli_run (5x echo test) | 13.48ms | 24.18ms | 1000ms | 0.00055ms | PASS | stable (p10 +13% (閾値未満)、 p95 +41% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| setup_cleanup_cycle (5 sequential setup+stop) | 2.56ms | 3.33ms | 500ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | fs-write | 0.10ms | 3.60ms | 36.233 | 35.964 | 3.40ms | 3.38ms |
| batch_cli_run (5x echo test) | cpu | 0.09ms | 13.48ms | 155.058 | 137.560 | 14.80ms | 13.13ms |
| setup_cleanup_cycle (5 sequential setup+stop) | fs-write | 0.09ms | 2.56ms | 28.121 | 27.715 | 2.15ms | 2.12ms |

## Concurrent p95 (concurrency = 2, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 6.53ms | 1000ms | PASS |
| batch_cli_run (5x echo test) | 29.10ms | 2000ms | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | 10.35ms | 1000ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | -30528 B | -68890 B | 102400 B | yes | WAIVED (fs の Buffer pool の伸びを拾うため実装の保持量を表さない (#1719)) |
| batch_cli_run (5x echo test) | 22016 B | 0 B | 102400 B | yes | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | -25040 B | -46335 B | 102400 B | yes | PASS |

## Detailed serial reports

### file_scaffold_workflow (setup + 20 writeFile + listFiles)

# Perf Report — file_scaffold_workflow (setup + 20 writeFile + listFiles).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 3.60ms |
| p50 | 4.24ms |
| p95 | 7.85ms |
| p99 | 10.89ms |
| mean | 4.91ms |
| stdev | 2.03ms |
| min | 3.28ms |
| max | 11.65ms |
| total | 73.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.60ms | 3.38ms | +0.23ms | +6.73% |
| p50 | 4.24ms | 3.76ms | +0.48ms | +12.70% |
| p95 | 7.85ms | 11.90ms | -4.05ms | -34.03% |
| p99 | 10.89ms | 21.12ms | -10.23ms | -48.43% |
| mean | 4.91ms | 5.24ms | -0.33ms | -6.37% |
| min | 3.28ms | 3.24ms | +0.04ms | +1.26% |
| max | 11.65ms | 23.42ms | -11.77ms | -50.26% |
| total | 73.63ms | 78.64ms | -5.01ms | -6.37% |

### batch_cli_run (5x echo test)

# Perf Report — batch_cli_run (5x echo test).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 13.48ms |
| p50 | 19.25ms |
| p95 | 24.18ms |
| p99 | 28.47ms |
| mean | 18.18ms |
| stdev | 4.58ms |
| min | 12.67ms |
| max | 29.54ms |
| total | 272.70ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 13.48ms | 13.13ms | +0.35ms | +2.64% |
| p50 | 19.25ms | 14.65ms | +4.60ms | +31.37% |
| p95 | 24.18ms | 18.86ms | +5.32ms | +28.19% |
| p99 | 28.47ms | 20.04ms | +8.43ms | +42.06% |
| mean | 18.18ms | 15.31ms | +2.87ms | +18.76% |
| min | 12.67ms | 12.84ms | -0.17ms | -1.34% |
| max | 29.54ms | 20.33ms | +9.21ms | +45.28% |
| total | 272.70ms | 229.62ms | +43.08ms | +18.76% |

### setup_cleanup_cycle (5 sequential setup+stop)

# Perf Report — setup_cleanup_cycle (5 sequential setup+stop).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 2.56ms |
| p50 | 2.98ms |
| p95 | 3.33ms |
| p99 | 3.44ms |
| mean | 2.93ms |
| stdev | 0.32ms |
| min | 2.30ms |
| max | 3.47ms |
| total | 43.91ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 2.56ms | 2.12ms | +0.44ms | +21.01% |
| p50 | 2.98ms | 2.42ms | +0.56ms | +22.96% |
| p95 | 3.33ms | 3.37ms | -0.04ms | -1.13% |
| p99 | 3.44ms | 3.74ms | -0.30ms | -8.07% |
| mean | 2.93ms | 2.57ms | +0.36ms | +14.00% |
| min | 2.30ms | 1.99ms | +0.32ms | +16.06% |
| max | 3.47ms | 3.84ms | -0.37ms | -9.59% |
| total | 43.91ms | 38.52ms | +5.39ms | +14.00% |

