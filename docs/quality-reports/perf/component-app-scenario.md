# Perf Suite — component-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| storybook_registry_burst (create registry x 30) | 0.0024ms | 0.01ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| playwright_ct_mock_lifecycle (create mock x 30) | 0.0026ms | 0.0092ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| chromatic_visual_snapshot (create mock x 30) | 0.0052ms | 0.01ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| storybook_registry_burst (create registry x 30) | 0.01ms | 100ms | PASS |
| playwright_ct_mock_lifecycle (create mock x 30) | 0.01ms | 100ms | PASS |
| chromatic_visual_snapshot (create mock x 30) | 0.01ms | 100ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| storybook_registry_burst (create registry x 30) | -11872 B | 0 B | 102400 B | yes | PASS |
| playwright_ct_mock_lifecycle (create mock x 30) | 616 B | 0 B | 102400 B | yes | PASS |
| chromatic_visual_snapshot (create mock x 30) | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### storybook_registry_burst (create registry x 30)

# Perf Report — storybook_registry_burst (create registry x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0024ms |
| p50 | 0.0039ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0050ms |
| stdev | 0.0026ms |
| min | 0.0022ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0024ms | 0.0037ms | -0.0012ms | -33.41% |
| p50 | 0.0039ms | 0.0040ms | -0.000043ms | -1.07% |
| p95 | 0.01ms | 0.01ms | -0.0016ms | -14.07% |
| p99 | 0.01ms | 0.02ms | -0.0038ms | -24.43% |
| mean | 0.0050ms | 0.0053ms | -0.00033ms | -6.23% |
| min | 0.0022ms | 0.0030ms | -0.00083ms | -27.77% |
| max | 0.01ms | 0.02ms | -0.0043ms | -26.27% |
| total | 0.10ms | 0.11ms | -0.0066ms | -6.23% |

### playwright_ct_mock_lifecycle (create mock x 30)

# Perf Report — playwright_ct_mock_lifecycle (create mock x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0026ms |
| p50 | 0.0045ms |
| p95 | 0.0092ms |
| p99 | 0.01ms |
| mean | 0.0050ms |
| stdev | 0.0023ms |
| min | 0.0021ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0026ms | 0.0025ms | +0.000083ms | +3.32% |
| p50 | 0.0045ms | 0.0026ms | +0.0019ms | +73.34% |
| p95 | 0.0092ms | 0.01ms | -0.00099ms | -9.72% |
| p99 | 0.01ms | 0.01ms | -0.0027ms | -19.55% |
| mean | 0.0050ms | 0.0039ms | +0.0011ms | +29.48% |
| min | 0.0021ms | 0.0025ms | -0.00042ms | -16.68% |
| max | 0.01ms | 0.01ms | -0.0031ms | -21.25% |
| total | 0.10ms | 0.08ms | +0.02ms | +29.48% |

### chromatic_visual_snapshot (create mock x 30)

# Perf Report — chromatic_visual_snapshot (create mock x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0052ms |
| p50 | 0.0058ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0071ms |
| stdev | 0.0031ms |
| min | 0.0048ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0052ms | 0.0058ms | -0.00066ms | -11.28% |
| p50 | 0.0058ms | 0.0060ms | -0.00025ms | -4.16% |
| p95 | 0.01ms | 0.01ms | +0.000062ms | +0.50% |
| p99 | 0.02ms | 0.02ms | +0.00038ms | +2.52% |
| mean | 0.0071ms | 0.0071ms | +0.000021ms | +0.30% |
| min | 0.0048ms | 0.0058ms | -0.0010ms | -17.13% |
| max | 0.02ms | 0.02ms | +0.00046ms | +2.92% |
| total | 0.14ms | 0.14ms | +0.00042ms | +0.30% |

