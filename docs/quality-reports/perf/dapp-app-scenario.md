# Perf Suite — dapp-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | 0.03ms | 0.05ms | 30ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 0.10ms | 0.12ms | 50ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 0.03ms | 0.04ms | 30ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | 0.13ms | 60ms | PASS |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 0.62ms | 100ms | PASS |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 0.17ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | -39208 B | 0 B | 102400 B | yes | PASS |
| bulk_dapp_spec_parse (50 parseSpec rapid) | -25240 B | 0 B | 102400 B | yes | PASS |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 3048 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.08ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.10ms |
| total | 1.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00029ms | -0.94% |
| p50 | 0.03ms | 0.04ms | -0.0046ms | -12.70% |
| p95 | 0.05ms | 0.05ms | +0.0049ms | +10.73% |
| p99 | 0.08ms | 0.05ms | +0.04ms | +79.08% |
| mean | 0.04ms | 0.04ms | +0.0012ms | +3.23% |
| min | 0.03ms | 0.03ms | -0.00058ms | -1.92% |
| max | 0.10ms | 0.05ms | +0.05ms | +105.92% |
| total | 1.11ms | 1.07ms | +0.03ms | +3.23% |

### bulk_dapp_spec_parse (50 parseSpec rapid)

# Perf Report — bulk_dapp_spec_parse (50 parseSpec rapid).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.10ms |
| p50 | 0.11ms |
| p95 | 0.12ms |
| p99 | 0.13ms |
| mean | 0.11ms |
| stdev | 0.0070ms |
| min | 0.10ms |
| max | 0.13ms |
| total | 3.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.10ms | 0.11ms | -0.0078ms | -7.00% |
| p50 | 0.11ms | 0.12ms | -0.0094ms | -8.05% |
| p95 | 0.12ms | 0.15ms | -0.03ms | -20.06% |
| p99 | 0.13ms | 0.16ms | -0.03ms | -16.30% |
| mean | 0.11ms | 0.12ms | -0.01ms | -10.35% |
| min | 0.10ms | 0.11ms | -0.0035ms | -3.31% |
| max | 0.13ms | 0.16ms | -0.03ms | -15.87% |
| total | 3.29ms | 3.67ms | -0.38ms | -10.35% |

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
| stdev | 0.0082ms |
| min | 0.03ms |
| max | 0.08ms |
| total | 1.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.000082ms | -0.25% |
| p50 | 0.03ms | 0.03ms | +0.0011ms | +3.30% |
| p95 | 0.04ms | 0.04ms | +0.0016ms | +4.22% |
| p99 | 0.07ms | 0.04ms | +0.03ms | +70.76% |
| mean | 0.04ms | 0.03ms | +0.0018ms | +5.18% |
| min | 0.03ms | 0.03ms | -0.00071ms | -2.14% |
| max | 0.08ms | 0.04ms | +0.04ms | +95.24% |
| total | 1.09ms | 1.04ms | +0.05ms | +5.18% |

