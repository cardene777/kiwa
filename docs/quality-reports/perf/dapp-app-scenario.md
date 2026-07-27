# Perf Suite — dapp-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | 0.05ms | 30ms | PASS | stable |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 0.16ms | 50ms | PASS | regressed |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 0.04ms | 30ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | 0.13ms | 60ms | PASS |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 0.56ms | 100ms | PASS |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 0.13ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | 2266976 B | 0 B | 102400 B | PASS |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 11242656 B | 0 B | 102400 B | PASS |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 2263552 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### dapp_spec_parse (10 parseSpec of wallet spec)

# Perf Report — dapp_spec_parse (10 parseSpec of wallet spec).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.03ms |
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.07ms |
| total | 1.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.00ms | +0.00% |
| p95 | 0.05ms | 0.05ms | -0.00ms | -3.12% |
| p99 | 0.06ms | 0.06ms | +0.01ms | +14.83% |
| mean | 0.04ms | 0.04ms | +0.00ms | +2.50% |
| min | 0.03ms | 0.03ms | +0.00ms | +2.14% |
| max | 0.07ms | 0.06ms | +0.01ms | +24.42% |
| total | 1.09ms | 1.06ms | +0.03ms | +2.50% |

### bulk_dapp_spec_parse (50 parseSpec rapid)

# Perf Report — bulk_dapp_spec_parse (50 parseSpec rapid).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.13ms |
| p95 | 0.16ms |
| p99 | 0.34ms |
| mean | 0.14ms |
| stdev | 0.05ms |
| min | 0.11ms |
| max | 0.41ms |
| total | 4.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.13ms | 0.11ms | +0.02ms | +19.67% |
| p95 | 0.16ms | 0.12ms | +0.05ms | +38.13% |
| p99 | 0.34ms | 0.12ms | +0.22ms | +183.37% |
| mean | 0.14ms | 0.11ms | +0.03ms | +24.95% |
| min | 0.11ms | 0.10ms | +0.00ms | +2.71% |
| max | 0.41ms | 0.12ms | +0.29ms | +238.83% |
| total | 4.07ms | 3.26ms | +0.81ms | +24.95% |

### dapp_spec_with_module_override (10 parseSpec with opts.module)

# Perf Report — dapp_spec_with_module_override (10 parseSpec with opts.module).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.95ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | -0.00ms | -11.94% |
| p95 | 0.04ms | 0.04ms | +0.00ms | +0.83% |
| p99 | 0.04ms | 0.04ms | -0.00ms | -1.47% |
| mean | 0.03ms | 0.03ms | -0.00ms | -7.43% |
| min | 0.03ms | 0.03ms | -0.00ms | -10.84% |
| max | 0.04ms | 0.04ms | -0.00ms | -2.11% |
| total | 0.95ms | 1.03ms | -0.08ms | -7.43% |

