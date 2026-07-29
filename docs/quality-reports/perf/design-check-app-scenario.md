# Perf Suite — design-check-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | 0.14ms | 0.50ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| large_spec_conformance (spec 80 keys × 5 iter) | 0.03ms | 0.05ms | 50ms | 0.00049ms | PASS | regressed — gate 無効 (regressionGate=false) |
| regression_scan_burst (50 element layout × 10 iter) | 0.05ms | 0.06ms | 50ms | 0.00049ms | PASS | stable (p10 +9% (閾値未満)、 p95 +28% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | 1.40ms | 200ms | PASS |
| large_spec_conformance (spec 80 keys × 5 iter) | 0.17ms | 100ms | PASS |
| regression_scan_burst (50 element layout × 10 iter) | 0.48ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | -32584 B | 0 B | 102400 B | yes | PASS |
| large_spec_conformance (spec 80 keys × 5 iter) | -824 B | 0 B | 102400 B | yes | PASS |
| regression_scan_burst (50 element layout × 10 iter) | 344 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### full_design_audit (spec + layout combined 10 iter)

# Perf Report — full_design_audit (spec + layout combined 10 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.14ms |
| p50 | 0.18ms |
| p95 | 0.50ms |
| p99 | 0.58ms |
| mean | 0.24ms |
| stdev | 0.13ms |
| min | 0.12ms |
| max | 0.60ms |
| total | 7.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.14ms | 0.14ms | +0.0034ms | +2.43% |
| p50 | 0.18ms | 0.15ms | +0.03ms | +23.32% |
| p95 | 0.50ms | 0.41ms | +0.08ms | +19.82% |
| p99 | 0.58ms | 0.44ms | +0.14ms | +32.14% |
| mean | 0.24ms | 0.20ms | +0.03ms | +16.80% |
| min | 0.12ms | 0.11ms | +0.01ms | +9.68% |
| max | 0.60ms | 0.45ms | +0.15ms | +33.05% |
| total | 7.18ms | 6.15ms | +1.03ms | +16.80% |

### large_spec_conformance (spec 80 keys × 5 iter)

# Perf Report — large_spec_conformance (spec 80 keys × 5 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.05ms |
| p99 | 0.07ms |
| mean | 0.04ms |
| stdev | 0.0087ms |
| min | 0.03ms |
| max | 0.07ms |
| total | 1.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.02ms | +0.0091ms | +39.32% |
| p50 | 0.03ms | 0.02ms | +0.01ms | +43.30% |
| p95 | 0.05ms | 0.02ms | +0.03ms | +111.50% |
| p99 | 0.07ms | 0.03ms | +0.04ms | +165.25% |
| mean | 0.04ms | 0.02ms | +0.01ms | +54.63% |
| min | 0.03ms | 0.02ms | +0.0088ms | +38.27% |
| max | 0.07ms | 0.03ms | +0.05ms | +176.60% |
| total | 1.10ms | 0.71ms | +0.39ms | +54.63% |

### regression_scan_burst (50 element layout × 10 iter)

# Perf Report — regression_scan_burst (50 element layout × 10 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.05ms |
| p50 | 0.05ms |
| p95 | 0.06ms |
| p99 | 0.08ms |
| mean | 0.06ms |
| stdev | 0.0070ms |
| min | 0.05ms |
| max | 0.09ms |
| total | 1.69ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | +0.0045ms | +9.42% |
| p50 | 0.05ms | 0.05ms | +0.0048ms | +9.69% |
| p95 | 0.06ms | 0.05ms | +0.01ms | +28.41% |
| p99 | 0.08ms | 0.05ms | +0.03ms | +62.91% |
| mean | 0.06ms | 0.05ms | +0.0070ms | +14.13% |
| min | 0.05ms | 0.05ms | +0.0046ms | +9.57% |
| max | 0.09ms | 0.05ms | +0.04ms | +73.70% |
| total | 1.69ms | 1.48ms | +0.21ms | +14.13% |

