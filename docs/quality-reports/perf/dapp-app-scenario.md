# Perf Suite — dapp-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | 0.03ms | 0.05ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 0.10ms | 0.12ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 0.03ms | 0.04ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | 0.16ms | 60ms | PASS |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 0.65ms | 100ms | PASS |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 0.16ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | -44816 B | 0 B | 102400 B | yes | PASS |
| bulk_dapp_spec_parse (50 parseSpec rapid) | -19688 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.0053ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 1.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00038ms | -1.24% |
| p50 | 0.03ms | 0.04ms | -0.0052ms | -14.48% |
| p95 | 0.05ms | 0.05ms | -0.00021ms | -0.46% |
| p99 | 0.05ms | 0.05ms | +0.0013ms | +2.74% |
| mean | 0.03ms | 0.04ms | -0.0015ms | -4.06% |
| min | 0.03ms | 0.03ms | -0.00042ms | -1.37% |
| max | 0.05ms | 0.05ms | +0.0015ms | +3.23% |
| total | 1.03ms | 1.07ms | -0.04ms | -4.06% |

### bulk_dapp_spec_parse (50 parseSpec rapid)

# Perf Report — bulk_dapp_spec_parse (50 parseSpec rapid).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.10ms |
| p50 | 0.10ms |
| p95 | 0.12ms |
| p99 | 0.13ms |
| mean | 0.11ms |
| stdev | 0.0073ms |
| min | 0.10ms |
| max | 0.13ms |
| total | 3.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.10ms | 0.11ms | -0.0093ms | -8.33% |
| p50 | 0.10ms | 0.12ms | -0.01ms | -11.28% |
| p95 | 0.12ms | 0.15ms | -0.03ms | -19.83% |
| p99 | 0.13ms | 0.16ms | -0.03ms | -18.82% |
| mean | 0.11ms | 0.12ms | -0.01ms | -11.97% |
| min | 0.10ms | 0.11ms | -0.0055ms | -5.13% |
| max | 0.13ms | 0.16ms | -0.03ms | -18.91% |
| total | 3.23ms | 3.67ms | -0.44ms | -11.97% |

### dapp_spec_with_module_override (10 parseSpec with opts.module)

# Perf Report — dapp_spec_with_module_override (10 parseSpec with opts.module).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.07ms |
| mean | 0.04ms |
| stdev | 0.0097ms |
| min | 0.03ms |
| max | 0.09ms |
| total | 1.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00025ms | -0.75% |
| p50 | 0.03ms | 0.03ms | +0.0011ms | +3.30% |
| p95 | 0.04ms | 0.04ms | +0.0039ms | +10.29% |
| p99 | 0.07ms | 0.04ms | +0.03ms | +85.83% |
| mean | 0.04ms | 0.03ms | +0.0023ms | +6.69% |
| min | 0.03ms | 0.03ms | -0.00096ms | -2.90% |
| max | 0.09ms | 0.04ms | +0.05ms | +114.58% |
| total | 1.10ms | 1.04ms | +0.07ms | +6.69% |

