# Perf Suite — design-check-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | 0.13ms | 0.41ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| large_spec_conformance (spec 80 keys × 5 iter) | 0.03ms | 0.04ms | 50ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |
| regression_scan_burst (50 element layout × 10 iter) | 0.05ms | 0.05ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | 1.65ms | 200ms | PASS |
| large_spec_conformance (spec 80 keys × 5 iter) | 0.14ms | 100ms | PASS |
| regression_scan_burst (50 element layout × 10 iter) | 0.24ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | -32448 B | 0 B | 102400 B | yes | PASS |
| large_spec_conformance (spec 80 keys × 5 iter) | -664 B | 0 B | 102400 B | yes | PASS |
| regression_scan_burst (50 element layout × 10 iter) | -1944 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### full_design_audit (spec + layout combined 10 iter)

# Perf Report — full_design_audit (spec + layout combined 10 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.13ms |
| p50 | 0.14ms |
| p95 | 0.41ms |
| p99 | 0.50ms |
| mean | 0.19ms |
| stdev | 0.12ms |
| min | 0.11ms |
| max | 0.54ms |
| total | 5.81ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.13ms | 0.14ms | -0.0087ms | -6.28% |
| p50 | 0.14ms | 0.15ms | -0.01ms | -8.59% |
| p95 | 0.41ms | 0.41ms | -0.0088ms | -2.13% |
| p99 | 0.50ms | 0.44ms | +0.06ms | +13.47% |
| mean | 0.19ms | 0.20ms | -0.01ms | -5.42% |
| min | 0.11ms | 0.11ms | -0.0022ms | -1.98% |
| max | 0.54ms | 0.45ms | +0.09ms | +20.15% |
| total | 5.81ms | 6.15ms | -0.33ms | -5.42% |

### large_spec_conformance (spec 80 keys × 5 iter)

# Perf Report — large_spec_conformance (spec 80 keys × 5 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.06ms |
| mean | 0.03ms |
| stdev | 0.0083ms |
| min | 0.03ms |
| max | 0.07ms |
| total | 0.97ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.02ms | +0.0065ms | +27.93% |
| p50 | 0.03ms | 0.02ms | +0.0070ms | +29.63% |
| p95 | 0.04ms | 0.02ms | +0.01ms | +47.04% |
| p99 | 0.06ms | 0.03ms | +0.04ms | +151.16% |
| mean | 0.03ms | 0.02ms | +0.0085ms | +36.02% |
| min | 0.03ms | 0.02ms | +0.0056ms | +24.37% |
| max | 0.07ms | 0.03ms | +0.05ms | +186.15% |
| total | 0.97ms | 0.71ms | +0.26ms | +36.02% |

### regression_scan_burst (50 element layout × 10 iter)

# Perf Report — regression_scan_burst (50 element layout × 10 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.05ms |
| p50 | 0.05ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.05ms |
| stdev | 0.0018ms |
| min | 0.05ms |
| max | 0.06ms |
| total | 1.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.0012ms | -2.41% |
| p50 | 0.05ms | 0.05ms | -0.0016ms | -3.34% |
| p95 | 0.05ms | 0.05ms | +0.00043ms | +0.86% |
| p99 | 0.05ms | 0.05ms | +0.0035ms | +6.77% |
| mean | 0.05ms | 0.05ms | -0.0014ms | -2.77% |
| min | 0.05ms | 0.05ms | -0.00088ms | -1.83% |
| max | 0.06ms | 0.05ms | +0.0043ms | +8.25% |
| total | 1.44ms | 1.48ms | -0.04ms | -2.77% |

