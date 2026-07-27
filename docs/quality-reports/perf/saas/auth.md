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
| betterAuthProviderLookup | 0.00ms | 10ms | PASS |
| clerkUsersCreateAccessor | 0.00ms | 10ms | PASS |
| auth0RulesActionsAccessor | 0.00ms | 10ms | PASS |
| supabaseAuthEnvAccessor | 0.00ms | 10ms | PASS |
| webAuthnAuthenticatorList | 0.00ms | 10ms | PASS |
| passkeyListAuthenticators | 0.00ms | 10ms | PASS |
| oauth21CreatePkceChallenge | 0.19ms | 20ms | PASS |
| oidcDiscoveryFetch | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| nextAuthProviderLookup | -52208 B | 0 B | 102400 B | yes | PASS |
| luciaSessionIdGenerate | -16216 B | 0 B | 102400 B | yes | PASS |
| betterAuthProviderLookup | 912 B | 0 B | 102400 B | yes | PASS |
| clerkUsersCreateAccessor | 816 B | 0 B | 102400 B | yes | PASS |
| auth0RulesActionsAccessor | 120 B | 0 B | 102400 B | yes | PASS |
| supabaseAuthEnvAccessor | 408 B | 0 B | 102400 B | yes | PASS |
| webAuthnAuthenticatorList | 1216 B | 0 B | 102400 B | yes | PASS |
| passkeyListAuthenticators | 216 B | 0 B | 102400 B | yes | PASS |
| oauth21CreatePkceChallenge | -20728 B | -10624 B | 102400 B | yes | PASS |
| oidcDiscoveryFetch | -1096 B | 0 B | 102400 B | yes | PASS |

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
| p95 | 0.00ms | 0.00ms | -0.00ms | -12.06% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +61.17% |
| mean | 0.00ms | 0.00ms | +0.00ms | +6.58% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | -0.00ms | -3.85% |
| total | 0.06ms | 0.05ms | +0.00ms | +6.58% |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +0.15% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.60% |
| min | 0.00ms | 0.00ms | -0.00ms | -33.60% |
| max | 0.00ms | 0.00ms | +0.00ms | +29.34% |
| total | 0.03ms | 0.03ms | +0.00ms | +1.60% |

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
| p95 | 0.00ms | 0.00ms | +0.00ms | +23.04% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +17.79% |
| mean | 0.00ms | 0.00ms | -0.00ms | -2.12% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +22.03% |
| total | 0.04ms | 0.04ms | -0.00ms | -2.12% |

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
| p99 | 0.00ms | 0.00ms | +0.00ms | +22.52% |
| mean | 0.00ms | 0.00ms | +0.00ms | +6.78% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +26.10% |
| total | 0.03ms | 0.03ms | +0.00ms | +6.78% |

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
| p95 | 0.00ms | 0.00ms | -0.00ms | -20.10% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +139.35% |
| mean | 0.00ms | 0.00ms | -0.00ms | -4.96% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| total | 0.03ms | 0.04ms | -0.00ms | -4.96% |

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
| p95 | 0.00ms | 0.00ms | -0.00ms | -18.73% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +54.27% |
| mean | 0.00ms | 0.00ms | +0.00ms | +6.30% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +95.08% |
| total | 0.03ms | 0.03ms | +0.00ms | +6.30% |

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
| p95 | 0.00ms | 0.00ms | -0.00ms | -19.71% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +85.87% |
| mean | 0.00ms | 0.00ms | +0.00ms | +11.84% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +103.69% |
| total | 0.04ms | 0.03ms | +0.00ms | +11.84% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.48% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +15.85% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +15.91% |
| mean | 0.00ms | 0.00ms | +0.00ms | +20.42% |
| min | 0.00ms | 0.00ms | +0.00ms | +0.60% |
| max | 0.01ms | 0.00ms | +0.00ms | +141.31% |
| total | 0.06ms | 0.05ms | +0.01ms | +20.42% |

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
| total | 1.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +9.18% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +5.27% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +11.89% |
| mean | 0.01ms | 0.01ms | +0.00ms | +10.09% |
| min | 0.00ms | 0.00ms | +0.00ms | +9.43% |
| max | 0.03ms | 0.02ms | +0.00ms | +20.40% |
| total | 1.14ms | 1.03ms | +0.10ms | +10.09% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -0.34% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -0.30% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +19.08% |
| mean | 0.00ms | 0.00ms | -0.00ms | -4.77% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | -0.00ms | -3.90% |
| total | 0.06ms | 0.06ms | -0.00ms | -4.77% |

