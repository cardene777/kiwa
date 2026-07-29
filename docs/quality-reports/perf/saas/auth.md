# Perf Suite — auth

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| nextAuthProviderLookup | 0.00017ms | 0.00055ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +200%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| luciaSessionIdGenerate | 0.00013ms | 0.00021ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| betterAuthProviderLookup | 0.00013ms | 0.00017ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| clerkUsersCreateAccessor | 0.00013ms | 0.00021ms | 5ms | 0.00033ms | PASS | stable (差 0.00017ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| auth0RulesActionsAccessor | 0.00013ms | 0.00017ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| supabaseAuthEnvAccessor | 0.00013ms | 0.00017ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| webAuthnAuthenticatorList | 0.00013ms | 0.00017ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| passkeyListAuthenticators | 0.00021ms | 0.00025ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +199%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| oauth21CreatePkceChallenge | 0.0036ms | 0.01ms | 10ms | 0.00033ms | PASS | stable (p10 -1% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| oidcDiscoveryFetch | 0.00025ms | 0.00033ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +133%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| nextAuthProviderLookup | 0.01ms | 10ms | PASS |
| luciaSessionIdGenerate | 0.00ms | 10ms | PASS |
| betterAuthProviderLookup | 0.00ms | 10ms | PASS |
| clerkUsersCreateAccessor | 0.00ms | 10ms | PASS |
| auth0RulesActionsAccessor | 0.00ms | 10ms | PASS |
| supabaseAuthEnvAccessor | 0.00ms | 10ms | PASS |
| webAuthnAuthenticatorList | 0.00ms | 10ms | PASS |
| passkeyListAuthenticators | 0.01ms | 10ms | PASS |
| oauth21CreatePkceChallenge | 0.06ms | 20ms | PASS |
| oidcDiscoveryFetch | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| nextAuthProviderLookup | 304864 B | 0 B | 102400 B | yes | PASS |
| luciaSessionIdGenerate | -16560 B | 0 B | 102400 B | yes | PASS |
| betterAuthProviderLookup | 616 B | 0 B | 102400 B | yes | PASS |
| clerkUsersCreateAccessor | -528 B | 0 B | 102400 B | yes | PASS |
| auth0RulesActionsAccessor | -296 B | 0 B | 102400 B | yes | PASS |
| supabaseAuthEnvAccessor | 3728 B | 0 B | 102400 B | yes | PASS |
| webAuthnAuthenticatorList | -2144 B | 0 B | 102400 B | yes | PASS |
| passkeyListAuthenticators | 2320 B | 0 B | 102400 B | yes | PASS |
| oauth21CreatePkceChallenge | -20960 B | -29312 B | 102400 B | yes | PASS |
| oidcDiscoveryFetch | 16 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### nextAuthProviderLookup

# Perf Report — nextAuthProviderLookup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00019ms |
| p95 | 0.00055ms |
| p99 | 0.0018ms |
| mean | 0.00028ms |
| stdev | 0.00056ms |
| min | 0.00013ms |
| max | 0.0073ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p50 | 0.00019ms | 0.00017ms | +0.000021ms | +12.28% |
| p95 | 0.00055ms | 0.00059ms | -0.000033ms | -5.59% |
| p99 | 0.0018ms | 0.0014ms | +0.00042ms | +30.14% |
| mean | 0.00028ms | 0.00026ms | +0.000016ms | +6.14% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0073ms | 0.0060ms | +0.0013ms | +21.53% |
| total | 0.06ms | 0.05ms | +0.0032ms | +6.14% |

### luciaSessionIdGenerate

# Perf Report — luciaSessionIdGenerate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00021ms |
| p99 | 0.00075ms |
| mean | 0.00017ms |
| stdev | 0.00010ms |
| min | 0.00013ms |
| max | 0.0011ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| p95 | 0.00021ms | 0.00021ms | -0.0000010ms | -0.48% |
| p99 | 0.00075ms | 0.00067ms | +0.000083ms | +12.37% |
| mean | 0.00017ms | 0.00015ms | +0.000017ms | +10.80% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0011ms | 0.00075ms | +0.00037ms | +50.00% |
| total | 0.03ms | 0.03ms | +0.0033ms | +10.80% |

### betterAuthProviderLookup

# Perf Report — betterAuthProviderLookup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00017ms |
| p99 | 0.0011ms |
| mean | 0.00027ms |
| stdev | 0.0012ms |
| min | 0.00013ms |
| max | 0.02ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00017ms | 0.00013ms | +0.000041ms | +33.20% |
| p95 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p99 | 0.0011ms | 0.00071ms | +0.00038ms | +53.61% |
| mean | 0.00027ms | 0.00021ms | +0.000059ms | +28.55% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.0067ms | +62.26% |
| total | 0.05ms | 0.04ms | +0.01ms | +28.55% |

### clerkUsersCreateAccessor

# Perf Report — clerkUsersCreateAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00021ms |
| p99 | 0.0011ms |
| mean | 0.00019ms |
| stdev | 0.00030ms |
| min | 0.00013ms |
| max | 0.0037ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00029ms | -0.00017ms | -57.04% |
| p50 | 0.00017ms | 0.00033ms | -0.00017ms | -50.15% |
| p95 | 0.00021ms | 0.00038ms | -0.00017ms | -44.53% |
| p99 | 0.0011ms | 0.0022ms | -0.0011ms | -51.46% |
| mean | 0.00019ms | 0.00040ms | -0.00022ms | -53.27% |
| min | 0.00013ms | 0.00029ms | -0.00017ms | -57.04% |
| max | 0.0037ms | 0.01ms | -0.0078ms | -68.11% |
| total | 0.04ms | 0.08ms | -0.04ms | -53.27% |

### auth0RulesActionsAccessor

# Perf Report — auth0RulesActionsAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00017ms |
| p99 | 0.00071ms |
| mean | 0.00017ms |
| stdev | 0.00012ms |
| min | 0.00013ms |
| max | 0.0015ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| p95 | 0.00017ms | 0.00017ms | +0.0000020ms | +1.23% |
| p99 | 0.00071ms | 0.00075ms | -0.000043ms | -5.66% |
| mean | 0.00017ms | 0.00016ms | +0.000010ms | +6.52% |
| min | 0.00013ms | 0.000083ms | +0.000042ms | +50.60% |
| max | 0.0015ms | 0.0014ms | +0.000084ms | +6.11% |
| total | 0.03ms | 0.03ms | +0.0021ms | +6.52% |

### supabaseAuthEnvAccessor

# Perf Report — supabaseAuthEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00017ms |
| p99 | 0.00067ms |
| mean | 0.00016ms |
| stdev | 0.00016ms |
| min | 0.000084ms |
| max | 0.0022ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p95 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p99 | 0.00067ms | 0.00054ms | +0.00013ms | +23.34% |
| mean | 0.00016ms | 0.00015ms | +0.000012ms | +8.20% |
| min | 0.000084ms | 0.00013ms | -0.000041ms | -32.80% |
| max | 0.0022ms | 0.00075ms | +0.0015ms | +200.00% |
| total | 0.03ms | 0.03ms | +0.0024ms | +8.20% |

### webAuthnAuthenticatorList

# Perf Report — webAuthnAuthenticatorList.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00017ms |
| p99 | 0.00039ms |
| mean | 0.00017ms |
| stdev | 0.00020ms |
| min | 0.00013ms |
| max | 0.0022ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| p95 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p99 | 0.00039ms | 0.00055ms | -0.00016ms | -28.51% |
| mean | 0.00017ms | 0.00015ms | +0.000015ms | +9.84% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0022ms | 0.0014ms | +0.00083ms | +60.58% |
| total | 0.03ms | 0.03ms | +0.0030ms | +9.84% |

### passkeyListAuthenticators

# Perf Report — passkeyListAuthenticators.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00021ms |
| p95 | 0.00025ms |
| p99 | 0.0019ms |
| mean | 0.00029ms |
| stdev | 0.00070ms |
| min | 0.00017ms |
| max | 0.0097ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00017ms | +0.000041ms | +24.55% |
| p50 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p95 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p99 | 0.0019ms | 0.0015ms | +0.00045ms | +31.03% |
| mean | 0.00029ms | 0.00024ms | +0.000045ms | +18.56% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.0097ms | 0.0037ms | +0.0060ms | +160.00% |
| total | 0.06ms | 0.05ms | +0.0089ms | +18.56% |

### oauth21CreatePkceChallenge

# Perf Report — oauth21CreatePkceChallenge.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0036ms |
| p50 | 0.0040ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0051ms |
| stdev | 0.0027ms |
| min | 0.0034ms |
| max | 0.03ms |
| total | 1.02ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0036ms | 0.0036ms | -0.000041ms | -1.13% |
| p50 | 0.0040ms | 0.0040ms | +0.000062ms | +1.57% |
| p95 | 0.01ms | 0.0089ms | +0.0019ms | +21.28% |
| p99 | 0.01ms | 0.02ms | -0.0015ms | -9.74% |
| mean | 0.0051ms | 0.0049ms | +0.00018ms | +3.58% |
| min | 0.0034ms | 0.0034ms | +0.0000010ms | +0.03% |
| max | 0.03ms | 0.03ms | 0.00ms | 0.00% |
| total | 1.02ms | 0.98ms | +0.04ms | +3.58% |

### oidcDiscoveryFetch

# Perf Report — oidcDiscoveryFetch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.00033ms |
| p99 | 0.0012ms |
| mean | 0.00032ms |
| stdev | 0.00031ms |
| min | 0.00025ms |
| max | 0.0041ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p50 | 0.00029ms | 0.00025ms | +0.000041ms | +16.40% |
| p95 | 0.00033ms | 0.00034ms | -0.0000030ms | -0.91% |
| p99 | 0.0012ms | 0.00089ms | +0.00028ms | +31.87% |
| mean | 0.00032ms | 0.00030ms | +0.000013ms | +4.32% |
| min | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| max | 0.0041ms | 0.0028ms | +0.0013ms | +44.16% |
| total | 0.06ms | 0.06ms | +0.0026ms | +4.32% |

