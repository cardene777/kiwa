# Perf Suite — auth

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| nextAuthProviderLookup | 0.00017ms | 0.00076ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +200%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| luciaSessionIdGenerate | 0.00013ms | 0.00017ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| betterAuthProviderLookup | 0.00013ms | 0.00021ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| clerkUsersCreateAccessor | 0.00013ms | 0.00021ms | 5ms | 0.00033ms | PASS | stable (差 0.00017ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| auth0RulesActionsAccessor | 0.00017ms | 0.00025ms | 5ms | 0.00033ms | PASS | stable (差 0.000041ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| supabaseAuthEnvAccessor | 0.00013ms | 0.00017ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| webAuthnAuthenticatorList | 0.00013ms | 0.00021ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| passkeyListAuthenticators | 0.00021ms | 0.00033ms | 5ms | 0.00033ms | PASS | stable (差 0.000041ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| oauth21CreatePkceChallenge | 0.0037ms | 0.0084ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| oidcDiscoveryFetch | 0.00025ms | 0.00033ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +133%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| nextAuthProviderLookup | 0.00ms | 10ms | PASS |
| luciaSessionIdGenerate | 0.01ms | 10ms | PASS |
| betterAuthProviderLookup | 0.00ms | 10ms | PASS |
| clerkUsersCreateAccessor | 0.00ms | 10ms | PASS |
| auth0RulesActionsAccessor | 0.00ms | 10ms | PASS |
| supabaseAuthEnvAccessor | 0.00ms | 10ms | PASS |
| webAuthnAuthenticatorList | 0.00ms | 10ms | PASS |
| passkeyListAuthenticators | 0.00ms | 10ms | PASS |
| oauth21CreatePkceChallenge | 0.06ms | 20ms | PASS |
| oidcDiscoveryFetch | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| nextAuthProviderLookup | -5112 B | 0 B | 102400 B | yes | PASS |
| luciaSessionIdGenerate | -15136 B | 0 B | 102400 B | yes | PASS |
| betterAuthProviderLookup | 712 B | 0 B | 102400 B | yes | PASS |
| clerkUsersCreateAccessor | 2744 B | 0 B | 102400 B | yes | PASS |
| auth0RulesActionsAccessor | 944 B | 0 B | 102400 B | yes | PASS |
| supabaseAuthEnvAccessor | 3240 B | 0 B | 102400 B | yes | PASS |
| webAuthnAuthenticatorList | -1016 B | 0 B | 102400 B | yes | PASS |
| passkeyListAuthenticators | 1112 B | 0 B | 102400 B | yes | PASS |
| oauth21CreatePkceChallenge | -21424 B | 0 B | 102400 B | yes | PASS |
| oidcDiscoveryFetch | -592 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### nextAuthProviderLookup

# Perf Report — nextAuthProviderLookup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00076ms |
| p99 | 0.0018ms |
| mean | 0.00028ms |
| stdev | 0.00055ms |
| min | 0.00013ms |
| max | 0.0070ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p50 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p95 | 0.00076ms | 0.00059ms | +0.00018ms | +30.32% |
| p99 | 0.0018ms | 0.0014ms | +0.00045ms | +32.79% |
| mean | 0.00028ms | 0.00026ms | +0.000018ms | +6.68% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0070ms | 0.0060ms | +0.0010ms | +17.37% |
| total | 0.06ms | 0.05ms | +0.0035ms | +6.68% |

### luciaSessionIdGenerate

# Perf Report — luciaSessionIdGenerate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00017ms |
| p99 | 0.00067ms |
| mean | 0.00015ms |
| stdev | 0.000086ms |
| min | 0.00013ms |
| max | 0.00083ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p95 | 0.00017ms | 0.00021ms | -0.000042ms | -20.10% |
| p99 | 0.00067ms | 0.00067ms | +8.3e-7ms | +0.12% |
| mean | 0.00015ms | 0.00015ms | -0.0000023ms | -1.49% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.00083ms | 0.00075ms | +0.000084ms | +11.20% |
| total | 0.03ms | 0.03ms | -0.00046ms | -1.49% |

### betterAuthProviderLookup

# Perf Report — betterAuthProviderLookup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00021ms |
| p99 | 0.0011ms |
| mean | 0.00047ms |
| stdev | 0.0041ms |
| min | 0.00013ms |
| max | 0.06ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00017ms | 0.00013ms | +0.000042ms | +33.60% |
| p95 | 0.00021ms | 0.00017ms | +0.000041ms | +24.55% |
| p99 | 0.0011ms | 0.00071ms | +0.00042ms | +58.62% |
| mean | 0.00047ms | 0.00021ms | +0.00027ms | +129.06% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.06ms | 0.01ms | +0.05ms | +442.03% |
| total | 0.09ms | 0.04ms | +0.05ms | +129.06% |

### clerkUsersCreateAccessor

# Perf Report — clerkUsersCreateAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00021ms |
| p99 | 0.00063ms |
| mean | 0.00016ms |
| stdev | 0.00010ms |
| min | 0.00013ms |
| max | 0.0012ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00029ms | -0.00017ms | -57.04% |
| p50 | 0.00017ms | 0.00033ms | -0.00017ms | -50.15% |
| p95 | 0.00021ms | 0.00038ms | -0.00017ms | -44.27% |
| p99 | 0.00063ms | 0.0022ms | -0.0015ms | -71.04% |
| mean | 0.00016ms | 0.00040ms | -0.00024ms | -59.96% |
| min | 0.00013ms | 0.00029ms | -0.00017ms | -57.04% |
| max | 0.0012ms | 0.01ms | -0.01ms | -89.85% |
| total | 0.03ms | 0.08ms | -0.05ms | -59.96% |

### auth0RulesActionsAccessor

# Perf Report — auth0RulesActionsAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00025ms |
| p99 | 0.00059ms |
| mean | 0.00020ms |
| stdev | 0.00017ms |
| min | 0.00013ms |
| max | 0.0022ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| p50 | 0.00017ms | 0.00013ms | +0.000042ms | +33.60% |
| p95 | 0.00025ms | 0.00017ms | +0.000083ms | +49.70% |
| p99 | 0.00059ms | 0.00075ms | -0.00016ms | -21.77% |
| mean | 0.00020ms | 0.00016ms | +0.000040ms | +25.56% |
| min | 0.00013ms | 0.000083ms | +0.000042ms | +50.60% |
| max | 0.0022ms | 0.0014ms | +0.00087ms | +63.64% |
| total | 0.04ms | 0.03ms | +0.0080ms | +25.56% |

### supabaseAuthEnvAccessor

# Perf Report — supabaseAuthEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00017ms |
| p99 | 0.00089ms |
| mean | 0.00018ms |
| stdev | 0.00031ms |
| min | 0.00013ms |
| max | 0.0038ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p95 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p99 | 0.00089ms | 0.00054ms | +0.00035ms | +64.13% |
| mean | 0.00018ms | 0.00015ms | +0.000029ms | +19.37% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0038ms | 0.00075ms | +0.0031ms | +411.07% |
| total | 0.04ms | 0.03ms | +0.0057ms | +19.37% |

### webAuthnAuthenticatorList

# Perf Report — webAuthnAuthenticatorList.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00021ms |
| p99 | 0.0020ms |
| mean | 0.00019ms |
| stdev | 0.00030ms |
| min | 0.000083ms |
| max | 0.0032ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p95 | 0.00021ms | 0.00017ms | +0.000041ms | +24.55% |
| p99 | 0.0020ms | 0.00055ms | +0.0014ms | +258.65% |
| mean | 0.00019ms | 0.00015ms | +0.000034ms | +21.81% |
| min | 0.000083ms | 0.00013ms | -0.000042ms | -33.60% |
| max | 0.0032ms | 0.0014ms | +0.0018ms | +130.33% |
| total | 0.04ms | 0.03ms | +0.0067ms | +21.81% |

### passkeyListAuthenticators

# Perf Report — passkeyListAuthenticators.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00025ms |
| p95 | 0.00033ms |
| p99 | 0.0020ms |
| mean | 0.00029ms |
| stdev | 0.00033ms |
| min | 0.00021ms |
| max | 0.0035ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00017ms | +0.000041ms | +24.55% |
| p50 | 0.00025ms | 0.00021ms | +0.000042ms | +20.19% |
| p95 | 0.00033ms | 0.00025ms | +0.000083ms | +33.20% |
| p99 | 0.0020ms | 0.0015ms | +0.00058ms | +39.88% |
| mean | 0.00029ms | 0.00024ms | +0.000046ms | +19.25% |
| min | 0.00021ms | 0.00017ms | +0.000042ms | +25.30% |
| max | 0.0035ms | 0.0037ms | -0.00021ms | -5.55% |
| total | 0.06ms | 0.05ms | +0.0093ms | +19.25% |

### oauth21CreatePkceChallenge

# Perf Report — oauth21CreatePkceChallenge.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0037ms |
| p50 | 0.0043ms |
| p95 | 0.0084ms |
| p99 | 0.02ms |
| mean | 0.0051ms |
| stdev | 0.0025ms |
| min | 0.0035ms |
| max | 0.02ms |
| total | 1.02ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0037ms | 0.0036ms | +0.00012ms | +3.45% |
| p50 | 0.0043ms | 0.0040ms | +0.00027ms | +6.80% |
| p95 | 0.0084ms | 0.0089ms | -0.00050ms | -5.65% |
| p99 | 0.02ms | 0.02ms | +0.00099ms | +6.51% |
| mean | 0.0051ms | 0.0049ms | +0.00018ms | +3.73% |
| min | 0.0035ms | 0.0034ms | +0.000042ms | +1.23% |
| max | 0.02ms | 0.03ms | -0.00079ms | -3.12% |
| total | 1.02ms | 0.98ms | +0.04ms | +3.73% |

### oidcDiscoveryFetch

# Perf Report — oidcDiscoveryFetch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00025ms |
| p95 | 0.00033ms |
| p99 | 0.0013ms |
| mean | 0.00030ms |
| stdev | 0.00023ms |
| min | 0.00025ms |
| max | 0.0030ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p50 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p95 | 0.00033ms | 0.00034ms | -0.0000030ms | -0.91% |
| p99 | 0.0013ms | 0.00089ms | +0.00044ms | +49.89% |
| mean | 0.00030ms | 0.00030ms | -0.0000063ms | -2.07% |
| min | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| max | 0.0030ms | 0.0028ms | +0.00021ms | +7.38% |
| total | 0.06ms | 0.06ms | -0.0013ms | -2.07% |

