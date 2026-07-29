# Perf Suite — component-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| storybook_registry_burst (create registry x 30) | 0.0037ms | 0.01ms | 50ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| playwright_ct_mock_lifecycle (create mock x 30) | 0.0022ms | 0.0085ms | 50ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| chromatic_visual_snapshot (create mock x 30) | 0.0055ms | 0.01ms | 50ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| storybook_registry_burst (create registry x 30) | 0.02ms | 100ms | PASS |
| playwright_ct_mock_lifecycle (create mock x 30) | 0.02ms | 100ms | PASS |
| chromatic_visual_snapshot (create mock x 30) | 0.01ms | 100ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| storybook_registry_burst (create registry x 30) | -13000 B | 0 B | 102400 B | yes | PASS |
| playwright_ct_mock_lifecycle (create mock x 30) | -200 B | 0 B | 102400 B | yes | PASS |
| chromatic_visual_snapshot (create mock x 30) | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### storybook_registry_burst (create registry x 30)

# Perf Report — storybook_registry_burst (create registry x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0037ms |
| p50 | 0.0046ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0060ms |
| stdev | 0.0032ms |
| min | 0.0031ms |
| max | 0.02ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0037ms | 0.0037ms | +0.000084ms | +2.29% |
| p50 | 0.0046ms | 0.0040ms | +0.00060ms | +15.17% |
| p95 | 0.01ms | 0.01ms | +0.00037ms | +3.16% |
| p99 | 0.01ms | 0.02ms | -0.00099ms | -6.39% |
| mean | 0.0060ms | 0.0053ms | +0.00067ms | +12.77% |
| min | 0.0031ms | 0.0030ms | +0.000083ms | +2.77% |
| max | 0.02ms | 0.02ms | -0.0013ms | -8.08% |
| total | 0.12ms | 0.11ms | +0.01ms | +12.77% |

### playwright_ct_mock_lifecycle (create mock x 30)

# Perf Report — playwright_ct_mock_lifecycle (create mock x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0022ms |
| p50 | 0.0026ms |
| p95 | 0.0085ms |
| p99 | 0.0094ms |
| mean | 0.0037ms |
| stdev | 0.0023ms |
| min | 0.0021ms |
| max | 0.0097ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0025ms | -0.00034ms | -13.52% |
| p50 | 0.0026ms | 0.0026ms | +0.000041ms | +1.59% |
| p95 | 0.0085ms | 0.01ms | -0.0017ms | -16.52% |
| p99 | 0.0094ms | 0.01ms | -0.0044ms | -31.67% |
| mean | 0.0037ms | 0.0039ms | -0.00021ms | -5.53% |
| min | 0.0021ms | 0.0025ms | -0.00037ms | -15.00% |
| max | 0.0097ms | 0.01ms | -0.0050ms | -34.28% |
| total | 0.07ms | 0.08ms | -0.0043ms | -5.53% |

### chromatic_visual_snapshot (create mock x 30)

# Perf Report — chromatic_visual_snapshot (create mock x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0055ms |
| p50 | 0.0060ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0069ms |
| stdev | 0.0023ms |
| min | 0.0054ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0055ms | 0.0058ms | -0.00037ms | -6.43% |
| p50 | 0.0060ms | 0.0060ms | -0.000042ms | -0.70% |
| p95 | 0.01ms | 0.01ms | +0.00029ms | +2.32% |
| p99 | 0.01ms | 0.02ms | -0.0023ms | -15.11% |
| mean | 0.0069ms | 0.0071ms | -0.00013ms | -1.83% |
| min | 0.0054ms | 0.0058ms | -0.00042ms | -7.15% |
| max | 0.01ms | 0.02ms | -0.0029ms | -18.57% |
| total | 0.14ms | 0.14ms | -0.0026ms | -1.83% |

