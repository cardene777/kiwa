# Perf Suite — cli-test-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 3.20ms | 5.42ms | 500ms | 0.0013ms | PASS | stable — gate 無効 (regressionGate=false) |
| batch_cli_run (5x echo test) | 25.19ms | 76.59ms | 1000ms | 0.0011ms | PASS | regressed — 1 回目 (次も続けば gate) — gate 無効 (regressionGate=false) |
| setup_cleanup_cycle (5 sequential setup+stop) | 5.59ms | 7.50ms | 500ms | 0.00040ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | fs-write | 0.09ms | 0.31ms | 3.20ms | 37.397 | 37.265 | 9.3% | 20.0% | 3.47ms | 3.45ms |
| batch_cli_run (5x echo test) | cpu | 0.09ms | 0.16ms | 25.19ms | 281.417 | 145.572 | 20.5% | 40.9% | 23.53ms | 12.17ms |
| setup_cleanup_cycle (5 sequential setup+stop) | fs-write | 0.21ms | 0.60ms | 5.59ms | 26.750 | 28.306 | 8.1% | 20.0% | 1.90ms | 2.01ms |

## Concurrent p95 (concurrency = 2, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 7.65ms | 1000ms | PASS |
| batch_cli_run (5x echo test) | 32.63ms | 2000ms | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | 13.97ms | 1000ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | -49528 B | -8192 B | 102400 B | yes | 18 (3 + 15) | PASS |
| batch_cli_run (5x echo test) | 73536 B | -2085 B | 102400 B | yes | 18 (3 + 15) | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | 13584 B | 0 B | 102400 B | yes | 18 (3 + 15) | PASS |

## Detailed serial reports

### file_scaffold_workflow (setup + 20 writeFile + listFiles)

# Perf Report — file_scaffold_workflow (setup + 20 writeFile + listFiles).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 3.20ms |
| p50 | 4.38ms |
| p95 | 5.42ms |
| p99 | 5.56ms |
| mean | 4.21ms |
| stdev | 0.87ms |
| min | 3.09ms |
| max | 5.59ms |
| total | 63.17ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.084)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.47ms | 3.45ms | +0.01ms | +0.35% |
| p50 | 4.74ms | 3.92ms | +0.82ms | +20.97% |
| p95 | 5.88ms | 6.89ms | -1.01ms | -14.63% |
| p99 | 6.03ms | 7.14ms | -1.12ms | -15.62% |
| mean | 4.56ms | 4.28ms | +0.28ms | +6.59% |
| min | 3.35ms | 3.29ms | +0.06ms | +1.89% |
| max | 6.06ms | 7.20ms | -1.14ms | -15.86% |
| total | 68.46ms | 64.23ms | +4.23ms | +6.59% |

### batch_cli_run (5x echo test)

# Perf Report — batch_cli_run (5x echo test).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 25.19ms |
| p50 | 40.30ms |
| p95 | 76.59ms |
| p99 | 97.95ms |
| mean | 44.79ms |
| stdev | 20.68ms |
| min | 23.56ms |
| max | 103.29ms |
| total | 671.80ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.934)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 23.53ms | 12.17ms | +11.36ms | +93.32% |
| p50 | 37.63ms | 13.49ms | +24.14ms | +178.89% |
| p95 | 71.53ms | 20.36ms | +51.17ms | +251.38% |
| p99 | 91.47ms | 22.30ms | +69.18ms | +310.25% |
| mean | 41.83ms | 14.97ms | +26.86ms | +179.47% |
| min | 22.00ms | 11.96ms | +10.04ms | +83.93% |
| max | 96.46ms | 22.78ms | +73.68ms | +323.40% |
| total | 627.39ms | 224.49ms | +402.90ms | +179.47% |

### setup_cleanup_cycle (5 sequential setup+stop)

# Perf Report — setup_cleanup_cycle (5 sequential setup+stop).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 5.59ms |
| p50 | 6.21ms |
| p95 | 7.50ms |
| p99 | 7.75ms |
| mean | 6.23ms |
| stdev | 0.78ms |
| min | 4.50ms |
| max | 7.81ms |
| total | 93.47ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.339)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.90ms | 2.01ms | -0.11ms | -5.49% |
| p50 | 2.11ms | 2.24ms | -0.14ms | -6.03% |
| p95 | 2.54ms | 3.03ms | -0.49ms | -16.02% |
| p99 | 2.63ms | 3.14ms | -0.51ms | -16.38% |
| mean | 2.11ms | 2.39ms | -0.27ms | -11.48% |
| min | 1.53ms | 1.98ms | -0.45ms | -22.73% |
| max | 2.65ms | 3.17ms | -0.52ms | -16.46% |
| total | 31.70ms | 35.81ms | -4.11ms | -11.48% |

