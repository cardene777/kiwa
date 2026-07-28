# Perf Suite — auth

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| nextAuthProviderLookup | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +41247%) 以上の悪化が必要) |
| luciaSessionIdGenerate | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +240385%) 以上の悪化が必要) |
| betterAuthProviderLookup | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +240327%) 以上の悪化が必要) |
| clerkUsersCreateAccessor | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +299401%) 以上の悪化が必要) |
| auth0RulesActionsAccessor | 0.00ms | 5ms | PASS | stable (差 0.00ms が下限 0.5ms 未満で判定を保留) |
| supabaseAuthEnvAccessor | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +239234%) 以上の悪化が必要) |
| webAuthnAuthenticatorList | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +240327%) 以上の悪化が必要) |
| passkeyListAuthenticators | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +147885%) 以上の悪化が必要) |
| oauth21CreatePkceChallenge | 0.01ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +3259%) 以上の悪化が必要) |
| oidcDiscoveryFetch | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +133333%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| nextAuthProviderLookup | 0.01ms | 10ms | PASS |
| luciaSessionIdGenerate | 0.01ms | 10ms | PASS |
| betterAuthProviderLookup | 0.01ms | 10ms | PASS |
| clerkUsersCreateAccessor | 0.00ms | 10ms | PASS |
| auth0RulesActionsAccessor | 0.01ms | 10ms | PASS |
| supabaseAuthEnvAccessor | 0.00ms | 10ms | PASS |
| webAuthnAuthenticatorList | 0.00ms | 10ms | PASS |
| passkeyListAuthenticators | 0.00ms | 10ms | PASS |
| oauth21CreatePkceChallenge | 0.10ms | 20ms | PASS |
| oidcDiscoveryFetch | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| nextAuthProviderLookup | 192464 B | 0 B | 102400 B | yes | PASS |
| luciaSessionIdGenerate | -15448 B | 0 B | 102400 B | yes | PASS |
| betterAuthProviderLookup | 712 B | 0 B | 102400 B | yes | PASS |
| clerkUsersCreateAccessor | 712 B | 0 B | 102400 B | yes | PASS |
| auth0RulesActionsAccessor | -544 B | 0 B | 102400 B | yes | PASS |
| supabaseAuthEnvAccessor | 1328 B | 0 B | 102400 B | yes | PASS |
| webAuthnAuthenticatorList | -1280 B | 0 B | 102400 B | yes | PASS |
| passkeyListAuthenticators | 16 B | 0 B | 102400 B | yes | PASS |
| oauth21CreatePkceChallenge | -20496 B | 0 B | 102400 B | yes | PASS |
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
| max | 0.00ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -19.71% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -13.36% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -37.67% |
| mean | 0.00ms | 0.00ms | -0.00ms | -54.87% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.07ms | -0.06ms | -93.95% |
| total | 0.06ms | 0.13ms | -0.07ms | -54.87% |

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
| p95 | 0.00ms | 0.00ms | -0.00ms | -19.71% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +26.85% |
| mean | 0.00ms | 0.00ms | -0.00ms | -2.88% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +11.72% |
| total | 0.03ms | 0.03ms | -0.00ms | -2.88% |

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
| p95 | 0.00ms | 0.00ms | -0.00ms | -18.75% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +53.57% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.28% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +4.12% |
| total | 0.04ms | 0.04ms | +0.00ms | +1.28% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -24.70% |
| p95 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -22.76% |
| mean | 0.00ms | 0.00ms | -0.00ms | -2.97% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | -0.00ms | -2.80% |
| total | 0.03ms | 0.03ms | -0.00ms | -2.97% |

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
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +124.55% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +119.14% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +144.52% |
| mean | 0.00ms | 0.00ms | +0.00ms | +130.87% |
| min | 0.00ms | 0.00ms | +0.00ms | +133.60% |
| max | 0.00ms | 0.00ms | +0.00ms | +125.56% |
| total | 0.08ms | 0.04ms | +0.05ms | +130.87% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -24.70% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -20.10% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +116.71% |
| mean | 0.00ms | 0.00ms | +0.00ms | +8.88% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +636.19% |
| total | 0.04ms | 0.03ms | +0.00ms | +8.88% |

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
| p95 | 0.00ms | 0.00ms | -0.00ms | -19.73% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +0.42% |
| mean | 0.00ms | 0.00ms | -0.00ms | -6.81% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | -0.00ms | -20.74% |
| total | 0.03ms | 0.04ms | -0.00ms | -6.81% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -0.48% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -37.58% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -44.08% |
| mean | 0.00ms | 0.00ms | -0.00ms | -43.10% |
| min | 0.00ms | 0.00ms | -0.00ms | -20.19% |
| max | 0.01ms | 0.02ms | -0.01ms | -61.94% |
| total | 0.05ms | 0.10ms | -0.04ms | -43.10% |

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
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.14ms |
| total | 1.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -6.02% |
| p95 | 0.01ms | 0.02ms | -0.00ms | -7.73% |
| p99 | 0.02ms | 0.03ms | -0.01ms | -27.43% |
| mean | 0.01ms | 0.01ms | -0.00ms | -3.21% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.92% |
| max | 0.14ms | 0.06ms | +0.09ms | +146.94% |
| total | 1.28ms | 1.32ms | -0.04ms | -3.21% |

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
| p95 | 0.00ms | 0.00ms | -0.00ms | -10.93% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -5.48% |
| mean | 0.00ms | 0.00ms | -0.00ms | -7.63% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | -0.00ms | -27.08% |
| total | 0.06ms | 0.07ms | -0.01ms | -7.63% |

