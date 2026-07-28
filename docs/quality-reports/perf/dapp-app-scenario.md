# Perf Suite — dapp-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | 0.08ms | 30ms | PASS | stable (検知には +0.5ms (baseline 比 +634%) 以上の悪化が必要) |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 0.13ms | 50ms | PASS | stable (検知には +0.5ms (baseline 比 +339%) 以上の悪化が必要) |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 0.05ms | 30ms | PASS | stable (検知には +0.5ms (baseline 比 +1257%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | 0.19ms | 60ms | PASS |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 0.64ms | 100ms | PASS |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 0.16ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | -52512 B | 0 B | 102400 B | yes | PASS |
| bulk_dapp_spec_parse (50 parseSpec rapid) | -33848 B | 0 B | 102400 B | yes | PASS |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 3336 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dapp_spec_parse (10 parseSpec of wallet spec)

# Perf Report — dapp_spec_parse (10 parseSpec of wallet spec).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.04ms |
| p95 | 0.08ms |
| p99 | 0.10ms |
| mean | 0.04ms |
| stdev | 0.02ms |
| min | 0.03ms |
| max | 0.10ms |
| total | 1.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | -0.00ms | -6.30% |
| p95 | 0.08ms | 0.08ms | +0.01ms | +6.91% |
| p99 | 0.10ms | 0.17ms | -0.07ms | -41.53% |
| mean | 0.04ms | 0.05ms | -0.01ms | -17.72% |
| min | 0.03ms | 0.03ms | -0.00ms | -8.41% |
| max | 0.10ms | 0.20ms | -0.10ms | -48.97% |
| total | 1.29ms | 1.57ms | -0.28ms | -17.72% |

### bulk_dapp_spec_parse (50 parseSpec rapid)

# Perf Report — bulk_dapp_spec_parse (50 parseSpec rapid).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.11ms |
| p95 | 0.13ms |
| p99 | 0.15ms |
| mean | 0.11ms |
| stdev | 0.01ms |
| min | 0.11ms |
| max | 0.15ms |
| total | 3.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.11ms | 0.12ms | -0.01ms | -11.64% |
| p95 | 0.13ms | 0.15ms | -0.02ms | -12.41% |
| p99 | 0.15ms | 0.16ms | -0.02ms | -11.43% |
| mean | 0.11ms | 0.13ms | -0.01ms | -10.80% |
| min | 0.11ms | 0.12ms | -0.01ms | -8.13% |
| max | 0.15ms | 0.17ms | -0.02ms | -11.74% |
| total | 3.41ms | 3.82ms | -0.41ms | -10.80% |

### dapp_spec_with_module_override (10 parseSpec with opts.module)

# Perf Report — dapp_spec_with_module_override (10 parseSpec with opts.module).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.03ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.00ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 1.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.04ms | -0.00ms | -5.32% |
| p95 | 0.05ms | 0.04ms | +0.01ms | +17.60% |
| p99 | 0.05ms | 0.04ms | +0.01ms | +14.85% |
| mean | 0.04ms | 0.04ms | -0.00ms | -1.57% |
| min | 0.03ms | 0.04ms | -0.00ms | -8.97% |
| max | 0.05ms | 0.04ms | +0.01ms | +12.83% |
| total | 1.09ms | 1.11ms | -0.02ms | -1.57% |

