# Perf Suite — dapp-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | 0.05ms | 30ms | PASS | stable |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 0.13ms | 50ms | PASS | stable |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 0.05ms | 30ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | 0.13ms | 60ms | PASS |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 0.70ms | 100ms | PASS |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 0.17ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | -55176 B | 0 B | 102400 B | yes | PASS |
| bulk_dapp_spec_parse (50 parseSpec rapid) | -34640 B | 0 B | 102400 B | yes | PASS |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 3536 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dapp_spec_parse (10 parseSpec of wallet spec)

# Perf Report — dapp_spec_parse (10 parseSpec of wallet spec).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 1.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | -0.01ms | -14.31% |
| p95 | 0.05ms | 0.13ms | -0.08ms | -63.26% |
| p99 | 0.05ms | 0.35ms | -0.29ms | -85.31% |
| mean | 0.04ms | 0.07ms | -0.03ms | -43.06% |
| min | 0.03ms | 0.03ms | -0.00ms | -8.17% |
| max | 0.05ms | 0.43ms | -0.38ms | -87.93% |
| total | 1.11ms | 1.96ms | -0.84ms | -43.06% |

### bulk_dapp_spec_parse (50 parseSpec rapid)

# Perf Report — bulk_dapp_spec_parse (50 parseSpec rapid).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.11ms |
| p95 | 0.13ms |
| p99 | 0.14ms |
| mean | 0.12ms |
| stdev | 0.01ms |
| min | 0.11ms |
| max | 0.15ms |
| total | 3.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.11ms | 0.14ms | -0.02ms | -16.42% |
| p95 | 0.13ms | 0.15ms | -0.01ms | -9.98% |
| p99 | 0.14ms | 0.15ms | -0.01ms | -4.11% |
| mean | 0.12ms | 0.14ms | -0.02ms | -12.88% |
| min | 0.11ms | 0.12ms | -0.01ms | -9.05% |
| max | 0.15ms | 0.15ms | -0.00ms | -2.09% |
| total | 3.55ms | 4.07ms | -0.52ms | -12.88% |

### dapp_spec_with_module_override (10 parseSpec with opts.module)

# Perf Report — dapp_spec_with_module_override (10 parseSpec with opts.module).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.08ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.04ms |
| max | 0.08ms |
| total | 1.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | -0.00ms | -1.41% |
| p95 | 0.05ms | 0.04ms | +0.01ms | +25.74% |
| p99 | 0.08ms | 0.04ms | +0.03ms | +73.58% |
| mean | 0.04ms | 0.04ms | +0.00ms | +4.00% |
| min | 0.04ms | 0.04ms | -0.00ms | -4.54% |
| max | 0.08ms | 0.04ms | +0.04ms | +88.16% |
| total | 1.17ms | 1.13ms | +0.05ms | +4.00% |

