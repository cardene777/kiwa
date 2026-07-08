# kiwa v1.63 x-thread (日本語)

## Tweet 1

kiwa v1.63 リリース — Desktop 深化 VII。 **@kiwa-test/desktop v0.8** で native binding availability probe + skip 経路 追加、 which/where CLI check + platform gate + 12 axis 別 skip strategy + fidelity harness probe 統合。 v1.55-v1.62 4 PR rhythm 継承 (**10 milestone 連続 = 40 PR 連続同 rhythm**)、 **systematic pattern 38 度目適用**、 **depth-8 pattern 新設 candidate 到達**。

## Tweet 2

probe layer = ProbeInput + ProbeResult + PlatformGate + NodePlatform SSOT、 probeCliAvailable (which/where + DI) + shouldSkipAxis (12 axis 別 skip strategy) + platformGate + computeSkipMatrix。 fidelity harness 拡張 = runFidelityCheckWithProbe + SkippedPair 統合、 skip した pair は diffs から除外、 shape 契約 preserving 絶対維持。

## Tweet 3

dogfood-desktop-probe-app 新規、 4 pattern workflow (probeAllCliCommands + skip matrix + probe-aware fidelity + axis skip helper)、 10 test 全 PASS。 kiwa package 47 個到達。 **41 milestone 連続 snippet validation streak** (v1.23-v1.63) 達成。

## Tweet 4

`pnpm add -D @kiwa-test/desktop@^0.8`。 migration: https://cardene777.github.io/kiwa/migrations/v1.62-to-v1.63

v1.64+ で 実 native binding 呼出 (probe availability 判定で 実 CLI 存在時のみ 呼出) 予定。 backward compat 絶対維持で v0.1-v0.7 完全保持。

4 sub 完遂 (v1.63-1 probe + fidelity 統合 / v1.63-2 dogfood 新規 / v1.63-3 docs 41 streak / v1.63-4 publish)。

#kiwa #desktop #probe #testing #vitest
