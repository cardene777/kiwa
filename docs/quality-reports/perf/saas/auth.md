# Perf Suite — auth

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| nextAuthProviderLookup | 0.00ms | 5ms | PASS | stable |
| luciaSessionIdGenerate | 0.00ms | 5ms | PASS | stable |
| betterAuthProviderLookup | 0.00ms | 5ms | PASS | stable |
| clerkUsersCreateAccessor | 0.00ms | 5ms | PASS | stable |
| auth0RulesActionsAccessor | 0.00ms | 5ms | PASS | stable |
| supabaseAuthEnvAccessor | 0.00ms | 5ms | PASS | stable |
| webAuthnAuthenticatorList | 0.00ms | 5ms | PASS | stable |
| passkeyListAuthenticators | 0.00ms | 5ms | PASS | stable |
| oauth21CreatePkceChallenge | 0.01ms | 10ms | PASS | stable |
| oidcDiscoveryFetch | 0.00ms | 5ms | PASS | stable |

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
| oauth21CreatePkceChallenge | 0.06ms | 20ms | PASS |
| oidcDiscoveryFetch | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| nextAuthProviderLookup | -56240 B | 0 B | 102400 B | yes | PASS |
| luciaSessionIdGenerate | 4792 B | 0 B | 102400 B | yes | PASS |
| betterAuthProviderLookup | 3776 B | 0 B | 102400 B | yes | PASS |
| clerkUsersCreateAccessor | 912 B | 0 B | 102400 B | yes | PASS |
| auth0RulesActionsAccessor | -14608 B | 0 B | 102400 B | yes | PASS |
| supabaseAuthEnvAccessor | 1528 B | 0 B | 102400 B | yes | PASS |
| webAuthnAuthenticatorList | 1296 B | 0 B | 102400 B | yes | PASS |
| passkeyListAuthenticators | 216 B | 0 B | 102400 B | yes | PASS |
| oauth21CreatePkceChallenge | -20264 B | 0 B | 102400 B | yes | PASS |
| oidcDiscoveryFetch | 216 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.00ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +24.55% |
| p95 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +61.25% |
| mean | 0.00ms | 0.00ms | +0.00ms | +13.50% |
| min | 0.00ms | 0.00ms | -0.00ms | -24.70% |
| max | 0.00ms | 0.00ms | +0.00ms | +16.68% |
| total | 0.06ms | 0.05ms | +0.01ms | +13.50% |

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
| p95 | 0.00ms | 0.00ms | +0.00ms | +24.55% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +30.70% |
| mean | 0.00ms | 0.00ms | +0.00ms | +9.54% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +11.57% |
| total | 0.03ms | 0.03ms | +0.00ms | +9.54% |

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
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +24.84% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +111.18% |
| mean | 0.00ms | 0.00ms | +0.00ms | +6.57% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -6.22% |
| total | 0.04ms | 0.04ms | +0.00ms | +6.57% |

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
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +53.22% |
| mean | 0.00ms | 0.00ms | +0.00ms | +10.06% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +30.48% |
| total | 0.03ms | 0.03ms | +0.00ms | +10.06% |

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
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -0.60% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -0.48% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +85.32% |
| mean | 0.00ms | 0.00ms | -0.00ms | -5.07% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +8.57% |
| total | 0.03ms | 0.04ms | -0.00ms | -5.07% |

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
| p95 | 0.00ms | 0.00ms | -0.00ms | -19.71% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +54.50% |
| mean | 0.00ms | 0.00ms | +0.00ms | +6.06% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +90.04% |
| total | 0.03ms | 0.03ms | +0.00ms | +6.06% |

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
| max | 0.01ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -24.70% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -19.71% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +84.74% |
| mean | 0.00ms | 0.00ms | +0.00ms | +17.21% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.00ms | +0.01ms | +557.29% |
| total | 0.04ms | 0.03ms | +0.01ms | +17.21% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +20.19% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +15.85% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +72.23% |
| mean | 0.00ms | 0.00ms | +0.00ms | +26.94% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.00ms | +0.00ms | +89.34% |
| total | 0.06ms | 0.05ms | +0.01ms | +26.94% |

### oauth21CreatePkceChallenge

# Perf Report — oauth21CreatePkceChallenge.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.03ms |
| total | 1.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +7.15% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +5.66% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +19.28% |
| mean | 0.01ms | 0.01ms | +0.00ms | +9.48% |
| min | 0.00ms | 0.00ms | +0.00ms | +4.74% |
| max | 0.03ms | 0.02ms | +0.01ms | +25.55% |
| total | 1.13ms | 1.03ms | +0.10ms | +9.48% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -14.38% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -0.28% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +11.27% |
| mean | 0.00ms | 0.00ms | -0.00ms | -6.82% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | -0.00ms | -3.87% |
| total | 0.06ms | 0.06ms | -0.00ms | -6.82% |

