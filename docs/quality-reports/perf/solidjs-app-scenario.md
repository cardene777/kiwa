# Perf Suite — solidjs-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| render_workflow (10 renderSolid) | 0.01ms | 0.12ms | 100ms | 0.0012ms | PASS | stable (p10 +12% (閾値未満)、 p95 +563% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| signal_reactive_batch (5 signal+effect update chains) | 0.0051ms | 6.34ms | 100ms | 0.0012ms | PASS | stable (p10 +8% (閾値未満)、 p95 +91777% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| render_error_handling (5 throw + catch in component) | 0.0079ms | 0.01ms | 100ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| render_workflow (10 renderSolid) | 0.14ms | 200ms | PASS |
| signal_reactive_batch (5 signal+effect update chains) | 0.76ms | 200ms | PASS |
| render_error_handling (5 throw + catch in component) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| render_workflow (10 renderSolid) | 208760 B | -7682 B | 102400 B | yes | PASS |
| signal_reactive_batch (5 signal+effect update chains) | 11448 B | 0 B | 102400 B | yes | PASS |
| render_error_handling (5 throw + catch in component) | 5600 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### render_workflow (10 renderSolid)

# Perf Report — render_workflow (10 renderSolid).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.12ms |
| p99 | 0.47ms |
| mean | 0.04ms |
| stdev | 0.12ms |
| min | 0.01ms |
| max | 0.56ms |
| total | 0.90ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0093ms | +0.0011ms | +12.21% |
| p50 | 0.01ms | 0.0095ms | +0.0015ms | +15.79% |
| p95 | 0.12ms | 0.02ms | +0.10ms | +563.01% |
| p99 | 0.47ms | 0.02ms | +0.46ms | +2528.86% |
| mean | 0.04ms | 0.01ms | +0.03ms | +309.33% |
| min | 0.01ms | 0.0092ms | +0.0012ms | +12.67% |
| max | 0.56ms | 0.02ms | +0.54ms | +3005.29% |
| total | 0.90ms | 0.22ms | +0.68ms | +309.33% |

### signal_reactive_batch (5 signal+effect update chains)

# Perf Report — signal_reactive_batch (5 signal+effect update chains).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0051ms |
| p50 | 0.0066ms |
| p95 | 6.34ms |
| p99 | 20.99ms |
| mean | 1.62ms |
| stdev | 5.56ms |
| min | 0.0047ms |
| max | 24.65ms |
| total | 32.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0051ms | 0.0047ms | +0.00039ms | +8.23% |
| p50 | 0.0066ms | 0.0048ms | +0.0017ms | +35.79% |
| p95 | 6.34ms | 0.0069ms | +6.33ms | +91777.32% |
| p99 | 20.99ms | 0.01ms | +20.97ms | +201438.51% |
| mean | 1.62ms | 0.0055ms | +1.62ms | +29121.44% |
| min | 0.0047ms | 0.0047ms | 0.00ms | 0.00% |
| max | 24.65ms | 0.01ms | +24.64ms | +218187.80% |
| total | 32.44ms | 0.11ms | +32.32ms | +29121.44% |

### render_error_handling (5 throw + catch in component)

# Perf Report — render_error_handling (5 throw + catch in component).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0079ms |
| p50 | 0.0080ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0086ms |
| stdev | 0.0019ms |
| min | 0.0078ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0079ms | 0.0079ms | 0.00ms | 0.00% |
| p50 | 0.0080ms | 0.0080ms | +0.000042ms | +0.53% |
| p95 | 0.01ms | 0.01ms | -0.0031ms | -23.21% |
| p99 | 0.02ms | 0.01ms | +0.00044ms | +3.01% |
| mean | 0.0086ms | 0.0089ms | -0.00021ms | -2.40% |
| min | 0.0078ms | 0.0079ms | -0.000042ms | -0.53% |
| max | 0.02ms | 0.01ms | +0.0013ms | +8.99% |
| total | 0.17ms | 0.18ms | -0.0043ms | -2.40% |

