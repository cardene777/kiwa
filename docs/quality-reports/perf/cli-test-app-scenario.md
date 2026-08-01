# Perf Suite — cli-test-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 8.91ms | 45.93ms | 500ms | 0.00056ms | PASS | regressed — gate 無効 (regressionGate=false) |
| batch_cli_run (5x echo test) | 19.14ms | 34.31ms | 1000ms | 0.00089ms | PASS | stable (換算後 p10 +20% (閾値未満)、 p95 +28% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| setup_cleanup_cycle (5 sequential setup+stop) | 5.31ms | 7.94ms | 500ms | 0.00055ms | PASS | regressed — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | fs-write | 0.19ms | 3.27ms | 8.91ms | 46.293 | 37.265 | n/a | 20.0% | 4.29ms | 3.45ms |
| batch_cli_run (5x echo test) | cpu | 0.11ms | 0.17ms | 19.14ms | 174.315 | 145.572 | n/a | 20.0% | 14.57ms | 12.17ms |
| setup_cleanup_cycle (5 sequential setup+stop) | fs-write | 0.15ms | 0.38ms | 5.31ms | 35.564 | 28.306 | n/a | 20.0% | 2.52ms | 2.01ms |

## Concurrent p95 (concurrency = 2, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 11.68ms | 1000ms | PASS |
| batch_cli_run (5x echo test) | 42.66ms | 2000ms | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | 8.35ms | 1000ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | -41584 B | 0 B | 102400 B | yes | 18 (3 + 15) | WAIVED (fs の Buffer pool の伸びを拾うため実装の保持量を表さない (#1719)) |
| batch_cli_run (5x echo test) | 25480 B | 0 B | 102400 B | yes | 18 (3 + 15) | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | -24504 B | -21745 B | 102400 B | yes | 18 (3 + 15) | PASS |

## Detailed serial reports

### file_scaffold_workflow (setup + 20 writeFile + listFiles)

# Perf Report — file_scaffold_workflow (setup + 20 writeFile + listFiles).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 8.91ms |
| p50 | 16.30ms |
| p95 | 45.93ms |
| p99 | 55.07ms |
| mean | 19.58ms |
| stdev | 14.02ms |
| min | 8.00ms |
| max | 57.36ms |
| total | 293.66ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.482)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 4.29ms | 3.45ms | +0.84ms | +24.23% |
| p50 | 7.85ms | 3.92ms | +3.93ms | +100.17% |
| p95 | 22.12ms | 6.89ms | +15.23ms | +221.22% |
| p99 | 26.52ms | 7.14ms | +19.38ms | +271.42% |
| mean | 9.43ms | 4.28ms | +5.15ms | +120.19% |
| min | 3.85ms | 3.29ms | +0.56ms | +16.99% |
| max | 27.62ms | 7.20ms | +20.42ms | +283.42% |
| total | 141.42ms | 64.23ms | +77.19ms | +120.19% |

### batch_cli_run (5x echo test)

# Perf Report — batch_cli_run (5x echo test).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 19.14ms |
| p50 | 26.44ms |
| p95 | 34.31ms |
| p99 | 36.14ms |
| mean | 25.85ms |
| stdev | 5.58ms |
| min | 16.25ms |
| max | 36.60ms |
| total | 387.76ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.762)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 14.57ms | 12.17ms | +2.40ms | +19.75% |
| p50 | 20.13ms | 13.49ms | +6.64ms | +49.19% |
| p95 | 26.12ms | 20.36ms | +5.77ms | +28.34% |
| p99 | 27.52ms | 22.30ms | +5.23ms | +23.44% |
| mean | 19.69ms | 14.97ms | +4.72ms | +31.53% |
| min | 12.38ms | 11.96ms | +0.42ms | +3.48% |
| max | 27.87ms | 22.78ms | +5.09ms | +22.34% |
| total | 295.28ms | 224.49ms | +70.79ms | +31.53% |

### setup_cleanup_cycle (5 sequential setup+stop)

# Perf Report — setup_cleanup_cycle (5 sequential setup+stop).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 5.31ms |
| p50 | 5.77ms |
| p95 | 7.94ms |
| p99 | 8.45ms |
| mean | 6.02ms |
| stdev | 0.94ms |
| min | 5.08ms |
| max | 8.58ms |
| total | 90.25ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.474)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 2.52ms | 2.01ms | +0.51ms | +25.64% |
| p50 | 2.74ms | 2.24ms | +0.49ms | +22.09% |
| p95 | 3.76ms | 3.03ms | +0.73ms | +24.24% |
| p99 | 4.01ms | 3.14ms | +0.87ms | +27.58% |
| mean | 2.85ms | 2.39ms | +0.47ms | +19.51% |
| min | 2.41ms | 1.98ms | +0.43ms | +21.79% |
| max | 4.07ms | 3.17ms | +0.90ms | +28.38% |
| total | 42.79ms | 35.81ms | +6.99ms | +19.51% |

