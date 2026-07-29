# Perf Suite — dapp-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | 0.04ms | 0.07ms | 30ms | 0.00049ms | PASS | regressed — gate 無効 (regressionGate=false) |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 0.12ms | 0.14ms | 50ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 0.04ms | 0.05ms | 30ms | 0.00049ms | PASS | stable (p10 +14% (閾値未満)、 p95 +37% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | 0.17ms | 60ms | PASS |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 2.27ms | 100ms | PASS |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 0.99ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | -50104 B | -21318 B | 102400 B | yes | PASS |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 2928 B | 0 B | 102400 B | yes | PASS |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 2184 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dapp_spec_parse (10 parseSpec of wallet spec)

# Perf Report — dapp_spec_parse (10 parseSpec of wallet spec).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.05ms |
| p95 | 0.07ms |
| p99 | 0.07ms |
| mean | 0.05ms |
| stdev | 0.01ms |
| min | 0.04ms |
| max | 0.07ms |
| total | 1.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.03ms | +0.0096ms | +31.41% |
| p50 | 0.05ms | 0.04ms | +0.01ms | +27.87% |
| p95 | 0.07ms | 0.05ms | +0.02ms | +46.09% |
| p99 | 0.07ms | 0.05ms | +0.03ms | +55.85% |
| mean | 0.05ms | 0.04ms | +0.02ms | +43.55% |
| min | 0.04ms | 0.03ms | +0.0097ms | +32.00% |
| max | 0.07ms | 0.05ms | +0.03ms | +59.91% |
| total | 1.54ms | 1.07ms | +0.47ms | +43.55% |

### bulk_dapp_spec_parse (50 parseSpec rapid)

# Perf Report — bulk_dapp_spec_parse (50 parseSpec rapid).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.12ms |
| p50 | 0.13ms |
| p95 | 0.14ms |
| p99 | 0.14ms |
| mean | 0.13ms |
| stdev | 0.0051ms |
| min | 0.12ms |
| max | 0.15ms |
| total | 3.84ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.12ms | 0.11ms | +0.01ms | +10.41% |
| p50 | 0.13ms | 0.12ms | +0.01ms | +8.97% |
| p95 | 0.14ms | 0.15ms | -0.02ms | -11.00% |
| p99 | 0.14ms | 0.16ms | -0.02ms | -9.54% |
| mean | 0.13ms | 0.12ms | +0.0058ms | +4.77% |
| min | 0.12ms | 0.11ms | +0.01ms | +13.46% |
| max | 0.15ms | 0.16ms | -0.01ms | -8.71% |
| total | 3.84ms | 3.67ms | +0.18ms | +4.77% |

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
| stdev | 0.0057ms |
| min | 0.04ms |
| max | 0.06ms |
| total | 1.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.03ms | +0.0045ms | +13.56% |
| p50 | 0.04ms | 0.03ms | +0.0064ms | +19.08% |
| p95 | 0.05ms | 0.04ms | +0.01ms | +37.19% |
| p99 | 0.06ms | 0.04ms | +0.02ms | +50.97% |
| mean | 0.04ms | 0.03ms | +0.0074ms | +21.54% |
| min | 0.04ms | 0.03ms | +0.0038ms | +11.46% |
| max | 0.06ms | 0.04ms | +0.02ms | +55.02% |
| total | 1.26ms | 1.04ms | +0.22ms | +21.54% |

