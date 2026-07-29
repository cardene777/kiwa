# Perf Suite — sveltekit-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| load_workflow (10 invokeLoad) | 0.0060ms | 0.02ms | 100ms | 0.00050ms | PASS | stable (p10 -2% (閾値未満)、 p95 +142% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| form_action_batch (5 invokeAction with FormData) | 0.11ms | 0.22ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| load_error_handling (5 throw + catch) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| load_workflow (10 invokeLoad) | 0.04ms | 200ms | PASS |
| form_action_batch (5 invokeAction with FormData) | 0.69ms | 200ms | PASS |
| load_error_handling (5 throw + catch) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| load_workflow (10 invokeLoad) | 6504 B | 0 B | 102400 B | yes | PASS |
| form_action_batch (5 invokeAction with FormData) | 53600 B | 0 B | 102400 B | yes | PASS |
| load_error_handling (5 throw + catch) | 632 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### load_workflow (10 invokeLoad)

# Perf Report — load_workflow (10 invokeLoad).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0060ms |
| p50 | 0.0066ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0092ms |
| stdev | 0.0055ms |
| min | 0.0059ms |
| max | 0.03ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0060ms | 0.0061ms | -0.00012ms | -2.00% |
| p50 | 0.0066ms | 0.0072ms | -0.00062ms | -8.67% |
| p95 | 0.02ms | 0.0086ms | +0.01ms | +141.84% |
| p99 | 0.03ms | 0.01ms | +0.01ms | +100.68% |
| mean | 0.0092ms | 0.0073ms | +0.0019ms | +25.83% |
| min | 0.0059ms | 0.0060ms | -0.00013ms | -2.08% |
| max | 0.03ms | 0.01ms | +0.01ms | +94.26% |
| total | 0.18ms | 0.15ms | +0.04ms | +25.83% |

### form_action_batch (5 invokeAction with FormData)

# Perf Report — form_action_batch (5 invokeAction with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.11ms |
| p50 | 0.13ms |
| p95 | 0.22ms |
| p99 | 0.32ms |
| mean | 0.15ms |
| stdev | 0.06ms |
| min | 0.10ms |
| max | 0.35ms |
| total | 2.91ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.11ms | 0.09ms | +0.01ms | +13.49% |
| p50 | 0.13ms | 0.10ms | +0.02ms | +20.67% |
| p95 | 0.22ms | 0.25ms | -0.04ms | -14.28% |
| p99 | 0.32ms | 0.34ms | -0.02ms | -4.95% |
| mean | 0.15ms | 0.13ms | +0.02ms | +12.10% |
| min | 0.10ms | 0.09ms | +0.0080ms | +8.71% |
| max | 0.35ms | 0.36ms | -0.01ms | -3.31% |
| total | 2.91ms | 2.60ms | +0.31ms | +12.10% |

### load_error_handling (5 throw + catch)

# Perf Report — load_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0047ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.04ms | -0.02ms | -66.85% |
| p50 | 0.01ms | 0.04ms | -0.03ms | -64.05% |
| p95 | 0.02ms | 0.08ms | -0.05ms | -68.73% |
| p99 | 0.03ms | 0.12ms | -0.09ms | -75.23% |
| mean | 0.02ms | 0.05ms | -0.03ms | -66.56% |
| min | 0.01ms | 0.04ms | -0.02ms | -67.72% |
| max | 0.03ms | 0.13ms | -0.10ms | -76.21% |
| total | 0.32ms | 0.97ms | -0.64ms | -66.56% |

