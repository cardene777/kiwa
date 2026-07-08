# Quality Report — @kiwa/dapp/reorg-dogfood v0.1.0

Overall verdict — **PASS**

## Release gate (11 axes)

| Axis | Value | Threshold | Pass |
|---|---:|---:|:---:|
| coverage.line | 92.00 | 85.00 | YES |
| coverage.branch | 85.00 | 80.00 | YES |
| coverage.function | 95.00 | 90.00 | YES |
| fidelity.ratio | 100.00 | 70.00 | YES |
| fidelity.matrix.rows | 4.00 | 4.00 | YES |
| perf.p95Ms | 0.08 | 100.00 | YES |
| mutation.killRate | 73.33 | 60.00 | YES |
| testCount.behavior | 10.00 | 4.00 | YES |
| chain.blockHeight | 4.00 | 4.00 | YES |
| chain.eventCount | 4.00 | 3.00 | YES |
| abi.transferSelector | 1.00 | 1.00 | YES |

## Fidelity matrix (mock vs real)

| Op | Mock OK | Real OK |
|---|:---:|:---:|
| pendingTx | YES | NO |
| confirmedTx | YES | NO |
| transferEvent | YES | NO |
| nonceGap | YES | NO |

## Notes

Observed 4 divergences:
- pendingTx: BEHAVIORAL_DIVERGENCE
- confirmedTx: BEHAVIORAL_DIVERGENCE
- transferEvent: BEHAVIORAL_DIVERGENCE
- nonceGap: BEHAVIORAL_DIVERGENCE
