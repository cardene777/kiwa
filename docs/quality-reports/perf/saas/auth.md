# Perf Suite — auth

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

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
| oauth21CreatePkceChallenge | 0.06ms | 20ms | PASS |
| oidcDiscoveryFetch | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| nextAuthProviderLookup | -31656 B | 0 B | 102400 B | yes | PASS |
| luciaSessionIdGenerate | -544 B | 0 B | 102400 B | yes | PASS |
| betterAuthProviderLookup | 816 B | 0 B | 102400 B | yes | PASS |
| clerkUsersCreateAccessor | 912 B | 0 B | 102400 B | yes | PASS |
| auth0RulesActionsAccessor | 1144 B | 0 B | 102400 B | yes | PASS |
| supabaseAuthEnvAccessor | 1528 B | 0 B | 102400 B | yes | PASS |
| webAuthnAuthenticatorList | 312 B | 0 B | 102400 B | yes | PASS |
| passkeyListAuthenticators | 1232 B | 0 B | 102400 B | yes | PASS |
| oauth21CreatePkceChallenge | -20760 B | 0 B | 102400 B | yes | PASS |
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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +16.87% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +23.29% |
| mean | 0.00ms | 0.00ms | +0.00ms | +11.66% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +6.40% |
| total | 0.06ms | 0.05ms | +0.01ms | +11.66% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -24.70% |
| p95 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -7.52% |
| mean | 0.00ms | 0.00ms | -0.00ms | -4.06% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | -0.00ms | -0.14% |
| total | 0.03ms | 0.03ms | -0.00ms | -4.06% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -25.15% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +23.63% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +64.29% |
| mean | 0.00ms | 0.00ms | +0.00ms | +0.61% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +12.42% |
| total | 0.04ms | 0.04ms | +0.00ms | +0.61% |

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
| p99 | 0.00ms | 0.00ms | +0.00ms | +23.28% |
| mean | 0.00ms | 0.00ms | +0.00ms | +8.48% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +30.48% |
| total | 0.03ms | 0.03ms | +0.00ms | +8.48% |

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
| max | 0.01ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -0.60% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -20.10% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +152.13% |
| mean | 0.00ms | 0.00ms | +0.00ms | +26.11% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.00ms | +0.01ms | +791.63% |
| total | 0.05ms | 0.04ms | +0.01ms | +26.11% |

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
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -18.73% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +123.79% |
| mean | 0.00ms | 0.00ms | +0.00ms | +18.73% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +345.14% |
| total | 0.04ms | 0.03ms | +0.01ms | +18.73% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -24.70% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -19.71% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -6.34% |
| mean | 0.00ms | 0.00ms | -0.00ms | -0.13% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +99.91% |
| total | 0.03ms | 0.03ms | -0.00ms | -0.13% |

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
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -0.81% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +62.09% |
| mean | 0.00ms | 0.00ms | +0.00ms | +12.59% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.00ms | +0.00ms | +117.34% |
| total | 0.05ms | 0.05ms | +0.01ms | +12.59% |

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
| max | 0.03ms |
| total | 1.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +2.06% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -3.55% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +0.85% |
| mean | 0.01ms | 0.01ms | +0.00ms | +0.26% |
| min | 0.00ms | 0.00ms | +0.00ms | +0.03% |
| max | 0.03ms | 0.02ms | +0.00ms | +15.44% |
| total | 1.03ms | 1.03ms | +0.00ms | +0.26% |

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
| p95 | 0.00ms | 0.00ms | +0.00ms | +12.28% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +23.17% |
| mean | 0.00ms | 0.00ms | -0.00ms | -3.09% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | -0.00ms | -3.90% |
| total | 0.06ms | 0.06ms | -0.00ms | -3.09% |

