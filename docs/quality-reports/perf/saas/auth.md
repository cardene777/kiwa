# Perf Suite — auth

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| nextAuthProviderLookup | 0.00017ms | 0.00038ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +200%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| luciaSessionIdGenerate | 0.00013ms | 0.00017ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| betterAuthProviderLookup | 0.00013ms | 0.00021ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| clerkUsersCreateAccessor | 0.00013ms | 0.00017ms | 5ms | 0.00033ms | PASS | stable (差 0.00017ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| auth0RulesActionsAccessor | 0.00013ms | 0.00021ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| supabaseAuthEnvAccessor | 0.00013ms | 0.00017ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| webAuthnAuthenticatorList | 0.00013ms | 0.00017ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| passkeyListAuthenticators | 0.00017ms | 0.00029ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +199%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| oauth21CreatePkceChallenge | 0.0037ms | 0.01ms | 10ms | 0.00033ms | PASS | stable (p10 +2% (閾値未満)、 p95 +29% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| oidcDiscoveryFetch | 0.00025ms | 0.00029ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +133%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| nextAuthProviderLookup | 0.01ms | 10ms | PASS |
| luciaSessionIdGenerate | 0.01ms | 10ms | PASS |
| betterAuthProviderLookup | 0.00ms | 10ms | PASS |
| clerkUsersCreateAccessor | 0.00ms | 10ms | PASS |
| auth0RulesActionsAccessor | 0.00ms | 10ms | PASS |
| supabaseAuthEnvAccessor | 0.00ms | 10ms | PASS |
| webAuthnAuthenticatorList | 0.00ms | 10ms | PASS |
| passkeyListAuthenticators | 0.00ms | 10ms | PASS |
| oauth21CreatePkceChallenge | 0.07ms | 20ms | PASS |
| oidcDiscoveryFetch | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| nextAuthProviderLookup | -1552 B | 0 B | 102400 B | yes | PASS |
| luciaSessionIdGenerate | -16464 B | 0 B | 102400 B | yes | PASS |
| betterAuthProviderLookup | 648 B | 0 B | 102400 B | yes | PASS |
| clerkUsersCreateAccessor | 2744 B | 0 B | 102400 B | yes | PASS |
| auth0RulesActionsAccessor | 848 B | 0 B | 102400 B | yes | PASS |
| supabaseAuthEnvAccessor | -928 B | 0 B | 102400 B | yes | PASS |
| webAuthnAuthenticatorList | 112 B | 0 B | 102400 B | yes | PASS |
| passkeyListAuthenticators | 1112 B | 0 B | 102400 B | yes | PASS |
| oauth21CreatePkceChallenge | -20928 B | 0 B | 102400 B | yes | PASS |
| oidcDiscoveryFetch | 16 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### nextAuthProviderLookup

# Perf Report — nextAuthProviderLookup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00038ms |
| p99 | 0.0013ms |
| mean | 0.00026ms |
| stdev | 0.00051ms |
| min | 0.00017ms |
| max | 0.0065ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p50 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p95 | 0.00038ms | 0.00059ms | -0.00020ms | -34.84% |
| p99 | 0.0013ms | 0.0014ms | -0.000033ms | -2.37% |
| mean | 0.00026ms | 0.00026ms | +4.0e-7ms | +0.15% |
| min | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| max | 0.0065ms | 0.0060ms | +0.00050ms | +8.33% |
| total | 0.05ms | 0.05ms | +0.000080ms | +0.15% |

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
| stdev | 0.000068ms |
| min | 0.00013ms |
| max | 0.00083ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p95 | 0.00017ms | 0.00021ms | -0.000040ms | -19.11% |
| p99 | 0.00050ms | 0.00067ms | -0.00017ms | -25.01% |
| mean | 0.00015ms | 0.00015ms | -0.0000017ms | -1.11% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.00083ms | 0.00075ms | +0.000083ms | +11.07% |
| total | 0.03ms | 0.03ms | -0.00034ms | -1.11% |

### betterAuthProviderLookup

# Perf Report — betterAuthProviderLookup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00021ms |
| p99 | 0.0015ms |
| mean | 0.00026ms |
| stdev | 0.0013ms |
| min | 0.00013ms |
| max | 0.02ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p95 | 0.00021ms | 0.00017ms | +0.000043ms | +25.81% |
| p99 | 0.0015ms | 0.00071ms | +0.00083ms | +116.81% |
| mean | 0.00026ms | 0.00021ms | +0.000058ms | +28.05% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.0077ms | +71.99% |
| total | 0.05ms | 0.04ms | +0.01ms | +28.05% |

### clerkUsersCreateAccessor

# Perf Report — clerkUsersCreateAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00017ms |
| p99 | 0.00076ms |
| mean | 0.00016ms |
| stdev | 0.00016ms |
| min | 0.00013ms |
| max | 0.0018ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00029ms | -0.00017ms | -57.04% |
| p50 | 0.00013ms | 0.00033ms | -0.00021ms | -62.46% |
| p95 | 0.00017ms | 0.00038ms | -0.00021ms | -55.47% |
| p99 | 0.00076ms | 0.0022ms | -0.0014ms | -65.12% |
| mean | 0.00016ms | 0.00040ms | -0.00024ms | -60.37% |
| min | 0.00013ms | 0.00029ms | -0.00017ms | -57.04% |
| max | 0.0018ms | 0.01ms | -0.0097ms | -84.05% |
| total | 0.03ms | 0.08ms | -0.05ms | -60.37% |

### auth0RulesActionsAccessor

# Perf Report — auth0RulesActionsAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00021ms |
| p99 | 0.00063ms |
| mean | 0.00016ms |
| stdev | 0.00013ms |
| min | 0.00013ms |
| max | 0.0017ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p95 | 0.00021ms | 0.00017ms | +0.000041ms | +24.55% |
| p99 | 0.00063ms | 0.00075ms | -0.00013ms | -16.75% |
| mean | 0.00016ms | 0.00016ms | +0.0000042ms | +2.66% |
| min | 0.00013ms | 0.000083ms | +0.000042ms | +50.60% |
| max | 0.0017ms | 0.0014ms | +0.00029ms | +21.24% |
| total | 0.03ms | 0.03ms | +0.00084ms | +2.66% |

### supabaseAuthEnvAccessor

# Perf Report — supabaseAuthEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00017ms |
| p99 | 0.00063ms |
| mean | 0.00016ms |
| stdev | 0.00017ms |
| min | 0.00013ms |
| max | 0.0021ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p95 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p99 | 0.00063ms | 0.00054ms | +0.000090ms | +16.62% |
| mean | 0.00016ms | 0.00015ms | +0.0000096ms | +6.48% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0021ms | 0.00075ms | +0.0014ms | +183.33% |
| total | 0.03ms | 0.03ms | +0.0019ms | +6.48% |

### webAuthnAuthenticatorList

# Perf Report — webAuthnAuthenticatorList.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00017ms |
| p99 | 0.0011ms |
| mean | 0.00017ms |
| stdev | 0.00023ms |
| min | 0.00013ms |
| max | 0.0023ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p95 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p99 | 0.0011ms | 0.00055ms | +0.00051ms | +92.69% |
| mean | 0.00017ms | 0.00015ms | +0.000019ms | +12.27% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0023ms | 0.0014ms | +0.00096ms | +69.75% |
| total | 0.03ms | 0.03ms | +0.0038ms | +12.27% |

### passkeyListAuthenticators

# Perf Report — passkeyListAuthenticators.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00029ms |
| p99 | 0.0018ms |
| mean | 0.00027ms |
| stdev | 0.00064ms |
| min | 0.00017ms |
| max | 0.0089ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p95 | 0.00029ms | 0.00025ms | +0.000042ms | +16.80% |
| p99 | 0.0018ms | 0.0015ms | +0.00037ms | +25.49% |
| mean | 0.00027ms | 0.00024ms | +0.000033ms | +13.64% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.0089ms | 0.0037ms | +0.0052ms | +137.79% |
| total | 0.05ms | 0.05ms | +0.0066ms | +13.64% |

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
| stdev | 0.0039ms |
| min | 0.0035ms |
| max | 0.04ms |
| total | 1.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0037ms | 0.0036ms | +0.000084ms | +2.32% |
| p50 | 0.0044ms | 0.0040ms | +0.00040ms | +9.94% |
| p95 | 0.01ms | 0.0089ms | +0.0026ms | +29.03% |
| p99 | 0.02ms | 0.02ms | +0.0050ms | +33.02% |
| mean | 0.0055ms | 0.0049ms | +0.00062ms | +12.55% |
| min | 0.0035ms | 0.0034ms | +0.000043ms | +1.26% |
| max | 0.04ms | 0.03ms | +0.02ms | +66.01% |
| total | 1.11ms | 0.98ms | +0.12ms | +12.55% |

### oidcDiscoveryFetch

# Perf Report — oidcDiscoveryFetch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00025ms |
| p95 | 0.00029ms |
| p99 | 0.0016ms |
| mean | 0.00032ms |
| stdev | 0.00042ms |
| min | 0.00021ms |
| max | 0.0050ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p50 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p95 | 0.00029ms | 0.00034ms | -0.000044ms | -13.11% |
| p99 | 0.0016ms | 0.00089ms | +0.00071ms | +79.74% |
| mean | 0.00032ms | 0.00030ms | +0.000015ms | +5.02% |
| min | 0.00021ms | 0.00025ms | -0.000042ms | -16.80% |
| max | 0.0050ms | 0.0028ms | +0.0021ms | +75.04% |
| total | 0.06ms | 0.06ms | +0.0030ms | +5.02% |

