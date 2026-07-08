# Perf Suite — auth

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| nextAuthProviderLookup | 0.00ms | 5ms | PASS | stable |
| luciaSessionIdGenerate | 0.00ms | 5ms | PASS | stable |
| betterAuthProviderLookup | 0.00ms | 5ms | PASS | stable |
| clerkUsersCreateAccessor | 0.00ms | 5ms | PASS | stable |
| auth0RulesActionsAccessor | 0.00ms | 5ms | PASS | improved |
| supabaseAuthEnvAccessor | 0.00ms | 5ms | PASS | improved |
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
| oauth21CreatePkceChallenge | 0.06ms | 20ms | PASS |
| oidcDiscoveryFetch | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| nextAuthProviderLookup | 331088 B | 0 B | 102400 B | PASS |
| luciaSessionIdGenerate | 126824 B | 0 B | 102400 B | PASS |
| betterAuthProviderLookup | 126840 B | 0 B | 102400 B | PASS |
| clerkUsersCreateAccessor | 126824 B | 0 B | 102400 B | PASS |
| auth0RulesActionsAccessor | 127192 B | 0 B | 102400 B | PASS |
| supabaseAuthEnvAccessor | 127160 B | 0 B | 102400 B | PASS |
| webAuthnAuthenticatorList | 126840 B | 0 B | 102400 B | PASS |
| passkeyListAuthenticators | -387168 B | 0 B | 102400 B | PASS |
| oauth21CreatePkceChallenge | 643008 B | 20192 B | 102400 B | PASS |
| oidcDiscoveryFetch | -7884896 B | -80076 B | 102400 B | PASS |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +24.55% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +11.57% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +31.59% |
| mean | 0.00ms | 0.00ms | +0.00ms | +11.41% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +26.02% |
| total | 0.05ms | 0.05ms | +0.01ms | +11.41% |

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
| p95 | 0.00ms | 0.00ms | -0.00ms | -31.33% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -19.98% |
| mean | 0.00ms | 0.00ms | -0.00ms | -16.71% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | -0.00ms | -48.00% |
| total | 0.04ms | 0.05ms | -0.01ms | -16.71% |

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
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -44.27% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -19.61% |
| mean | 0.00ms | 0.00ms | +0.00ms | +5.25% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +61.98% |
| total | 0.05ms | 0.04ms | +0.00ms | +5.25% |

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
| p95 | 0.00ms | 0.00ms | +0.00ms | +25.15% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +63.34% |
| mean | 0.00ms | 0.00ms | +0.00ms | +10.93% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | -0.00ms | -30.62% |
| total | 0.03ms | 0.03ms | +0.00ms | +10.93% |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -33.20% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -82.36% |
| mean | 0.00ms | 0.00ms | -0.00ms | -21.79% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | -0.00ms | -43.57% |
| total | 0.03ms | 0.03ms | -0.01ms | -21.79% |

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
| p95 | 0.00ms | 0.00ms | -0.00ms | -66.67% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -68.96% |
| mean | 0.00ms | 0.00ms | -0.00ms | -26.11% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | -0.00ms | -54.40% |
| total | 0.03ms | 0.03ms | -0.01ms | -26.11% |

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
| p99 | 0.00ms | 0.00ms | -0.00ms | -7.20% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.61% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +51.44% |
| total | 0.03ms | 0.03ms | +0.00ms | +1.61% |

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
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -61.37% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -55.90% |
| mean | 0.00ms | 0.00ms | -0.00ms | -13.40% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +23.41% |
| total | 0.04ms | 0.05ms | -0.01ms | -13.40% |

### oauth21CreatePkceChallenge

# Perf Report — oauth21CreatePkceChallenge.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 1.00ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -1.05% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +21.08% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -3.53% |
| mean | 0.01ms | 0.01ms | -0.00ms | -30.71% |
| min | 0.00ms | 0.00ms | +0.00ms | +1.28% |
| max | 0.02ms | 0.48ms | -0.46ms | -95.53% |
| total | 1.00ms | 1.44ms | -0.44ms | -30.71% |

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
| p95 | 0.00ms | 0.00ms | +0.00ms | +187.13% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +29.20% |
| mean | 0.00ms | 0.00ms | +0.00ms | +12.58% |
| min | 0.00ms | 0.00ms | +0.00ms | +25.30% |
| max | 0.00ms | 0.00ms | -0.00ms | -38.09% |
| total | 0.06ms | 0.05ms | +0.01ms | +12.58% |

