# Perf Suite — dapp-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00020ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00041ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | 0.03ms | 0.07ms | 30ms | 0.00041ms | PASS | stable (p10 +12% (閾値未満)、 p95 +44% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 0.11ms | 0.12ms | 50ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 0.04ms | 0.07ms | 30ms | 0.00041ms | PASS | stable (p10 +11% (閾値未満)、 p95 +80% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | 0.18ms | 60ms | PASS |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 0.75ms | 100ms | PASS |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 0.19ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | -51720 B | 0 B | 102400 B | yes | PASS |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 3096 B | 0 B | 102400 B | yes | PASS |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 4536 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dapp_spec_parse (10 parseSpec of wallet spec)

# Perf Report — dapp_spec_parse (10 parseSpec of wallet spec).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.07ms |
| p99 | 0.07ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.07ms |
| total | 1.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.0036ms | +11.90% |
| p50 | 0.04ms | 0.04ms | +0.0019ms | +5.37% |
| p95 | 0.07ms | 0.05ms | +0.02ms | +44.45% |
| p99 | 0.07ms | 0.05ms | +0.03ms | +55.89% |
| mean | 0.04ms | 0.04ms | +0.0061ms | +17.19% |
| min | 0.03ms | 0.03ms | +0.0034ms | +11.13% |
| max | 0.07ms | 0.05ms | +0.03ms | +58.57% |
| total | 1.26ms | 1.07ms | +0.18ms | +17.19% |

### bulk_dapp_spec_parse (50 parseSpec rapid)

# Perf Report — bulk_dapp_spec_parse (50 parseSpec rapid).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.11ms |
| p50 | 0.11ms |
| p95 | 0.12ms |
| p99 | 0.13ms |
| mean | 0.12ms |
| stdev | 0.0061ms |
| min | 0.11ms |
| max | 0.14ms |
| total | 3.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.11ms | 0.11ms | -0.0012ms | -1.03% |
| p50 | 0.11ms | 0.12ms | -0.0046ms | -3.91% |
| p95 | 0.12ms | 0.15ms | -0.03ms | -19.23% |
| p99 | 0.13ms | 0.16ms | -0.02ms | -15.13% |
| mean | 0.12ms | 0.12ms | -0.0066ms | -5.37% |
| min | 0.11ms | 0.11ms | +0.0031ms | +2.92% |
| max | 0.14ms | 0.16ms | -0.02ms | -13.38% |
| total | 3.47ms | 3.67ms | -0.20ms | -5.37% |

### dapp_spec_with_module_override (10 parseSpec with opts.module)

# Perf Report — dapp_spec_with_module_override (10 parseSpec with opts.module).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.07ms |
| p99 | 0.21ms |
| mean | 0.05ms |
| stdev | 0.04ms |
| min | 0.04ms |
| max | 0.26ms |
| total | 1.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.03ms | +0.0038ms | +11.38% |
| p50 | 0.04ms | 0.03ms | +0.0068ms | +20.45% |
| p95 | 0.07ms | 0.04ms | +0.03ms | +79.94% |
| p99 | 0.21ms | 0.04ms | +0.17ms | +423.43% |
| mean | 0.05ms | 0.03ms | +0.01ms | +42.89% |
| min | 0.04ms | 0.03ms | +0.0029ms | +8.82% |
| max | 0.26ms | 0.04ms | +0.22ms | +552.22% |
| total | 1.48ms | 1.04ms | +0.44ms | +42.89% |

