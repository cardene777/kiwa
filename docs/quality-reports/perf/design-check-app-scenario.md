# Perf Suite — design-check-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00046ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00092ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | 0.14ms | 6.10ms | 100ms | 0.00092ms | PASS | stable (p10 +1% (閾値未満)、 p95 +1373% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| large_spec_conformance (spec 80 keys × 5 iter) | 0.03ms | 0.05ms | 50ms | 0.00092ms | PASS | regressed — gate 無効 (regressionGate=false) |
| regression_scan_burst (50 element layout × 10 iter) | 0.06ms | 0.06ms | 50ms | 0.00092ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | 21.66ms | 200ms | PASS |
| large_spec_conformance (spec 80 keys × 5 iter) | 0.15ms | 100ms | PASS |
| regression_scan_burst (50 element layout × 10 iter) | 0.26ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | -32384 B | 0 B | 102400 B | yes | PASS |
| large_spec_conformance (spec 80 keys × 5 iter) | 1168 B | 0 B | 102400 B | yes | PASS |
| regression_scan_burst (50 element layout × 10 iter) | -5688 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### full_design_audit (spec + layout combined 10 iter)

# Perf Report — full_design_audit (spec + layout combined 10 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.14ms |
| p50 | 0.15ms |
| p95 | 6.10ms |
| p99 | 9.24ms |
| mean | 1.01ms |
| stdev | 2.30ms |
| min | 0.12ms |
| max | 9.30ms |
| total | 30.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.14ms | 0.14ms | +0.0017ms | +1.25% |
| p50 | 0.15ms | 0.15ms | +0.0033ms | +2.24% |
| p95 | 6.10ms | 0.41ms | +5.68ms | +1372.61% |
| p99 | 9.24ms | 0.44ms | +8.79ms | +1987.41% |
| mean | 1.01ms | 0.20ms | +0.80ms | +391.90% |
| min | 0.12ms | 0.11ms | +0.0059ms | +5.41% |
| max | 9.30ms | 0.45ms | +8.85ms | +1963.98% |
| total | 30.24ms | 6.15ms | +24.09ms | +391.90% |

### large_spec_conformance (spec 80 keys × 5 iter)

# Perf Report — large_spec_conformance (spec 80 keys × 5 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.0048ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 1.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.02ms | +0.0098ms | +42.35% |
| p50 | 0.03ms | 0.02ms | +0.01ms | +44.90% |
| p95 | 0.05ms | 0.02ms | +0.02ms | +86.18% |
| p99 | 0.05ms | 0.03ms | +0.03ms | +102.48% |
| mean | 0.04ms | 0.02ms | +0.01ms | +49.70% |
| min | 0.03ms | 0.02ms | +0.0098ms | +42.42% |
| max | 0.05ms | 0.03ms | +0.03ms | +108.13% |
| total | 1.06ms | 0.71ms | +0.35ms | +49.70% |

### regression_scan_burst (50 element layout × 10 iter)

# Perf Report — regression_scan_burst (50 element layout × 10 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.06ms |
| p50 | 0.06ms |
| p95 | 0.06ms |
| p99 | 0.06ms |
| mean | 0.06ms |
| stdev | 0.0017ms |
| min | 0.06ms |
| max | 0.07ms |
| total | 1.81ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.06ms | 0.05ms | +0.01ms | +21.26% |
| p50 | 0.06ms | 0.05ms | +0.01ms | +21.80% |
| p95 | 0.06ms | 0.05ms | +0.01ms | +25.37% |
| p99 | 0.06ms | 0.05ms | +0.01ms | +26.54% |
| mean | 0.06ms | 0.05ms | +0.01ms | +22.12% |
| min | 0.06ms | 0.05ms | +0.01ms | +21.06% |
| max | 0.07ms | 0.05ms | +0.01ms | +27.02% |
| total | 1.81ms | 1.48ms | +0.33ms | +22.12% |

