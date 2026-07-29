# Perf Suite — auth

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| nextAuthProviderLookup | 0.00021ms | 0.00094ms | 5ms | 0.00042ms | PASS | stable (差 0.000042ms が下限 0.00042ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| luciaSessionIdGenerate | 0.00017ms | 0.00021ms | 5ms | 0.00042ms | PASS | stable (差 0.000041ms が下限 0.00042ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| betterAuthProviderLookup | 0.00017ms | 0.00021ms | 5ms | 0.00042ms | PASS | stable (差 0.000041ms が下限 0.00042ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| clerkUsersCreateAccessor | 0.00017ms | 0.00025ms | 5ms | 0.00042ms | PASS | stable (差 0.00013ms が下限 0.00042ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| auth0RulesActionsAccessor | 0.00017ms | 0.00025ms | 5ms | 0.00042ms | PASS | stable (差 0.000041ms が下限 0.00042ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| supabaseAuthEnvAccessor | 0.00017ms | 0.00021ms | 5ms | 0.00042ms | PASS | stable (差 0.000041ms が下限 0.00042ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| webAuthnAuthenticatorList | 0.00017ms | 0.00072ms | 5ms | 0.00042ms | PASS | stable (差 0.000041ms が下限 0.00042ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| passkeyListAuthenticators | 0.00021ms | 0.00029ms | 5ms | 0.00042ms | PASS | stable (差 0.000041ms が下限 0.00042ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| oauth21CreatePkceChallenge | 0.0046ms | 0.02ms | 10ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |
| oidcDiscoveryFetch | 0.00029ms | 0.00038ms | 5ms | 0.00042ms | PASS | stable (検知には +0.00042ms (baseline 比 +166%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| nextAuthProviderLookup | 0.01ms | 10ms | PASS |
| luciaSessionIdGenerate | 0.00ms | 10ms | PASS |
| betterAuthProviderLookup | 0.00ms | 10ms | PASS |
| clerkUsersCreateAccessor | 0.00ms | 10ms | PASS |
| auth0RulesActionsAccessor | 0.00ms | 10ms | PASS |
| supabaseAuthEnvAccessor | 0.00ms | 10ms | PASS |
| webAuthnAuthenticatorList | 0.01ms | 10ms | PASS |
| passkeyListAuthenticators | 0.00ms | 10ms | PASS |
| oauth21CreatePkceChallenge | 0.20ms | 20ms | PASS |
| oidcDiscoveryFetch | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| nextAuthProviderLookup | -9112 B | 0 B | 102400 B | yes | PASS |
| luciaSessionIdGenerate | -12088 B | 0 B | 102400 B | yes | PASS |
| betterAuthProviderLookup | 2560 B | 0 B | 102400 B | yes | PASS |
| clerkUsersCreateAccessor | 2744 B | 0 B | 102400 B | yes | PASS |
| auth0RulesActionsAccessor | 848 B | 0 B | 102400 B | yes | PASS |
| supabaseAuthEnvAccessor | 6792 B | 0 B | 102400 B | yes | PASS |
| webAuthnAuthenticatorList | -800 B | 0 B | 102400 B | yes | PASS |
| passkeyListAuthenticators | 4304 B | 0 B | 102400 B | yes | PASS |
| oauth21CreatePkceChallenge | -20104 B | 9780 B | 102400 B | yes | PASS |
| oidcDiscoveryFetch | -96 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### nextAuthProviderLookup

# Perf Report — nextAuthProviderLookup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00021ms |
| p95 | 0.00094ms |
| p99 | 0.0025ms |
| mean | 0.00035ms |
| stdev | 0.00069ms |
| min | 0.00017ms |
| max | 0.0085ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00017ms | +0.000042ms | +25.30% |
| p50 | 0.00021ms | 0.00017ms | +0.000042ms | +25.15% |
| p95 | 0.00094ms | 0.00059ms | +0.00035ms | +60.28% |
| p99 | 0.0025ms | 0.0014ms | +0.0011ms | +81.18% |
| mean | 0.00035ms | 0.00026ms | +0.000092ms | +35.06% |
| min | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| max | 0.0085ms | 0.0060ms | +0.0025ms | +42.37% |
| total | 0.07ms | 0.05ms | +0.02ms | +35.06% |

### luciaSessionIdGenerate

# Perf Report — luciaSessionIdGenerate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00021ms |
| p99 | 0.00079ms |
| mean | 0.00019ms |
| stdev | 0.00010ms |
| min | 0.00013ms |
| max | 0.0011ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| p50 | 0.00017ms | 0.00013ms | +0.000042ms | +33.60% |
| p95 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p99 | 0.00079ms | 0.00067ms | +0.00012ms | +18.57% |
| mean | 0.00019ms | 0.00015ms | +0.000034ms | +22.01% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0011ms | 0.00075ms | +0.00037ms | +50.00% |
| total | 0.04ms | 0.03ms | +0.0068ms | +22.01% |

### betterAuthProviderLookup

# Perf Report — betterAuthProviderLookup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00021ms |
| p99 | 0.0013ms |
| mean | 0.00024ms |
| stdev | 0.00071ms |
| min | 0.00013ms |
| max | 0.01ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| p50 | 0.00017ms | 0.00013ms | +0.000042ms | +33.60% |
| p95 | 0.00021ms | 0.00017ms | +0.000042ms | +25.15% |
| p99 | 0.0013ms | 0.00071ms | +0.00062ms | +87.56% |
| mean | 0.00024ms | 0.00021ms | +0.000032ms | +15.33% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00067ms | -6.22% |
| total | 0.05ms | 0.04ms | +0.0063ms | +15.33% |

### clerkUsersCreateAccessor

# Perf Report — clerkUsersCreateAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00025ms |
| p99 | 0.00080ms |
| mean | 0.00020ms |
| stdev | 0.00018ms |
| min | 0.00017ms |
| max | 0.0024ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00029ms | -0.00013ms | -42.96% |
| p50 | 0.00017ms | 0.00033ms | -0.00017ms | -49.85% |
| p95 | 0.00025ms | 0.00038ms | -0.00013ms | -33.33% |
| p99 | 0.00080ms | 0.0022ms | -0.0014ms | -63.25% |
| mean | 0.00020ms | 0.00040ms | -0.00020ms | -49.67% |
| min | 0.00017ms | 0.00029ms | -0.00013ms | -42.96% |
| max | 0.0024ms | 0.01ms | -0.0091ms | -79.35% |
| total | 0.04ms | 0.08ms | -0.04ms | -49.67% |

### auth0RulesActionsAccessor

# Perf Report — auth0RulesActionsAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00025ms |
| p99 | 0.00088ms |
| mean | 0.00021ms |
| stdev | 0.00017ms |
| min | 0.00017ms |
| max | 0.0020ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| p50 | 0.00021ms | 0.00013ms | +0.000083ms | +66.40% |
| p95 | 0.00025ms | 0.00017ms | +0.000083ms | +49.70% |
| p99 | 0.00088ms | 0.00075ms | +0.00013ms | +16.75% |
| mean | 0.00021ms | 0.00016ms | +0.000055ms | +35.10% |
| min | 0.00017ms | 0.000083ms | +0.000083ms | +100.00% |
| max | 0.0020ms | 0.0014ms | +0.00058ms | +42.47% |
| total | 0.04ms | 0.03ms | +0.01ms | +35.10% |

### supabaseAuthEnvAccessor

# Perf Report — supabaseAuthEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00021ms |
| p99 | 0.00071ms |
| mean | 0.00019ms |
| stdev | 0.000089ms |
| min | 0.00017ms |
| max | 0.00096ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| p50 | 0.00017ms | 0.00013ms | +0.000042ms | +33.60% |
| p95 | 0.00021ms | 0.00017ms | +0.000042ms | +25.15% |
| p99 | 0.00071ms | 0.00054ms | +0.00017ms | +30.94% |
| mean | 0.00019ms | 0.00015ms | +0.000043ms | +29.41% |
| min | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| max | 0.00096ms | 0.00075ms | +0.00021ms | +27.73% |
| total | 0.04ms | 0.03ms | +0.0087ms | +29.41% |

### webAuthnAuthenticatorList

# Perf Report — webAuthnAuthenticatorList.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00072ms |
| p99 | 0.0026ms |
| mean | 0.00026ms |
| stdev | 0.00037ms |
| min | 0.00017ms |
| max | 0.0027ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| p50 | 0.00017ms | 0.00013ms | +0.000042ms | +33.60% |
| p95 | 0.00072ms | 0.00017ms | +0.00055ms | +328.26% |
| p99 | 0.0026ms | 0.00055ms | +0.0020ms | +372.14% |
| mean | 0.00026ms | 0.00015ms | +0.00010ms | +65.36% |
| min | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| max | 0.0027ms | 0.0014ms | +0.0014ms | +100.00% |
| total | 0.05ms | 0.03ms | +0.02ms | +65.36% |

### passkeyListAuthenticators

# Perf Report — passkeyListAuthenticators.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00025ms |
| p95 | 0.00029ms |
| p99 | 0.0023ms |
| mean | 0.00028ms |
| stdev | 0.00029ms |
| min | 0.00021ms |
| max | 0.0029ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00017ms | +0.000041ms | +24.55% |
| p50 | 0.00025ms | 0.00021ms | +0.000042ms | +20.19% |
| p95 | 0.00029ms | 0.00025ms | +0.000042ms | +16.80% |
| p99 | 0.0023ms | 0.0015ms | +0.00087ms | +59.42% |
| mean | 0.00028ms | 0.00024ms | +0.000044ms | +18.22% |
| min | 0.00021ms | 0.00017ms | +0.000042ms | +25.30% |
| max | 0.0029ms | 0.0037ms | -0.00083ms | -22.21% |
| total | 0.06ms | 0.05ms | +0.0088ms | +18.22% |

### oauth21CreatePkceChallenge

# Perf Report — oauth21CreatePkceChallenge.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0046ms |
| p50 | 0.0051ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0065ms |
| stdev | 0.0035ms |
| min | 0.0043ms |
| max | 0.03ms |
| total | 1.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0046ms | 0.0036ms | +0.0010ms | +27.59% |
| p50 | 0.0051ms | 0.0040ms | +0.0011ms | +28.79% |
| p95 | 0.02ms | 0.0089ms | +0.0061ms | +69.00% |
| p99 | 0.02ms | 0.02ms | +0.0023ms | +15.07% |
| mean | 0.0065ms | 0.0049ms | +0.0016ms | +32.18% |
| min | 0.0043ms | 0.0034ms | +0.00092ms | +26.84% |
| max | 0.03ms | 0.03ms | +0.0062ms | +24.30% |
| total | 1.30ms | 0.98ms | +0.32ms | +32.18% |

### oidcDiscoveryFetch

# Perf Report — oidcDiscoveryFetch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00038ms |
| p99 | 0.0014ms |
| mean | 0.00036ms |
| stdev | 0.00028ms |
| min | 0.00025ms |
| max | 0.0037ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00025ms | +0.000041ms | +16.40% |
| p50 | 0.00033ms | 0.00025ms | +0.000083ms | +33.20% |
| p95 | 0.00038ms | 0.00034ms | +0.000041ms | +12.20% |
| p99 | 0.0014ms | 0.00089ms | +0.00053ms | +59.35% |
| mean | 0.00036ms | 0.00030ms | +0.000056ms | +18.46% |
| min | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| max | 0.0037ms | 0.0028ms | +0.00083ms | +29.44% |
| total | 0.07ms | 0.06ms | +0.01ms | +18.46% |

