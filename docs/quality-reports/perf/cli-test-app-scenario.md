# Perf Suite — cli-test-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00029ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00058ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 5.68ms | 29.13ms | 500ms | 0.00037ms | PASS | stable (換算後 p10 +3% (閾値未満)、 p95 +166% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| batch_cli_run (5x echo test) | 14.74ms | 22.70ms | 1000ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| setup_cleanup_cycle (5 sequential setup+stop) | 3.21ms | 45.41ms | 500ms | 0.00030ms | PASS | stable (換算後 p10 -18% (閾値未満)、 p95 +667% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | fs-write | 0.15ms | 1.13ms | 5.68ms | 38.568 | 37.265 | 3.57ms | 3.45ms |
| batch_cli_run (5x echo test) | cpu | 0.10ms | 0.11ms | 14.74ms | 149.145 | 145.572 | 12.47ms | 12.17ms |
| setup_cleanup_cycle (5 sequential setup+stop) | fs-write | 0.14ms | 3.75ms | 3.21ms | 23.173 | 28.306 | 1.64ms | 2.01ms |

## Concurrent p95 (concurrency = 2, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 7.88ms | 1000ms | PASS |
| batch_cli_run (5x echo test) | 30.27ms | 2000ms | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | 33.25ms | 1000ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | -31632 B | -10556 B | 102400 B | yes | WAIVED (fs の Buffer pool の伸びを拾うため実装の保持量を表さない (#1719)) |
| batch_cli_run (5x echo test) | 24176 B | 0 B | 102400 B | yes | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | -24624 B | 41268 B | 102400 B | yes | PASS |

## Detailed serial reports

### file_scaffold_workflow (setup + 20 writeFile + listFiles)

# Perf Report — file_scaffold_workflow (setup + 20 writeFile + listFiles).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 5.68ms |
| p50 | 11.03ms |
| p95 | 29.13ms |
| p99 | 36.61ms |
| mean | 12.90ms |
| stdev | 9.29ms |
| min | 3.98ms |
| max | 38.48ms |
| total | 193.43ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.630)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.57ms | 3.45ms | +0.12ms | +3.50% |
| p50 | 6.95ms | 3.92ms | +3.02ms | +77.15% |
| p95 | 18.35ms | 6.89ms | +11.46ms | +166.42% |
| p99 | 23.06ms | 7.14ms | +15.92ms | +222.90% |
| mean | 8.12ms | 4.28ms | +3.84ms | +89.65% |
| min | 2.50ms | 3.29ms | -0.79ms | -23.92% |
| max | 24.24ms | 7.20ms | +17.03ms | +236.40% |
| total | 121.81ms | 64.23ms | +57.58ms | +89.65% |

### batch_cli_run (5x echo test)

# Perf Report — batch_cli_run (5x echo test).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 14.74ms |
| p50 | 16.58ms |
| p95 | 22.70ms |
| p99 | 28.41ms |
| mean | 17.64ms |
| stdev | 3.76ms |
| min | 14.45ms |
| max | 29.84ms |
| total | 264.66ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.846)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 12.47ms | 12.17ms | +0.30ms | +2.45% |
| p50 | 14.03ms | 13.49ms | +0.53ms | +3.94% |
| p95 | 19.20ms | 20.36ms | -1.15ms | -5.66% |
| p99 | 24.04ms | 22.30ms | +1.74ms | +7.81% |
| mean | 14.93ms | 14.97ms | -0.04ms | -0.24% |
| min | 12.22ms | 11.96ms | +0.26ms | +2.19% |
| max | 25.25ms | 22.78ms | +2.46ms | +10.82% |
| total | 223.94ms | 224.49ms | -0.55ms | -0.24% |

### setup_cleanup_cycle (5 sequential setup+stop)

# Perf Report — setup_cleanup_cycle (5 sequential setup+stop).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 3.21ms |
| p50 | 5.26ms |
| p95 | 45.41ms |
| p99 | 46.56ms |
| mean | 14.83ms |
| stdev | 15.88ms |
| min | 3.12ms |
| max | 46.85ms |
| total | 222.48ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.512)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.64ms | 2.01ms | -0.36ms | -18.13% |
| p50 | 2.69ms | 2.24ms | +0.45ms | +20.05% |
| p95 | 23.24ms | 3.03ms | +20.21ms | +667.21% |
| p99 | 23.83ms | 3.14ms | +20.69ms | +658.64% |
| mean | 7.59ms | 2.39ms | +5.20ms | +217.94% |
| min | 1.59ms | 1.98ms | -0.38ms | -19.30% |
| max | 23.98ms | 3.17ms | +20.81ms | +656.60% |
| total | 113.85ms | 35.81ms | +78.04ms | +217.94% |

