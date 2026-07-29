# Perf Suite — design-check-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | 0.11ms | 0.45ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| large_spec_conformance (spec 80 keys × 5 iter) | 0.03ms | 0.04ms | 50ms | 0.00049ms | PASS | regressed — gate 無効 (regressionGate=false) |
| regression_scan_burst (50 element layout × 10 iter) | 0.05ms | 0.07ms | 50ms | 0.00049ms | PASS | stable (p10 +2% (閾値未満)、 p95 +33% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | 1.42ms | 200ms | PASS |
| large_spec_conformance (spec 80 keys × 5 iter) | 0.13ms | 100ms | PASS |
| regression_scan_burst (50 element layout × 10 iter) | 0.24ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | -15400 B | 0 B | 102400 B | yes | PASS |
| large_spec_conformance (spec 80 keys × 5 iter) | 1168 B | 0 B | 102400 B | yes | PASS |
| regression_scan_burst (50 element layout × 10 iter) | 504 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### full_design_audit (spec + layout combined 10 iter)

# Perf Report — full_design_audit (spec + layout combined 10 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.11ms |
| p50 | 0.14ms |
| p95 | 0.45ms |
| p99 | 0.47ms |
| mean | 0.19ms |
| stdev | 0.12ms |
| min | 0.11ms |
| max | 0.47ms |
| total | 5.75ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.11ms | 0.14ms | -0.03ms | -21.10% |
| p50 | 0.14ms | 0.15ms | -0.01ms | -7.39% |
| p95 | 0.45ms | 0.41ms | +0.04ms | +8.79% |
| p99 | 0.47ms | 0.44ms | +0.03ms | +5.71% |
| mean | 0.19ms | 0.20ms | -0.01ms | -6.44% |
| min | 0.11ms | 0.11ms | -0.0030ms | -2.71% |
| max | 0.47ms | 0.45ms | +0.02ms | +5.31% |
| total | 5.75ms | 6.15ms | -0.40ms | -6.44% |

### large_spec_conformance (spec 80 keys × 5 iter)

# Perf Report — large_spec_conformance (spec 80 keys × 5 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.0051ms |
| min | 0.03ms |
| max | 0.06ms |
| total | 0.98ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.02ms | +0.0073ms | +31.36% |
| p50 | 0.03ms | 0.02ms | +0.0079ms | +33.45% |
| p95 | 0.04ms | 0.02ms | +0.01ms | +57.80% |
| p99 | 0.05ms | 0.03ms | +0.03ms | +102.81% |
| mean | 0.03ms | 0.02ms | +0.0089ms | +37.76% |
| min | 0.03ms | 0.02ms | +0.0062ms | +26.72% |
| max | 0.06ms | 0.03ms | +0.03ms | +117.05% |
| total | 0.98ms | 0.71ms | +0.27ms | +37.76% |

### regression_scan_burst (50 element layout × 10 iter)

# Perf Report — regression_scan_burst (50 element layout × 10 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.05ms |
| p50 | 0.05ms |
| p95 | 0.07ms |
| p99 | 0.08ms |
| mean | 0.05ms |
| stdev | 0.0074ms |
| min | 0.05ms |
| max | 0.08ms |
| total | 1.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | +0.00084ms | +1.74% |
| p50 | 0.05ms | 0.05ms | +0.0013ms | +2.67% |
| p95 | 0.07ms | 0.05ms | +0.02ms | +33.47% |
| p99 | 0.08ms | 0.05ms | +0.03ms | +52.27% |
| mean | 0.05ms | 0.05ms | +0.0047ms | +9.60% |
| min | 0.05ms | 0.05ms | +0.00088ms | +1.83% |
| max | 0.08ms | 0.05ms | +0.03ms | +57.04% |
| total | 1.62ms | 1.48ms | +0.14ms | +9.60% |

