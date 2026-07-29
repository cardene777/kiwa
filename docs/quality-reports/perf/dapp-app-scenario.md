# Perf Suite — dapp-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | 0.05ms | 30ms | PASS | stable (差 0.03ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 0.39ms | 50ms | PASS | stable (差 0.24ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 0.05ms | 30ms | PASS | stable (差 0.01ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | 0.18ms | 60ms | PASS |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 0.71ms | 100ms | PASS |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 0.18ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | -10624 B | 0 B | 102400 B | yes | PASS |
| bulk_dapp_spec_parse (50 parseSpec rapid) | -4168 B | 0 B | 102400 B | yes | PASS |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 5208 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dapp_spec_parse (10 parseSpec of wallet spec)

# Perf Report — dapp_spec_parse (10 parseSpec of wallet spec).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.06ms |
| total | 1.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | -0.00ms | -7.31% |
| p95 | 0.05ms | 0.08ms | -0.03ms | -33.39% |
| p99 | 0.06ms | 0.17ms | -0.11ms | -66.59% |
| mean | 0.04ms | 0.05ms | -0.01ms | -21.40% |
| min | 0.03ms | 0.03ms | +0.00ms | +4.77% |
| max | 0.06ms | 0.20ms | -0.14ms | -71.63% |
| total | 1.23ms | 1.57ms | -0.34ms | -21.40% |

### bulk_dapp_spec_parse (50 parseSpec rapid)

# Perf Report — bulk_dapp_spec_parse (50 parseSpec rapid).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.14ms |
| p95 | 0.39ms |
| p99 | 0.44ms |
| mean | 0.21ms |
| stdev | 0.11ms |
| min | 0.12ms |
| max | 0.46ms |
| total | 6.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.14ms | 0.12ms | +0.01ms | +10.85% |
| p95 | 0.39ms | 0.15ms | +0.24ms | +161.42% |
| p99 | 0.44ms | 0.16ms | +0.28ms | +167.34% |
| mean | 0.21ms | 0.13ms | +0.09ms | +68.10% |
| min | 0.12ms | 0.12ms | +0.01ms | +4.66% |
| max | 0.46ms | 0.17ms | +0.28ms | +166.46% |
| total | 6.42ms | 3.82ms | +2.60ms | +68.10% |

### dapp_spec_with_module_override (10 parseSpec with opts.module)

# Perf Report — dapp_spec_with_module_override (10 parseSpec with opts.module).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.04ms |
| stdev | 0.00ms |
| min | 0.04ms |
| max | 0.06ms |
| total | 1.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | +0.00ms | +9.44% |
| p95 | 0.05ms | 0.04ms | +0.01ms | +23.83% |
| p99 | 0.06ms | 0.04ms | +0.01ms | +28.36% |
| mean | 0.04ms | 0.04ms | +0.00ms | +11.74% |
| min | 0.04ms | 0.04ms | +0.00ms | +5.36% |
| max | 0.06ms | 0.04ms | +0.01ms | +29.21% |
| total | 1.24ms | 1.11ms | +0.13ms | +11.74% |

