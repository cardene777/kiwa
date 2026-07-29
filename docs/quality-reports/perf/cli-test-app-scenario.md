# Perf Suite — cli-test-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 4.40ms | 23.69ms | 500ms | 0.00050ms | PASS | stable (p10 -6% (閾値未満)、 p95 +164% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| batch_cli_run (5x echo test) | 13.93ms | 41.28ms | 1000ms | 0.00050ms | PASS | stable (p10 -3% (閾値未満)、 p95 +48% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| setup_cleanup_cycle (5 sequential setup+stop) | 2.74ms | 3.66ms | 500ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 2, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 17.04ms | 1000ms | PASS |
| batch_cli_run (5x echo test) | 21.84ms | 2000ms | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | 4.61ms | 1000ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | -34496 B | -58293 B | 102400 B | yes | WAIVED (fs の Buffer pool の伸びを拾うため実装の保持量を表さない (#1719)) |
| batch_cli_run (5x echo test) | 23048 B | 525 B | 102400 B | yes | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | -22360 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### file_scaffold_workflow (setup + 20 writeFile + listFiles)

# Perf Report — file_scaffold_workflow (setup + 20 writeFile + listFiles).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 4.40ms |
| p50 | 5.46ms |
| p95 | 23.69ms |
| p99 | 27.36ms |
| mean | 9.51ms |
| stdev | 7.39ms |
| min | 3.97ms |
| max | 28.28ms |
| total | 142.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 4.40ms | 4.67ms | -0.28ms | -5.99% |
| p50 | 5.46ms | 6.16ms | -0.70ms | -11.35% |
| p95 | 23.69ms | 8.98ms | +14.71ms | +163.77% |
| p99 | 27.36ms | 9.49ms | +17.87ms | +188.24% |
| mean | 9.51ms | 6.54ms | +2.97ms | +45.48% |
| min | 3.97ms | 4.43ms | -0.46ms | -10.29% |
| max | 28.28ms | 9.62ms | +18.66ms | +193.95% |
| total | 142.71ms | 98.09ms | +44.61ms | +45.48% |

### batch_cli_run (5x echo test)

# Perf Report — batch_cli_run (5x echo test).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 13.93ms |
| p50 | 14.45ms |
| p95 | 41.28ms |
| p99 | 60.45ms |
| mean | 21.37ms |
| stdev | 13.64ms |
| min | 13.48ms |
| max | 65.24ms |
| total | 320.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 13.93ms | 14.41ms | -0.49ms | -3.39% |
| p50 | 14.45ms | 18.71ms | -4.25ms | -22.75% |
| p95 | 41.28ms | 27.98ms | +13.29ms | +47.51% |
| p99 | 60.45ms | 28.59ms | +31.85ms | +111.41% |
| mean | 21.37ms | 20.54ms | +0.82ms | +4.00% |
| min | 13.48ms | 14.06ms | -0.58ms | -4.13% |
| max | 65.24ms | 28.74ms | +36.49ms | +126.96% |
| total | 320.49ms | 308.17ms | +12.31ms | +4.00% |

### setup_cleanup_cycle (5 sequential setup+stop)

# Perf Report — setup_cleanup_cycle (5 sequential setup+stop).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 2.74ms |
| p50 | 3.16ms |
| p95 | 3.66ms |
| p99 | 3.86ms |
| mean | 3.13ms |
| stdev | 0.37ms |
| min | 2.37ms |
| max | 3.91ms |
| total | 46.90ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 2.74ms | 4.21ms | -1.48ms | -35.04% |
| p50 | 3.16ms | 5.76ms | -2.61ms | -45.21% |
| p95 | 3.66ms | 9.97ms | -6.31ms | -63.32% |
| p99 | 3.86ms | 14.01ms | -10.15ms | -72.48% |
| mean | 3.13ms | 6.43ms | -3.30ms | -51.34% |
| min | 2.37ms | 3.59ms | -1.23ms | -34.13% |
| max | 3.91ms | 15.02ms | -11.11ms | -74.00% |
| total | 46.90ms | 96.39ms | -49.49ms | -51.34% |

