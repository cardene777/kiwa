# kiwa v2.2 x-thread (English)

## Tweet 1

kiwa v2.2 is out — Auth pair pioneer record update. **@kiwa-lab/auth v0.7** adds continuous-auth state machine on top of v0.6's 8-axis Passwordless UX III. 5 states (monitoring / elevated / step-up-required / session-frozen / terminated), 4 risk levels (low / medium / high / critical), dynamic interval switching (elevated 15s, else 60s). **48 milestone streak**, **systematic pattern 45th** (continuous state machine variant).

## Tweet 2

6 exports: startContinuousAuth + scoreToLevel + evaluateRisk + completeStepUp + freezeSession + terminateContinuousAuth. Score boundary SSOT (inclusive lower), guard clause on completeStepUp, events log 累積 (audit trail). shape contract preserving absolute (existing v0.1-v0.6 API unchanged).

## Tweet 3

dogfood-auth-continuous-app new, 4-pattern workflow (startWithBaselineRisk + escalateOnRiskSignal + completeStepUpAndDeescalate + terminateOnHijack), 7 tests all pass. 3 pair 並列 pioneer record update state (Desktop invoke-cache + quality-metrics adaptive-threshold + auth continuous state machine).

## Tweet 4

`pnpm add -D @kiwa-lab/auth@^2.1`. Migration: https://cardene777.github.io/kiwa/migrations/v2.1-to-v2.2

Auth pair v0.4 → v0.5 → v0.6 → v0.7 = 4 段深化, independent of Desktop v1.67 depth-6 candidate and quality-metrics v2.1 continued deepening.

4 subs completed (v2.2-1 v0.7 continuous state machine + 18 tests / v2.2-2 dogfood 7 tests / v2.2-3 docs 48 streak / v2.2-4 publish).

#kiwa #auth #continuous-auth #state-machine #testing #vitest
