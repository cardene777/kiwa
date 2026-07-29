# Perf Suite — component-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| storybook_registry_burst (create registry x 30) | 0.0024ms | 0.01ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| playwright_ct_mock_lifecycle (create mock x 30) | 0.0026ms | 0.0085ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| chromatic_visual_snapshot (create mock x 30) | 0.0054ms | 0.01ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| storybook_registry_burst (create registry x 30) | 0.01ms | 100ms | PASS |
| playwright_ct_mock_lifecycle (create mock x 30) | 0.01ms | 100ms | PASS |
| chromatic_visual_snapshot (create mock x 30) | 0.01ms | 100ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| storybook_registry_burst (create registry x 30) | -12536 B | 0 B | 102400 B | yes | PASS |
| playwright_ct_mock_lifecycle (create mock x 30) | 200 B | 0 B | 102400 B | yes | PASS |
| chromatic_visual_snapshot (create mock x 30) | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### storybook_registry_burst (create registry x 30)

# Perf Report — storybook_registry_burst (create registry x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0024ms |
| p50 | 0.0038ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0051ms |
| stdev | 0.0044ms |
| min | 0.0023ms |
| max | 0.02ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0024ms | 0.0037ms | -0.0012ms | -32.95% |
| p50 | 0.0038ms | 0.0040ms | -0.00019ms | -4.71% |
| p95 | 0.01ms | 0.01ms | -0.00096ms | -8.21% |
| p99 | 0.02ms | 0.02ms | +0.0041ms | +26.45% |
| mean | 0.0051ms | 0.0053ms | -0.00017ms | -3.31% |
| min | 0.0023ms | 0.0030ms | -0.00067ms | -22.20% |
| max | 0.02ms | 0.02ms | +0.0054ms | +32.58% |
| total | 0.10ms | 0.11ms | -0.0035ms | -3.31% |

### playwright_ct_mock_lifecycle (create mock x 30)

# Perf Report — playwright_ct_mock_lifecycle (create mock x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0026ms |
| p50 | 0.0027ms |
| p95 | 0.0085ms |
| p99 | 0.010ms |
| mean | 0.0038ms |
| stdev | 0.0023ms |
| min | 0.0024ms |
| max | 0.01ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0026ms | 0.0025ms | +0.000066ms | +2.65% |
| p50 | 0.0027ms | 0.0026ms | +0.00015ms | +5.63% |
| p95 | 0.0085ms | 0.01ms | -0.0017ms | -16.56% |
| p99 | 0.010ms | 0.01ms | -0.0038ms | -27.56% |
| mean | 0.0038ms | 0.0039ms | -0.00011ms | -2.84% |
| min | 0.0024ms | 0.0025ms | -0.00013ms | -5.00% |
| max | 0.01ms | 0.01ms | -0.0043ms | -29.46% |
| total | 0.08ms | 0.08ms | -0.0022ms | -2.84% |

### chromatic_visual_snapshot (create mock x 30)

# Perf Report — chromatic_visual_snapshot (create mock x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0054ms |
| p50 | 0.0059ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0070ms |
| stdev | 0.0027ms |
| min | 0.0054ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0054ms | 0.0058ms | -0.00042ms | -7.15% |
| p50 | 0.0059ms | 0.0060ms | -0.00010ms | -1.74% |
| p95 | 0.01ms | 0.01ms | -0.00037ms | -2.98% |
| p99 | 0.02ms | 0.02ms | +0.00033ms | +2.17% |
| mean | 0.0070ms | 0.0071ms | -0.000069ms | -0.97% |
| min | 0.0054ms | 0.0058ms | -0.00046ms | -7.85% |
| max | 0.02ms | 0.02ms | +0.00050ms | +3.19% |
| total | 0.14ms | 0.14ms | -0.0014ms | -0.97% |

