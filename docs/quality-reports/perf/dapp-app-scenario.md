# Perf Suite — dapp-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | 0.03ms | 0.05ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 0.11ms | 0.14ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 0.03ms | 0.04ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | 0.18ms | 60ms | PASS |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 0.65ms | 100ms | PASS |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 0.18ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | -52520 B | 0 B | 102400 B | yes | PASS |
| bulk_dapp_spec_parse (50 parseSpec rapid) | -18696 B | 0 B | 102400 B | yes | PASS |
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
| mean | 0.04ms |
| stdev | 0.0059ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 1.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00016ms | -0.52% |
| p50 | 0.03ms | 0.04ms | -0.0048ms | -13.39% |
| p95 | 0.05ms | 0.05ms | -0.00032ms | -0.71% |
| p99 | 0.05ms | 0.05ms | +0.00073ms | +1.57% |
| mean | 0.04ms | 0.04ms | -0.00048ms | -1.35% |
| min | 0.03ms | 0.03ms | -0.00013ms | -0.41% |
| max | 0.05ms | 0.05ms | +0.0014ms | +3.05% |
| total | 1.06ms | 1.07ms | -0.01ms | -1.35% |

### bulk_dapp_spec_parse (50 parseSpec rapid)

# Perf Report — bulk_dapp_spec_parse (50 parseSpec rapid).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.11ms |
| p50 | 0.11ms |
| p95 | 0.14ms |
| p99 | 0.23ms |
| mean | 0.12ms |
| stdev | 0.03ms |
| min | 0.10ms |
| max | 0.26ms |
| total | 3.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.11ms | 0.11ms | -0.0061ms | -5.44% |
| p50 | 0.11ms | 0.12ms | -0.0057ms | -4.83% |
| p95 | 0.14ms | 0.15ms | -0.01ms | -8.65% |
| p99 | 0.23ms | 0.16ms | +0.07ms | +44.81% |
| mean | 0.12ms | 0.12ms | -0.00083ms | -0.68% |
| min | 0.10ms | 0.11ms | -0.0029ms | -2.72% |
| max | 0.26ms | 0.16ms | +0.11ms | +66.43% |
| total | 3.64ms | 3.67ms | -0.03ms | -0.68% |

### dapp_spec_with_module_override (10 parseSpec with opts.module)

# Perf Report — dapp_spec_with_module_override (10 parseSpec with opts.module).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.04ms |
| p99 | 0.08ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.09ms |
| total | 1.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.0017ms | +5.13% |
| p50 | 0.04ms | 0.03ms | +0.0024ms | +7.17% |
| p95 | 0.04ms | 0.04ms | +0.0021ms | +5.58% |
| p99 | 0.08ms | 0.04ms | +0.04ms | +94.39% |
| mean | 0.04ms | 0.03ms | +0.0034ms | +9.72% |
| min | 0.03ms | 0.03ms | +0.0015ms | +4.53% |
| max | 0.09ms | 0.04ms | +0.05ms | +127.92% |
| total | 1.14ms | 1.04ms | +0.10ms | +9.72% |

