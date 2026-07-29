# Perf Suite — component-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| storybook_registry_burst (create registry x 30) | 0.0025ms | 0.01ms | 50ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| playwright_ct_mock_lifecycle (create mock x 30) | 0.0028ms | 0.01ms | 50ms | 0.00050ms | PASS | stable (p10 +13% (閾値未満)、 p95 +28% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| chromatic_visual_snapshot (create mock x 30) | 0.0061ms | 0.02ms | 50ms | 0.00050ms | PASS | stable (p10 +4% (閾値未満)、 p95 +22% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| storybook_registry_burst (create registry x 30) | 0.02ms | 100ms | PASS |
| playwright_ct_mock_lifecycle (create mock x 30) | 0.02ms | 100ms | PASS |
| chromatic_visual_snapshot (create mock x 30) | 0.05ms | 100ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| storybook_registry_burst (create registry x 30) | -12488 B | 0 B | 102400 B | yes | PASS |
| playwright_ct_mock_lifecycle (create mock x 30) | 3896 B | 0 B | 102400 B | yes | PASS |
| chromatic_visual_snapshot (create mock x 30) | -112 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### storybook_registry_burst (create registry x 30)

# Perf Report — storybook_registry_burst (create registry x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0025ms |
| p50 | 0.0043ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0051ms |
| stdev | 0.0030ms |
| min | 0.0024ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0025ms | 0.0037ms | -0.0012ms | -32.84% |
| p50 | 0.0043ms | 0.0040ms | +0.00031ms | +7.84% |
| p95 | 0.01ms | 0.01ms | +0.00056ms | +4.79% |
| p99 | 0.01ms | 0.02ms | -0.0023ms | -14.95% |
| mean | 0.0051ms | 0.0053ms | -0.00021ms | -3.90% |
| min | 0.0024ms | 0.0030ms | -0.00063ms | -20.83% |
| max | 0.01ms | 0.02ms | -0.0030ms | -18.44% |
| total | 0.10ms | 0.11ms | -0.0041ms | -3.90% |

### playwright_ct_mock_lifecycle (create mock x 30)

# Perf Report — playwright_ct_mock_lifecycle (create mock x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0028ms |
| p50 | 0.0041ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0052ms |
| stdev | 0.0034ms |
| min | 0.0028ms |
| max | 0.02ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0028ms | 0.0025ms | +0.00033ms | +13.32% |
| p50 | 0.0041ms | 0.0026ms | +0.0016ms | +60.43% |
| p95 | 0.01ms | 0.01ms | +0.0029ms | +28.08% |
| p99 | 0.02ms | 0.01ms | +0.0012ms | +8.97% |
| mean | 0.0052ms | 0.0039ms | +0.0013ms | +34.63% |
| min | 0.0028ms | 0.0025ms | +0.00029ms | +11.64% |
| max | 0.02ms | 0.01ms | +0.00083ms | +5.67% |
| total | 0.10ms | 0.08ms | +0.03ms | +34.63% |

### chromatic_visual_snapshot (create mock x 30)

# Perf Report — chromatic_visual_snapshot (create mock x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0061ms |
| p50 | 0.0063ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0079ms |
| stdev | 0.0034ms |
| min | 0.0059ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0061ms | 0.0058ms | +0.00025ms | +4.20% |
| p50 | 0.0063ms | 0.0060ms | +0.00029ms | +4.84% |
| p95 | 0.02ms | 0.01ms | +0.0027ms | +21.88% |
| p99 | 0.02ms | 0.02ms | +0.0017ms | +11.59% |
| mean | 0.0079ms | 0.0071ms | +0.00080ms | +11.34% |
| min | 0.0059ms | 0.0058ms | +0.000084ms | +1.44% |
| max | 0.02ms | 0.02ms | +0.0015ms | +9.55% |
| total | 0.16ms | 0.14ms | +0.02ms | +11.34% |

