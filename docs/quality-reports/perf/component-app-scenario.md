# Perf Suite — component-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| storybook_registry_burst (create registry x 30) | 0.0022ms | 0.01ms | 50ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| playwright_ct_mock_lifecycle (create mock x 30) | 0.0025ms | 0.0090ms | 50ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| chromatic_visual_snapshot (create mock x 30) | 0.0059ms | 0.01ms | 50ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| storybook_registry_burst (create registry x 30) | 0.02ms | 100ms | PASS |
| playwright_ct_mock_lifecycle (create mock x 30) | 0.02ms | 100ms | PASS |
| chromatic_visual_snapshot (create mock x 30) | 0.02ms | 100ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| storybook_registry_burst (create registry x 30) | -13672 B | 0 B | 102400 B | yes | PASS |
| playwright_ct_mock_lifecycle (create mock x 30) | -712 B | 0 B | 102400 B | yes | PASS |
| chromatic_visual_snapshot (create mock x 30) | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### storybook_registry_burst (create registry x 30)

# Perf Report — storybook_registry_burst (create registry x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0022ms |
| p50 | 0.0037ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0064ms |
| stdev | 0.0084ms |
| min | 0.0022ms |
| max | 0.04ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0037ms | -0.0014ms | -38.65% |
| p50 | 0.0037ms | 0.0040ms | -0.00031ms | -7.87% |
| p95 | 0.01ms | 0.01ms | +0.0029ms | +24.77% |
| p99 | 0.03ms | 0.02ms | +0.02ms | +122.17% |
| mean | 0.0064ms | 0.0053ms | +0.0011ms | +20.92% |
| min | 0.0022ms | 0.0030ms | -0.00083ms | -27.80% |
| max | 0.04ms | 0.02ms | +0.02ms | +139.39% |
| total | 0.13ms | 0.11ms | +0.02ms | +20.92% |

### playwright_ct_mock_lifecycle (create mock x 30)

# Perf Report — playwright_ct_mock_lifecycle (create mock x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0025ms |
| p50 | 0.0027ms |
| p95 | 0.0090ms |
| p99 | 0.0096ms |
| mean | 0.0038ms |
| stdev | 0.0023ms |
| min | 0.0025ms |
| max | 0.0097ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0025ms | 0.0025ms | +0.000042ms | +1.68% |
| p50 | 0.0027ms | 0.0026ms | +0.00010ms | +3.99% |
| p95 | 0.0090ms | 0.01ms | -0.0011ms | -11.02% |
| p99 | 0.0096ms | 0.01ms | -0.0042ms | -30.37% |
| mean | 0.0038ms | 0.0039ms | -0.00011ms | -2.90% |
| min | 0.0025ms | 0.0025ms | 0.00ms | 0.00% |
| max | 0.0097ms | 0.01ms | -0.0050ms | -33.71% |
| total | 0.08ms | 0.08ms | -0.0023ms | -2.90% |

### chromatic_visual_snapshot (create mock x 30)

# Perf Report — chromatic_visual_snapshot (create mock x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0059ms |
| p50 | 0.0076ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0085ms |
| stdev | 0.0032ms |
| min | 0.0059ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0059ms | 0.0058ms | +0.000079ms | +1.35% |
| p50 | 0.0076ms | 0.0060ms | +0.0016ms | +25.94% |
| p95 | 0.01ms | 0.01ms | +0.0013ms | +10.46% |
| p99 | 0.02ms | 0.02ms | +0.0021ms | +14.13% |
| mean | 0.0085ms | 0.0071ms | +0.0014ms | +20.06% |
| min | 0.0059ms | 0.0058ms | +0.000042ms | +0.72% |
| max | 0.02ms | 0.02ms | +0.0023ms | +14.85% |
| total | 0.17ms | 0.14ms | +0.03ms | +20.06% |

