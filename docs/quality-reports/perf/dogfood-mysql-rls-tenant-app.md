# Perf Suite — dogfood-mysql-rls-tenant-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| driveTenantInjection | 0.02ms | 80ms | PASS | stable |
| driveCrossTenantRefuse | 0.01ms | 100ms | PASS | stable |
| driveBypassAudit | 0.01ms | 80ms | PASS | stable |
| driveAuditIntegrity | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveTenantInjection | 0.12ms | 160ms | PASS |
| driveCrossTenantRefuse | 0.10ms | 200ms | PASS |
| driveBypassAudit | 0.09ms | 160ms | PASS |
| driveAuditIntegrity | 0.05ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| driveTenantInjection | 1955792 B | 0 B | 102400 B | PASS |
| driveCrossTenantRefuse | 2383280 B | 0 B | 102400 B | PASS |
| driveBypassAudit | 2247896 B | 0 B | 102400 B | PASS |
| driveAuditIntegrity | 2543240 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### driveTenantInjection

# Perf Report — driveTenantInjection.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.05ms |
| total | 1.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +8.00% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -4.91% |
| p99 | 0.03ms | 0.03ms | +0.00ms | +10.92% |
| mean | 0.01ms | 0.01ms | +0.00ms | +6.84% |
| min | 0.00ms | 0.00ms | -0.00ms | -2.22% |
| max | 0.05ms | 0.05ms | +0.00ms | +8.14% |
| total | 1.36ms | 1.28ms | +0.09ms | +6.84% |

### driveCrossTenantRefuse

# Perf Report — driveCrossTenantRefuse.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 1.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -10.95% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -13.16% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -11.87% |
| mean | 0.01ms | 0.01ms | -0.00ms | -9.32% |
| min | 0.01ms | 0.01ms | -0.00ms | -1.16% |
| max | 0.03ms | 0.03ms | +0.00ms | +1.22% |
| total | 1.60ms | 1.76ms | -0.16ms | -9.32% |

### driveBypassAudit

# Perf Report — driveBypassAudit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 1.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +1.27% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -6.57% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +3.95% |
| mean | 0.01ms | 0.01ms | -0.00ms | -4.94% |
| min | 0.01ms | 0.01ms | +0.00ms | +1.29% |
| max | 0.02ms | 0.10ms | -0.07ms | -75.59% |
| total | 1.42ms | 1.50ms | -0.07ms | -4.94% |

### driveAuditIntegrity

# Perf Report — driveAuditIntegrity.serial

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
| max | 0.10ms |
| total | 1.02ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +2.03% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +2.73% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +58.62% |
| mean | 0.01ms | 0.00ms | +0.00ms | +13.75% |
| min | 0.00ms | 0.00ms | +0.00ms | +1.08% |
| max | 0.10ms | 0.02ms | +0.07ms | +345.76% |
| total | 1.02ms | 0.90ms | +0.12ms | +13.75% |

