# Perf Suite — design-check-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | 0.11ms | 0.44ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| large_spec_conformance (spec 80 keys × 5 iter) | 0.03ms | 0.04ms | 50ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |
| regression_scan_burst (50 element layout × 10 iter) | 0.05ms | 0.06ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | 1.20ms | 200ms | PASS |
| large_spec_conformance (spec 80 keys × 5 iter) | 0.14ms | 100ms | PASS |
| regression_scan_burst (50 element layout × 10 iter) | 0.24ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | -32480 B | 0 B | 102400 B | yes | PASS |
| large_spec_conformance (spec 80 keys × 5 iter) | 2368 B | 0 B | 102400 B | yes | PASS |
| regression_scan_burst (50 element layout × 10 iter) | -5688 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### full_design_audit (spec + layout combined 10 iter)

# Perf Report — full_design_audit (spec + layout combined 10 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.11ms |
| p50 | 0.14ms |
| p95 | 0.44ms |
| p99 | 0.46ms |
| mean | 0.20ms |
| stdev | 0.12ms |
| min | 0.11ms |
| max | 0.46ms |
| total | 6.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.11ms | 0.14ms | -0.02ms | -17.13% |
| p50 | 0.14ms | 0.15ms | -0.0064ms | -4.32% |
| p95 | 0.44ms | 0.41ms | +0.02ms | +5.84% |
| p99 | 0.46ms | 0.44ms | +0.02ms | +3.70% |
| mean | 0.20ms | 0.20ms | -0.0037ms | -1.79% |
| min | 0.11ms | 0.11ms | -0.0032ms | -2.97% |
| max | 0.46ms | 0.45ms | +0.01ms | +2.77% |
| total | 6.04ms | 6.15ms | -0.11ms | -1.79% |

### large_spec_conformance (spec 80 keys × 5 iter)

# Perf Report — large_spec_conformance (spec 80 keys × 5 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.08ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.09ms |
| total | 0.99ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.02ms | +0.0058ms | +24.84% |
| p50 | 0.03ms | 0.02ms | +0.0067ms | +28.75% |
| p95 | 0.04ms | 0.02ms | +0.01ms | +57.06% |
| p99 | 0.08ms | 0.03ms | +0.05ms | +200.52% |
| mean | 0.03ms | 0.02ms | +0.0092ms | +38.68% |
| min | 0.03ms | 0.02ms | +0.0043ms | +18.41% |
| max | 0.09ms | 0.03ms | +0.07ms | +250.49% |
| total | 0.99ms | 0.71ms | +0.27ms | +38.68% |

### regression_scan_burst (50 element layout × 10 iter)

# Perf Report — regression_scan_burst (50 element layout × 10 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.05ms |
| p50 | 0.05ms |
| p95 | 0.06ms |
| p99 | 0.06ms |
| mean | 0.05ms |
| stdev | 0.0041ms |
| min | 0.05ms |
| max | 0.06ms |
| total | 1.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.00060ms | -1.24% |
| p50 | 0.05ms | 0.05ms | +0.0033ms | +6.69% |
| p95 | 0.06ms | 0.05ms | +0.0096ms | +19.07% |
| p99 | 0.06ms | 0.05ms | +0.010ms | +19.46% |
| mean | 0.05ms | 0.05ms | +0.0029ms | +5.93% |
| min | 0.05ms | 0.05ms | -0.00050ms | -1.04% |
| max | 0.06ms | 0.05ms | +0.0098ms | +18.93% |
| total | 1.57ms | 1.48ms | +0.09ms | +5.93% |

