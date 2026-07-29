# Perf Suite — auth

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| nextAuthProviderLookup | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +41247%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| luciaSessionIdGenerate | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +240385%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| betterAuthProviderLookup | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +240327%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| clerkUsersCreateAccessor | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +299401%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| auth0RulesActionsAccessor | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +239234%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| supabaseAuthEnvAccessor | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +239234%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| webAuthnAuthenticatorList | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +240327%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| passkeyListAuthenticators | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +147885%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| oauth21CreatePkceChallenge | 0.01ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +3259%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| oidcDiscoveryFetch | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +133333%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

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
| passkeyListAuthenticators | 0.00ms | 10ms | PASS |
| oauth21CreatePkceChallenge | 3.39ms | 20ms | PASS |
| oidcDiscoveryFetch | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| nextAuthProviderLookup | -3648 B | 0 B | 102400 B | yes | PASS |
| luciaSessionIdGenerate | 712 B | 0 B | 102400 B | yes | PASS |
| betterAuthProviderLookup | 424 B | 0 B | 102400 B | yes | PASS |
| clerkUsersCreateAccessor | 712 B | 0 B | 102400 B | yes | PASS |
| auth0RulesActionsAccessor | 5104 B | 0 B | 102400 B | yes | PASS |
| supabaseAuthEnvAccessor | 1328 B | 0 B | 102400 B | yes | PASS |
| webAuthnAuthenticatorList | 112 B | 0 B | 102400 B | yes | PASS |
| passkeyListAuthenticators | 16 B | 0 B | 102400 B | yes | PASS |
| oauth21CreatePkceChallenge | -20928 B | 0 B | 102400 B | yes | PASS |
| oidcDiscoveryFetch | 16 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### nextAuthProviderLookup

# Perf Report — nextAuthProviderLookup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +13.43% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -9.64% |
| mean | 0.00ms | 0.00ms | -0.00ms | -46.15% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.07ms | -0.06ms | -90.92% |
| total | 0.07ms | 0.13ms | -0.06ms | -46.15% |

### luciaSessionIdGenerate

# Perf Report — luciaSessionIdGenerate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.00ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.60% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +0.48% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +45.25% |
| mean | 0.00ms | 0.00ms | +0.00ms | +9.05% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +35.31% |
| total | 0.03ms | 0.03ms | +0.00ms | +9.05% |

### betterAuthProviderLookup

# Perf Report — betterAuthProviderLookup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.07ms |
| min | 0.00ms |
| max | 0.92ms |
| total | 0.96ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.60% |
| p95 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +87.28% |
| mean | 0.00ms | 0.00ms | +0.00ms | +2350.65% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.92ms | 0.01ms | +0.92ms | +12945.32% |
| total | 0.96ms | 0.04ms | +0.92ms | +2350.65% |

### clerkUsersCreateAccessor

# Perf Report — clerkUsersCreateAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.00ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.60% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +24.55% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +92.56% |
| mean | 0.00ms | 0.00ms | +0.00ms | +10.29% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +27.80% |
| total | 0.04ms | 0.03ms | +0.00ms | +10.29% |

### auth0RulesActionsAccessor

# Perf Report — auth0RulesActionsAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.00ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +4.91% |
| mean | 0.00ms | 0.00ms | +0.00ms | +7.21% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | -0.00ms | -0.06% |
| total | 0.04ms | 0.04ms | +0.00ms | +7.21% |

### supabaseAuthEnvAccessor

# Perf Report — supabaseAuthEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.00ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -20.10% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +92.50% |
| mean | 0.00ms | 0.00ms | +0.00ms | +6.95% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +221.61% |
| total | 0.03ms | 0.03ms | +0.00ms | +6.95% |

### webAuthnAuthenticatorList

# Perf Report — webAuthnAuthenticatorList.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.00ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -19.73% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -19.04% |
| mean | 0.00ms | 0.00ms | +0.00ms | +0.12% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | -0.00ms | -1.86% |
| total | 0.04ms | 0.04ms | +0.00ms | +0.12% |

### passkeyListAuthenticators

# Perf Report — passkeyListAuthenticators.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +19.62% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -13.03% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -39.93% |
| mean | 0.00ms | 0.00ms | -0.00ms | -37.03% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.02ms | -0.02ms | -69.72% |
| total | 0.06ms | 0.10ms | -0.04ms | -37.03% |

### oauth21CreatePkceChallenge

# Perf Report — oauth21CreatePkceChallenge.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.03ms |
| total | 1.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.00ms | +14.82% |
| p95 | 0.01ms | 0.02ms | -0.00ms | -21.73% |
| p99 | 0.02ms | 0.03ms | -0.01ms | -42.29% |
| mean | 0.01ms | 0.01ms | -0.00ms | -9.70% |
| min | 0.00ms | 0.00ms | -0.00ms | -1.11% |
| max | 0.03ms | 0.06ms | -0.03ms | -51.28% |
| total | 1.19ms | 1.32ms | -0.13ms | -9.70% |

### oidcDiscoveryFetch

# Perf Report — oidcDiscoveryFetch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.00ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +5.77% |
| mean | 0.00ms | 0.00ms | -0.00ms | -3.66% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | -0.00ms | -16.49% |
| total | 0.06ms | 0.07ms | -0.00ms | -3.66% |

