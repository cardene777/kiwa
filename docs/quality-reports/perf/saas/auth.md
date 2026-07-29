# Perf Suite — auth

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| nextAuthProviderLookup | 0.00013ms | 0.0010ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +200%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| luciaSessionIdGenerate | 0.00013ms | 0.00017ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| betterAuthProviderLookup | 0.00013ms | 0.00021ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| clerkUsersCreateAccessor | 0.00013ms | 0.00017ms | 5ms | 0.00033ms | PASS | stable (差 0.00017ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| auth0RulesActionsAccessor | 0.00013ms | 0.00017ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| supabaseAuthEnvAccessor | 0.00013ms | 0.00017ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| webAuthnAuthenticatorList | 0.00013ms | 0.00017ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| passkeyListAuthenticators | 0.00017ms | 0.00025ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +199%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| oauth21CreatePkceChallenge | 0.0037ms | 0.01ms | 10ms | 0.00033ms | PASS | stable (p10 +2% (閾値未満)、 p95 +32% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| oidcDiscoveryFetch | 0.00025ms | 0.00029ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +133%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| nextAuthProviderLookup | 0.01ms | 10ms | PASS |
| luciaSessionIdGenerate | 0.01ms | 10ms | PASS |
| betterAuthProviderLookup | 0.01ms | 10ms | PASS |
| clerkUsersCreateAccessor | 0.00ms | 10ms | PASS |
| auth0RulesActionsAccessor | 0.00ms | 10ms | PASS |
| supabaseAuthEnvAccessor | 0.00ms | 10ms | PASS |
| webAuthnAuthenticatorList | 0.00ms | 10ms | PASS |
| passkeyListAuthenticators | 0.00ms | 10ms | PASS |
| oauth21CreatePkceChallenge | 0.08ms | 20ms | PASS |
| oidcDiscoveryFetch | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| nextAuthProviderLookup | 712 B | 0 B | 102400 B | yes | PASS |
| luciaSessionIdGenerate | -15696 B | 0 B | 102400 B | yes | PASS |
| betterAuthProviderLookup | 206488 B | 0 B | 102400 B | yes | PASS |
| clerkUsersCreateAccessor | -136 B | 0 B | 102400 B | yes | PASS |
| auth0RulesActionsAccessor | 848 B | 0 B | 102400 B | yes | PASS |
| supabaseAuthEnvAccessor | 1328 B | 0 B | 102400 B | yes | PASS |
| webAuthnAuthenticatorList | 112 B | 0 B | 102400 B | yes | PASS |
| passkeyListAuthenticators | 1112 B | 0 B | 102400 B | yes | PASS |
| oauth21CreatePkceChallenge | -21424 B | 0 B | 102400 B | yes | PASS |
| oidcDiscoveryFetch | 360 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### nextAuthProviderLookup

# Perf Report — nextAuthProviderLookup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00021ms |
| p95 | 0.0010ms |
| p99 | 0.0021ms |
| mean | 0.00028ms |
| stdev | 0.00046ms |
| min | 0.00013ms |
| max | 0.0050ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00017ms | -0.000041ms | -24.70% |
| p50 | 0.00021ms | 0.00017ms | +0.000041ms | +24.55% |
| p95 | 0.0010ms | 0.00059ms | +0.00041ms | +70.91% |
| p99 | 0.0021ms | 0.0014ms | +0.00075ms | +54.01% |
| mean | 0.00028ms | 0.00026ms | +0.000021ms | +7.95% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0050ms | 0.0060ms | -0.0010ms | -16.67% |
| total | 0.06ms | 0.05ms | +0.0042ms | +7.95% |

### luciaSessionIdGenerate

# Perf Report — luciaSessionIdGenerate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00017ms |
| p99 | 0.00050ms |
| mean | 0.00015ms |
| stdev | 0.000065ms |
| min | 0.00013ms |
| max | 0.00067ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p95 | 0.00017ms | 0.00021ms | -0.000042ms | -20.10% |
| p99 | 0.00050ms | 0.00067ms | -0.00017ms | -24.94% |
| mean | 0.00015ms | 0.00015ms | -0.0000084ms | -5.42% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.00067ms | 0.00075ms | -0.000083ms | -11.07% |
| total | 0.03ms | 0.03ms | -0.0017ms | -5.42% |

### betterAuthProviderLookup

# Perf Report — betterAuthProviderLookup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00021ms |
| p99 | 0.0013ms |
| mean | 0.00022ms |
| stdev | 0.00093ms |
| min | 0.00013ms |
| max | 0.01ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p95 | 0.00021ms | 0.00017ms | +0.000041ms | +24.55% |
| p99 | 0.0013ms | 0.00071ms | +0.00054ms | +75.51% |
| mean | 0.00022ms | 0.00021ms | +0.000018ms | +8.67% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.0024ms | +22.57% |
| total | 0.04ms | 0.04ms | +0.0036ms | +8.67% |

### clerkUsersCreateAccessor

# Perf Report — clerkUsersCreateAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00017ms |
| p99 | 0.00046ms |
| mean | 0.00015ms |
| stdev | 0.000099ms |
| min | 0.00013ms |
| max | 0.0013ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00029ms | -0.00017ms | -57.04% |
| p50 | 0.00013ms | 0.00033ms | -0.00021ms | -62.46% |
| p95 | 0.00017ms | 0.00038ms | -0.00021ms | -55.47% |
| p99 | 0.00046ms | 0.0022ms | -0.0017ms | -78.66% |
| mean | 0.00015ms | 0.00040ms | -0.00026ms | -63.26% |
| min | 0.00013ms | 0.00029ms | -0.00017ms | -57.04% |
| max | 0.0013ms | 0.01ms | -0.01ms | -89.13% |
| total | 0.03ms | 0.08ms | -0.05ms | -63.26% |

### auth0RulesActionsAccessor

# Perf Report — auth0RulesActionsAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00017ms |
| p99 | 0.00067ms |
| mean | 0.00016ms |
| stdev | 0.00013ms |
| min | 0.00013ms |
| max | 0.0015ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p95 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p99 | 0.00067ms | 0.00075ms | -0.000081ms | -10.79% |
| mean | 0.00016ms | 0.00016ms | +0.0000023ms | +1.48% |
| min | 0.00013ms | 0.000083ms | +0.000042ms | +50.60% |
| max | 0.0015ms | 0.0014ms | +0.00013ms | +9.09% |
| total | 0.03ms | 0.03ms | +0.00047ms | +1.48% |

### supabaseAuthEnvAccessor

# Perf Report — supabaseAuthEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00017ms |
| p99 | 0.00055ms |
| mean | 0.00016ms |
| stdev | 0.00012ms |
| min | 0.00013ms |
| max | 0.0014ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p95 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p99 | 0.00055ms | 0.00054ms | +0.0000062ms | +1.15% |
| mean | 0.00016ms | 0.00015ms | +0.0000085ms | +5.79% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0014ms | 0.00075ms | +0.00067ms | +88.93% |
| total | 0.03ms | 0.03ms | +0.0017ms | +5.79% |

### webAuthnAuthenticatorList

# Perf Report — webAuthnAuthenticatorList.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00017ms |
| p99 | 0.00088ms |
| mean | 0.00016ms |
| stdev | 0.00016ms |
| min | 0.00013ms |
| max | 0.0018ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p95 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p99 | 0.00088ms | 0.00055ms | +0.00033ms | +61.03% |
| mean | 0.00016ms | 0.00015ms | +0.0000075ms | +4.88% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0018ms | 0.0014ms | +0.00046ms | +33.31% |
| total | 0.03ms | 0.03ms | +0.0015ms | +4.88% |

### passkeyListAuthenticators

# Perf Report — passkeyListAuthenticators.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00025ms |
| p99 | 0.0020ms |
| mean | 0.00026ms |
| stdev | 0.00057ms |
| min | 0.00017ms |
| max | 0.0078ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p95 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p99 | 0.0020ms | 0.0015ms | +0.00050ms | +33.94% |
| mean | 0.00026ms | 0.00024ms | +0.000024ms | +9.91% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.0078ms | 0.0037ms | +0.0041ms | +108.91% |
| total | 0.05ms | 0.05ms | +0.0048ms | +9.91% |

### oauth21CreatePkceChallenge

# Perf Report — oauth21CreatePkceChallenge.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0037ms |
| p50 | 0.0044ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0055ms |
| stdev | 0.0033ms |
| min | 0.0035ms |
| max | 0.03ms |
| total | 1.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0037ms | 0.0036ms | +0.000083ms | +2.29% |
| p50 | 0.0044ms | 0.0040ms | +0.00044ms | +10.98% |
| p95 | 0.01ms | 0.0089ms | +0.0029ms | +32.12% |
| p99 | 0.02ms | 0.02ms | +0.0039ms | +25.32% |
| mean | 0.0055ms | 0.0049ms | +0.00063ms | +12.82% |
| min | 0.0035ms | 0.0034ms | +0.000042ms | +1.23% |
| max | 0.03ms | 0.03ms | +0.0016ms | +6.40% |
| total | 1.11ms | 0.98ms | +0.13ms | +12.82% |

### oidcDiscoveryFetch

# Perf Report — oidcDiscoveryFetch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00025ms |
| p95 | 0.00029ms |
| p99 | 0.0012ms |
| mean | 0.00029ms |
| stdev | 0.00025ms |
| min | 0.00021ms |
| max | 0.0034ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p50 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p95 | 0.00029ms | 0.00034ms | -0.000044ms | -13.11% |
| p99 | 0.0012ms | 0.00089ms | +0.00028ms | +31.22% |
| mean | 0.00029ms | 0.00030ms | -0.000010ms | -3.38% |
| min | 0.00021ms | 0.00025ms | -0.000042ms | -16.80% |
| max | 0.0034ms | 0.0028ms | +0.00058ms | +20.61% |
| total | 0.06ms | 0.06ms | -0.0020ms | -3.38% |

