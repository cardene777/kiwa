# Perf Suite — component-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| storybook_registry_burst (create registry x 30) | 0.0038ms | 0.01ms | 50ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| playwright_ct_mock_lifecycle (create mock x 30) | 0.0025ms | 0.0092ms | 50ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| chromatic_visual_snapshot (create mock x 30) | 0.0059ms | 0.02ms | 50ms | 0.00050ms | PASS | stable (p10 +1% (閾値未満)、 p95 +30% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| storybook_registry_burst (create registry x 30) | 0.01ms | 100ms | PASS |
| playwright_ct_mock_lifecycle (create mock x 30) | 0.01ms | 100ms | PASS |
| chromatic_visual_snapshot (create mock x 30) | 0.02ms | 100ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| storybook_registry_burst (create registry x 30) | -1728 B | 0 B | 102400 B | yes | PASS |
| playwright_ct_mock_lifecycle (create mock x 30) | 5264 B | 0 B | 102400 B | yes | PASS |
| chromatic_visual_snapshot (create mock x 30) | 536 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### storybook_registry_burst (create registry x 30)

# Perf Report — storybook_registry_burst (create registry x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0038ms |
| p50 | 0.0040ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0053ms |
| stdev | 0.0026ms |
| min | 0.0037ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0038ms | 0.0037ms | +0.00014ms | +3.78% |
| p50 | 0.0040ms | 0.0040ms | -0.000021ms | -0.53% |
| p95 | 0.01ms | 0.01ms | -0.0013ms | -10.77% |
| p99 | 0.01ms | 0.02ms | -0.0039ms | -25.01% |
| mean | 0.0053ms | 0.0053ms | -0.000035ms | -0.67% |
| min | 0.0037ms | 0.0030ms | +0.00075ms | +25.00% |
| max | 0.01ms | 0.02ms | -0.0045ms | -27.53% |
| total | 0.11ms | 0.11ms | -0.00071ms | -0.67% |

### playwright_ct_mock_lifecycle (create mock x 30)

# Perf Report — playwright_ct_mock_lifecycle (create mock x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0025ms |
| p50 | 0.0026ms |
| p95 | 0.0092ms |
| p99 | 0.01ms |
| mean | 0.0036ms |
| stdev | 0.0023ms |
| min | 0.0025ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0025ms | 0.0025ms | 0.00ms | 0.00% |
| p50 | 0.0026ms | 0.0026ms | +0.000021ms | +0.79% |
| p95 | 0.0092ms | 0.01ms | -0.00096ms | -9.42% |
| p99 | 0.01ms | 0.01ms | -0.0035ms | -25.06% |
| mean | 0.0036ms | 0.0039ms | -0.00031ms | -7.94% |
| min | 0.0025ms | 0.0025ms | -0.000042ms | -1.68% |
| max | 0.01ms | 0.01ms | -0.0041ms | -27.76% |
| total | 0.07ms | 0.08ms | -0.0062ms | -7.94% |

### chromatic_visual_snapshot (create mock x 30)

# Perf Report — chromatic_visual_snapshot (create mock x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0059ms |
| p50 | 0.0066ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0085ms |
| stdev | 0.0038ms |
| min | 0.0058ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0059ms | 0.0058ms | +0.000079ms | +1.35% |
| p50 | 0.0066ms | 0.0060ms | +0.00060ms | +10.04% |
| p95 | 0.02ms | 0.01ms | +0.0038ms | +30.13% |
| p99 | 0.02ms | 0.02ms | +0.0039ms | +25.58% |
| mean | 0.0085ms | 0.0071ms | +0.0014ms | +20.15% |
| min | 0.0058ms | 0.0058ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | +0.0039ms | +24.68% |
| total | 0.17ms | 0.14ms | +0.03ms | +20.15% |

