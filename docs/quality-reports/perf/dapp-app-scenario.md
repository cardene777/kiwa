# Perf Suite — dapp-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | 0.03ms | 0.06ms | 30ms | 0.00042ms | PASS | stable (p10 +1% (閾値未満)、 p95 +22% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 0.11ms | 0.26ms | 50ms | 0.00042ms | PASS | stable (p10 -1% (閾値未満)、 p95 +72% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 0.04ms | 0.05ms | 30ms | 0.00042ms | PASS | stable (p10 +10% (閾値未満)、 p95 +25% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | 0.14ms | 60ms | PASS |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 0.73ms | 100ms | PASS |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 0.18ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | -40632 B | 0 B | 102400 B | yes | PASS |
| bulk_dapp_spec_parse (50 parseSpec rapid) | -24280 B | 0 B | 102400 B | yes | PASS |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 3336 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dapp_spec_parse (10 parseSpec of wallet spec)

# Perf Report — dapp_spec_parse (10 parseSpec of wallet spec).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.06ms |
| p99 | 0.08ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.09ms |
| total | 1.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.00030ms | +0.98% |
| p50 | 0.03ms | 0.04ms | -0.0033ms | -9.18% |
| p95 | 0.06ms | 0.05ms | +0.010ms | +22.04% |
| p99 | 0.08ms | 0.05ms | +0.03ms | +69.27% |
| mean | 0.04ms | 0.04ms | +0.0024ms | +6.58% |
| min | 0.03ms | 0.03ms | +0.00038ms | +1.24% |
| max | 0.09ms | 0.05ms | +0.04ms | +87.27% |
| total | 1.14ms | 1.07ms | +0.07ms | +6.58% |

### bulk_dapp_spec_parse (50 parseSpec rapid)

# Perf Report — bulk_dapp_spec_parse (50 parseSpec rapid).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.11ms |
| p50 | 0.12ms |
| p95 | 0.26ms |
| p99 | 0.32ms |
| mean | 0.15ms |
| stdev | 0.06ms |
| min | 0.11ms |
| max | 0.33ms |
| total | 4.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.11ms | 0.11ms | -0.0015ms | -1.30% |
| p50 | 0.12ms | 0.12ms | +0.0040ms | +3.45% |
| p95 | 0.26ms | 0.15ms | +0.11ms | +71.92% |
| p99 | 0.32ms | 0.16ms | +0.17ms | +104.48% |
| mean | 0.15ms | 0.12ms | +0.03ms | +20.49% |
| min | 0.11ms | 0.11ms | -0.00046ms | -0.43% |
| max | 0.33ms | 0.16ms | +0.17ms | +109.89% |
| total | 4.42ms | 3.67ms | +0.75ms | +20.49% |

### dapp_spec_with_module_override (10 parseSpec with opts.module)

# Perf Report — dapp_spec_with_module_override (10 parseSpec with opts.module).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.04ms |
| stdev | 0.0065ms |
| min | 0.04ms |
| max | 0.07ms |
| total | 1.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.03ms | +0.0032ms | +9.68% |
| p50 | 0.04ms | 0.03ms | +0.0034ms | +10.29% |
| p95 | 0.05ms | 0.04ms | +0.0095ms | +25.19% |
| p99 | 0.06ms | 0.04ms | +0.02ms | +60.45% |
| mean | 0.04ms | 0.03ms | +0.0046ms | +13.46% |
| min | 0.04ms | 0.03ms | +0.0028ms | +8.32% |
| max | 0.07ms | 0.04ms | +0.03ms | +72.60% |
| total | 1.17ms | 1.04ms | +0.14ms | +13.46% |

