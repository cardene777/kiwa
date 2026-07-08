# Quality Report — @kiwa/security/dogfood-siem-incident-app @ 0.2.0

_Reported at 2026-07-07T07:20:09.591Z._

## 6-axis summary

| axis | value |
|---|---|
| coverage — line | 92.00% |
| coverage — branch | 87.00% |
| coverage — function | 94.00% |
| test count — total | 96 |
| test count — behavior | 88 |
| test count — integration | 5 |
| test count — e2e | 3 |
| fidelity — ratio | 100.00% (16/16) |
| fidelity — behavioralDivergences | 16 |
| perf — p50 | 0.00ms |
| perf — p95 | 0.00ms |
| perf — p99 | 0.00ms |
| perf — samples | 10 |
| mutation — killRate | 70.00% (28/40) |
| mutation — survived | 12 |
| a11y — critical / serious / moderate | 0 / 0 / 0 (minor 0) |

## Release gate

- verdict: **PASS**
- axes evaluated: 8

## Notes

Observed 16 divergences across 16 ops:
- startSiem: BEHAVIORAL_DIVERGENCE
- structureEvent: BEHAVIORAL_DIVERGENCE
- sealEvents: BEHAVIORAL_DIVERGENCE
- applyRetention: BEHAVIORAL_DIVERGENCE
- correlate: BEHAVIORAL_DIVERGENCE
- closeSiem: BEHAVIORAL_DIVERGENCE
- startIncident: BEHAVIORAL_DIVERGENCE
- triggerPlaybook: BEHAVIORAL_DIVERGENCE
- classifySeverity: BEHAVIORAL_DIVERGENCE
- escalate: BEHAVIORAL_DIVERGENCE
- captureForensics: BEHAVIORAL_DIVERGENCE
- recordPostMortem: BEHAVIORAL_DIVERGENCE
- closeIncident: BEHAVIORAL_DIVERGENCE
- startOrchestrator: BEHAVIORAL_DIVERGENCE
- orchestrateDecision: BEHAVIORAL_DIVERGENCE
- closeOrchestrator: BEHAVIORAL_DIVERGENCE
