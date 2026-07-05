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
| luciaSessionIdGenerate | 0.01ms | 10ms | PASS |
| betterAuthProviderLookup | 0.01ms | 10ms | PASS |
| clerkUsersCreateAccessor | 0.00ms | 10ms | PASS |
| auth0RulesActionsAccessor | 0.00ms | 10ms | PASS |
| supabaseAuthEnvAccessor | 0.00ms | 10ms | PASS |
| webAuthnAuthenticatorList | 0.00ms | 10ms | PASS |
| passkeyListAuthenticators | 0.00ms | 10ms | PASS |
| oauth21CreatePkceChallenge | 0.31ms | 20ms | PASS |
| oidcDiscoveryFetch | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| nextAuthProviderLookup | 132248 B | 0 B | 102400 B | PASS |
| luciaSessionIdGenerate | 126824 B | 0 B | 102400 B | PASS |
| betterAuthProviderLookup | 126992 B | 0 B | 102400 B | PASS |
| clerkUsersCreateAccessor | 126824 B | 0 B | 102400 B | PASS |
| auth0RulesActionsAccessor | -260760 B | 0 B | 102400 B | PASS |
| supabaseAuthEnvAccessor | 127184 B | 0 B | 102400 B | PASS |
| webAuthnAuthenticatorList | 126840 B | 0 B | 102400 B | PASS |
| passkeyListAuthenticators | 138040 B | 0 B | 102400 B | PASS |
| oauth21CreatePkceChallenge | 641856 B | 20192 B | 102400 B | PASS |
| oidcDiscoveryFetch | 197264 B | 0 B | 102400 B | PASS |

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
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -0.14% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +15.79% |
| mean | 0.00ms | 0.00ms | +0.00ms | +5.32% |
| min | 0.00ms | 0.00ms | -0.00ms | -24.70% |
| max | 0.00ms | 0.00ms | +0.00ms | +86.03% |
| total | 0.05ms | 0.05ms | +0.00ms | +5.32% |

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
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -0.60% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -43.78% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -20.04% |
| mean | 0.00ms | 0.00ms | -0.00ms | -11.76% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | -0.00ms | -13.31% |
| total | 0.04ms | 0.05ms | -0.01ms | -11.76% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +32.80% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +11.20% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -34.79% |
| mean | 0.00ms | 0.00ms | -0.00ms | -1.90% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -10.55% |
| total | 0.04ms | 0.04ms | -0.00ms | -1.90% |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +49.70% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +36.92% |
| mean | 0.00ms | 0.00ms | +0.00ms | +16.96% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | -0.00ms | -50.02% |
| total | 0.04ms | 0.03ms | +0.01ms | +16.96% |

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
| p99 | 0.00ms | 0.00ms | -0.00ms | -8.82% |
| mean | 0.00ms | 0.00ms | +0.00ms | +6.99% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +38.46% |
| total | 0.04ms | 0.03ms | +0.00ms | +6.99% |

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
| p95 | 0.00ms | 0.00ms | -0.00ms | -44.27% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -3.39% |
| mean | 0.00ms | 0.00ms | -0.00ms | -8.95% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | -0.00ms | -42.11% |
| total | 0.03ms | 0.03ms | -0.00ms | -8.95% |

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
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -21.42% |
| mean | 0.00ms | 0.00ms | +0.00ms | +4.03% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +2.88% |
| total | 0.03ms | 0.03ms | +0.00ms | +4.03% |

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
| max | 0.00ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +24.55% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +23.29% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -55.94% |
| mean | 0.00ms | 0.00ms | -0.00ms | -3.86% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | -0.00ms | -36.18% |
| total | 0.05ms | 0.05ms | -0.00ms | -3.86% |

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
| max | 0.02ms |
| total | 1.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +9.38% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +22.54% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +8.53% |
| mean | 0.01ms | 0.01ms | -0.00ms | -28.53% |
| min | 0.00ms | 0.00ms | +0.00ms | +3.83% |
| max | 0.02ms | 0.48ms | -0.46ms | -95.17% |
| total | 1.03ms | 1.44ms | -0.41ms | -28.53% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.48% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +186.83% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +50.00% |
| mean | 0.00ms | 0.00ms | +0.00ms | +17.31% |
| min | 0.00ms | 0.00ms | +0.00ms | +25.30% |
| max | 0.00ms | 0.00ms | +0.00ms | +21.43% |
| total | 0.06ms | 0.05ms | +0.01ms | +17.31% |

