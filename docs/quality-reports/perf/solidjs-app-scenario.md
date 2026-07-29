# Perf Suite — solidjs-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00029ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00057ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| render_workflow (10 renderSolid) | 0.01ms | 0.03ms | 100ms | 0.00057ms | PASS | stable (p10 +16% (閾値未満)、 p95 +96% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| signal_reactive_batch (5 signal+effect update chains) | 0.0061ms | 0.0069ms | 100ms | 0.00057ms | PASS | regressed — gate 無効 (regressionGate=false) |
| render_error_handling (5 throw + catch in component) | 0.0085ms | 0.01ms | 100ms | 0.00057ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| render_workflow (10 renderSolid) | 0.05ms | 200ms | PASS |
| signal_reactive_batch (5 signal+effect update chains) | 0.04ms | 200ms | PASS |
| render_error_handling (5 throw + catch in component) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| render_workflow (10 renderSolid) | -6624 B | 0 B | 102400 B | yes | PASS |
| signal_reactive_batch (5 signal+effect update chains) | -233672 B | 0 B | 102400 B | yes | PASS |
| render_error_handling (5 throw + catch in component) | 5352 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### render_workflow (10 renderSolid)

# Perf Report — render_workflow (10 renderSolid).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.11ms |
| mean | 0.02ms |
| stdev | 0.03ms |
| min | 0.01ms |
| max | 0.13ms |
| total | 0.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0093ms | +0.0015ms | +16.42% |
| p50 | 0.01ms | 0.0095ms | +0.0045ms | +47.37% |
| p95 | 0.03ms | 0.02ms | +0.02ms | +95.74% |
| p99 | 0.11ms | 0.02ms | +0.09ms | +507.18% |
| mean | 0.02ms | 0.01ms | +0.0094ms | +86.12% |
| min | 0.01ms | 0.0092ms | +0.0012ms | +12.67% |
| max | 0.13ms | 0.02ms | +0.11ms | +606.90% |
| total | 0.41ms | 0.22ms | +0.19ms | +86.12% |

### signal_reactive_batch (5 signal+effect update chains)

# Perf Report — signal_reactive_batch (5 signal+effect update chains).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0061ms |
| p50 | 0.0062ms |
| p95 | 0.0069ms |
| p99 | 0.0071ms |
| mean | 0.0063ms |
| stdev | 0.00029ms |
| min | 0.0060ms |
| max | 0.0072ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0061ms | 0.0047ms | +0.0013ms | +27.98% |
| p50 | 0.0062ms | 0.0048ms | +0.0014ms | +28.03% |
| p95 | 0.0069ms | 0.0069ms | -0.0000066ms | -0.09% |
| p99 | 0.0071ms | 0.01ms | -0.0033ms | -31.38% |
| mean | 0.0063ms | 0.0055ms | +0.00072ms | +12.92% |
| min | 0.0060ms | 0.0047ms | +0.0013ms | +28.33% |
| max | 0.0072ms | 0.01ms | -0.0041ms | -36.16% |
| total | 0.13ms | 0.11ms | +0.01ms | +12.92% |

### render_error_handling (5 throw + catch in component)

# Perf Report — render_error_handling (5 throw + catch in component).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0085ms |
| p50 | 0.0087ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0092ms |
| stdev | 0.0016ms |
| min | 0.0085ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0085ms | 0.0079ms | +0.00063ms | +7.91% |
| p50 | 0.0087ms | 0.0080ms | +0.00073ms | +9.11% |
| p95 | 0.01ms | 0.01ms | -0.0031ms | -23.12% |
| p99 | 0.01ms | 0.01ms | +0.0000082ms | +0.06% |
| mean | 0.0092ms | 0.0089ms | +0.00031ms | +3.48% |
| min | 0.0085ms | 0.0079ms | +0.00063ms | +7.94% |
| max | 0.02ms | 0.01ms | +0.00079ms | +5.34% |
| total | 0.18ms | 0.18ms | +0.0062ms | +3.48% |

