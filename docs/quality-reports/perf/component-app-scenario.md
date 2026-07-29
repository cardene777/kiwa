# Perf Suite — component-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| storybook_registry_burst (create registry x 30) | 0.0062ms | 0.02ms | 50ms | 0.0012ms | PASS | regressed — gate 無効 (regressionGate=false) |
| playwright_ct_mock_lifecycle (create mock x 30) | 0.0027ms | 0.0097ms | 50ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |
| chromatic_visual_snapshot (create mock x 30) | 0.01ms | 0.04ms | 50ms | 0.0012ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| storybook_registry_burst (create registry x 30) | 0.04ms | 100ms | PASS |
| playwright_ct_mock_lifecycle (create mock x 30) | 0.08ms | 100ms | PASS |
| chromatic_visual_snapshot (create mock x 30) | 0.06ms | 100ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| storybook_registry_burst (create registry x 30) | -5976 B | 0 B | 102400 B | yes | PASS |
| playwright_ct_mock_lifecycle (create mock x 30) | 5776 B | 0 B | 102400 B | yes | PASS |
| chromatic_visual_snapshot (create mock x 30) | 136 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### storybook_registry_burst (create registry x 30)

# Perf Report — storybook_registry_burst (create registry x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0062ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0037ms |
| min | 0.0060ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0062ms | 0.0037ms | +0.0025ms | +68.55% |
| p50 | 0.01ms | 0.0040ms | +0.0066ms | +166.99% |
| p95 | 0.02ms | 0.01ms | +0.0051ms | +43.96% |
| p99 | 0.02ms | 0.02ms | +0.0021ms | +13.26% |
| mean | 0.01ms | 0.0053ms | +0.0053ms | +99.77% |
| min | 0.0060ms | 0.0030ms | +0.0030ms | +98.63% |
| max | 0.02ms | 0.02ms | +0.0013ms | +7.83% |
| total | 0.21ms | 0.11ms | +0.11ms | +99.77% |

### playwright_ct_mock_lifecycle (create mock x 30)

# Perf Report — playwright_ct_mock_lifecycle (create mock x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0027ms |
| p50 | 0.0036ms |
| p95 | 0.0097ms |
| p99 | 0.01ms |
| mean | 0.0043ms |
| stdev | 0.0022ms |
| min | 0.0027ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0025ms | +0.00020ms | +8.16% |
| p50 | 0.0036ms | 0.0026ms | +0.0011ms | +41.08% |
| p95 | 0.0097ms | 0.01ms | -0.00048ms | -4.72% |
| p99 | 0.01ms | 0.01ms | -0.0033ms | -24.12% |
| mean | 0.0043ms | 0.0039ms | +0.00043ms | +11.15% |
| min | 0.0027ms | 0.0025ms | +0.00017ms | +6.68% |
| max | 0.01ms | 0.01ms | -0.0040ms | -27.47% |
| total | 0.09ms | 0.08ms | +0.0087ms | +11.15% |

### chromatic_visual_snapshot (create mock x 30)

# Perf Report — chromatic_visual_snapshot (create mock x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.08ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.0088ms |
| max | 0.09ms |
| total | 0.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0058ms | +0.0060ms | +103.56% |
| p50 | 0.02ms | 0.0060ms | +0.01ms | +205.52% |
| p95 | 0.04ms | 0.01ms | +0.03ms | +247.92% |
| p99 | 0.08ms | 0.02ms | +0.06ms | +426.19% |
| mean | 0.02ms | 0.0071ms | +0.01ms | +206.74% |
| min | 0.0088ms | 0.0058ms | +0.0030ms | +51.45% |
| max | 0.09ms | 0.02ms | +0.07ms | +461.55% |
| total | 0.43ms | 0.14ms | +0.29ms | +206.74% |

