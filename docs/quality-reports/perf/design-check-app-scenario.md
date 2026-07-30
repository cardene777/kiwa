# Perf Suite — design-check-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | 0.14ms | 0.38ms | 100ms | 0.00046ms | PASS | stable — gate 無効 (regressionGate=false) |
| large_spec_conformance (spec 80 keys × 5 iter) | 0.03ms | 0.04ms | 50ms | 0.00046ms | PASS | stable — gate 無効 (regressionGate=false) |
| regression_scan_burst (50 element layout × 10 iter) | 0.05ms | 0.06ms | 50ms | 0.00044ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | cpu | 0.08ms | 0.09ms | 0.14ms | 1.685 | 1.455 | 0.15ms | 0.13ms |
| large_spec_conformance (spec 80 keys × 5 iter) | cpu | 0.08ms | 0.08ms | 0.03ms | 0.369 | 0.348 | 0.03ms | 0.03ms |
| regression_scan_burst (50 element layout × 10 iter) | cpu | 0.08ms | 0.08ms | 0.05ms | 0.609 | 0.580 | 0.05ms | 0.05ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | 1.30ms | 200ms | PASS |
| large_spec_conformance (spec 80 keys × 5 iter) | 0.18ms | 100ms | PASS |
| regression_scan_burst (50 element layout × 10 iter) | 0.24ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | -20536 B | 0 B | 102400 B | yes | PASS |
| large_spec_conformance (spec 80 keys × 5 iter) | 7488 B | 0 B | 102400 B | yes | PASS |
| regression_scan_burst (50 element layout × 10 iter) | 344 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### full_design_audit (spec + layout combined 10 iter)

# Perf Report — full_design_audit (spec + layout combined 10 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.14ms |
| p50 | 0.14ms |
| p95 | 0.38ms |
| p99 | 0.41ms |
| mean | 0.19ms |
| stdev | 0.10ms |
| min | 0.11ms |
| max | 0.42ms |
| total | 5.70ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.102)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.15ms | 0.13ms | +0.02ms | +15.82% |
| p50 | 0.15ms | 0.16ms | -0.0044ms | -2.77% |
| p95 | 0.42ms | 1.06ms | -0.64ms | -60.49% |
| p99 | 0.45ms | 1.46ms | -1.01ms | -69.36% |
| mean | 0.21ms | 0.32ms | -0.11ms | -34.34% |
| min | 0.12ms | 0.11ms | +0.01ms | +10.61% |
| max | 0.46ms | 1.47ms | -1.01ms | -68.70% |
| total | 6.28ms | 9.56ms | -3.28ms | -34.34% |

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
| stdev | 0.0072ms |
| min | 0.03ms |
| max | 0.07ms |
| total | 0.99ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.095)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.0019ms | +6.20% |
| p50 | 0.03ms | 0.03ms | +0.0019ms | +5.80% |
| p95 | 0.04ms | 0.09ms | -0.05ms | -52.08% |
| p99 | 0.07ms | 0.11ms | -0.05ms | -41.46% |
| mean | 0.04ms | 0.05ms | -0.01ms | -23.02% |
| min | 0.03ms | 0.03ms | +0.0015ms | +4.80% |
| max | 0.08ms | 0.12ms | -0.05ms | -37.62% |
| total | 1.09ms | 1.41ms | -0.32ms | -23.02% |

### regression_scan_burst (50 element layout × 10 iter)

# Perf Report — regression_scan_burst (50 element layout × 10 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.05ms |
| p50 | 0.05ms |
| p95 | 0.06ms |
| p99 | 0.16ms |
| mean | 0.06ms |
| stdev | 0.03ms |
| min | 0.05ms |
| max | 0.20ms |
| total | 1.71ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.052)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | +0.0024ms | +4.85% |
| p50 | 0.05ms | 0.05ms | +0.0026ms | +5.03% |
| p95 | 0.06ms | 0.05ms | +0.0097ms | +18.15% |
| p99 | 0.17ms | 0.06ms | +0.11ms | +204.37% |
| mean | 0.06ms | 0.05ms | +0.0084ms | +16.21% |
| min | 0.05ms | 0.05ms | +0.0025ms | +4.94% |
| max | 0.21ms | 0.06ms | +0.16ms | +276.29% |
| total | 1.80ms | 1.55ms | +0.25ms | +16.21% |

