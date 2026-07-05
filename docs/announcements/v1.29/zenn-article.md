---
title: "kiwa v1.29 released — release script filter systematic root cause SSOT 化 (release-invariants v0.1 + hook + release-smoke axis + tutorial 55 + 7 milestone snippet streak)"
emoji: "🧷"
type: "tech"
topics: ["oss", "typescript", "monorepo", "release-gate", "kiwa"]
published: true
---

# kiwa v1.29 released

v1.29 は kiwa の 19 milestone 目です。 v1.11-v1.28 の 18 milestone 連続完遂 retrospective で発見された **release script filter systematic root cause pattern** の 4 milestone 連続 event (v1.14 payment / v1.25 perf-harness / v1.27 quality-metrics / v1.28 realtime) を、 hook + release-smoke test axis + SSOT docs + 新規 npm package の 4 layer で自動化する最軽量 sprint。 kiwa quality gate SSOT の **final hole** (新 package 追加時の release script filter manual update 依存) を埋めた。 v1.11 以降の連続完遂 18 milestone (release gate → 非決定性 → 時間軸 → 横軸拡張 → AI-LLM 深化 → component 縦軸 → Observability v2 → Blockchain 深化 → Framework 深化 → Streaming 深化 → Auth 深化 → Auth 深化 II → Payment 深化 → Edge / Serverless 深化 → Perf-harness sweep → Database 深化 → Mutation testing sweep → Realtime 深化 II) を受けて、 v1.29 は release script filter systematic root cause SSOT 化 milestone、 kiwa runtime fixture 34 → **35 packages** (`@kiwa-test/release-invariants` v0.1.0 新規)。

## 4 回繰返された bug — release script filter 対称性

`scripts.release` は 2 段構成の shell script。

```jsonc
{
  "scripts": {
    "release":
      "pnpm -F @kiwa-test/core -F @kiwa-test/realtime build && " +
      "pnpm publish --filter @kiwa-test/core --filter @kiwa-test/realtime --access public --no-git-checks"
  }
}
```

前半 (`pnpm -F {name} build`) は build filter、 後半 (`pnpm publish --filter {name}`) は publish filter。 `-F` と `--filter` は syntactic に別 flag、 意味的にも別段階を担当する。 新 package を追加する PR で contributor が **片方だけ** 追加した場合 —

- build filter だけ追加 → build は artefact を dist に出す、 publish 段階で package が渡されず npm に publish されない
- publish filter だけ追加 → dist が古い、 publish は `pnpm publish` に「build されていない package を publish しろ」 と要求して失敗 or 古い dist を publish

いずれも **release script は exit 0**、 milestone finisher の release-smoke test は特に fail-fast しない、 milestone 完了として merge される。 npm registry には新 package が届かない (or 古い dist が届く)。

v1.14 payment、 v1.25 perf-harness、 v1.27 quality-metrics、 v1.28 realtime の 4 milestone で **全く同じ bug** が独立に発生。 都度 follow-up PR で fix + release-smoke `v1-X-publish.test.ts` に「この milestone は package を filter に追加した」 assert が 1 行追加される。 次 milestone で同じ bug が再発。

## 主な追加

### `@kiwa-test/release-invariants` v0.1.0 (3 pure invariant checker + 1-shot aggregator)

v1.29-3 で新規 npm package として land。 3 invariant checker + 1 aggregator の 4 export、 全て pure function (no I/O、 no side effects、 no kiwa 固有 dependency)。

- `checkReleaseScriptFilter(releaseScript, publishable)` — 各 publishable package が build filter + publish filter **両半分** に含まれることを assert、 `partial: true` (片半分のみ) を検出
- `checkProvenanceFlagAbsence(releaseScript)` — v1.14 で `pnpm publish` から撤去した `--provenance` flag が creep back していないことを assert、 npm CLI 10+ OIDC federation が pnpm monorepo で不安定なため撤去した invariant
- `checkGateScriptPackageCoverage(mutationGateScript, publishable)` — `test:mutation` が全 publishable package を cover していることを assert、 v1.27 mutation sweep で baseline を確立した package を release-gate が漏れなく参照する invariant
- `buildReleaseInvariantsSummary({ releaseScript, mutationGateScript, publishable })` — 3 invariant を 1-shot で aggregate、 `ok: boolean` + 3 sub-result を return

### 3 rule SSOT

`docs/concepts/release-invariants.md` は kiwa release-gate 全 invariant の 3 rule を単一 SSOT 化 (+ 2 補助 rule で合計 5 rule)。

1. **release script filter 対称性** — 全 publishable package が build filter + publish filter 両半分に含まれる。 半分のみは `partial: true` として detect、 4 回繰返された bug の直接原因。
2. **provenance flag 撤去** — `pnpm publish` に `--provenance` が併記されない。 v1.14 で撤去済、 npm CLI 10+ OIDC federation が pnpm monorepo で不安定なため。
3. **gate script package 網羅** — `test:mutation` が全 publishable package を filter に含む。 v1.27 mutation sweep で baseline を確立した package を release-gate が漏れなく参照する。
4. **1-shot summary via `buildReleaseInvariantsSummary`** — downstream release-smoke suite は通常 single boolean + 3 sub-result を 1 呼出で欲しい。 SSOT aggregator。
5. **7 milestone 連続 snippet validation streak** — 各 tutorial code snippet は real npm package API に対して executable。 v1.23-v1.29 で 7 milestone 連続。

### v1.29-1 release-smoke test axis (Issue #986, PR #989)

`tests/release-smoke/tests/release-script-filter.test.ts` (167 lines) を dynamic package discovery + 40 per-package `it.each` assert で新規 land。 `packages/*/package.json` を scan して `@kiwa-test/*` scope + `private: false` で filter、 各 publishable package が **両半分** に含まれることを assert。 milestone finisher **前** の fail-fast、 v1.30+ で 5 回目の反応的 fix が発生しない invariant。 同 PR で 6 未登録 package (agent / ai-llm / component / mcp / search / streaming) を filter に land、 v1.14 payment 漏れ 4 回目までの反応 pattern を止めて 5 回目予防 pattern に転換。

### v1.29-2 PostToolUse hook + `/issue-plan` checklist SSOT (Issue #987)

`hooks/post-tool-use/release-script-filter-guard.sh` proactive prevention。 Write / Edit が `packages/*/package.json` を触った際に root package.json release script filter 存在を scan、 いずれか半分欠落を warn 出力 (hard-deny せず assist)。 `/issue-plan` skill body に「新 package 追加時の checklist」 SSOT を embed、 新 package 追加 Issue の body template に release script filter update を明示 (Issue body 段階で不変条件が明示される、 実装前の proactive 経路)。

### v1.29-3 release-invariants + docs + publish (Issue #988)

`@kiwa-test/release-invariants` v0.1.0 新規 package land + tutorial 55 (`release-script-filter-ssot.md` = systematic root cause pattern SSOT 化 walkthrough、 mock adapter + file adapter + 4 RED/GREEN behavior test の 15 分 walkthrough) + concept doc (`release-invariants.md` = 3 invariant SSOT + systematic root cause pattern + 4 回 rediscovery ledger + 7 milestone snippet validation streak) + migration guide (`v1.28-to-v1.29.md` = additive-only、 breaking change 0) + snippet validation (`packages/release-invariants/tests/docs-tutorial-v1.29.test.ts` = 8 test) + VitePress publish。 v1.23-1.28 pattern 転写で **7 milestone 連続 pattern** 化 (v1.23-v1.29) 達成。

## Numbers

- **3 sub-Issues resolved** (#986 / #987 / #988) — kiwa milestone 史上最軽量 sprint
- **3 PRs merged** (v1.29-1 through v1.29-3)
- **1 npm major addition** (`@kiwa-test/release-invariants` v0.1.0) — kiwa runtime fixture 34 → **35 packages**
- **3 invariants** (`checkReleaseScriptFilter` + `checkProvenanceFlagAbsence` + `checkGateScriptPackageCoverage`) + **1 aggregator** (`buildReleaseInvariantsSummary`)
- **40 per-package assertion** in `tests/release-smoke/tests/release-script-filter.test.ts`
- **8 snippet-validation tests** in `packages/release-invariants/tests/docs-tutorial-v1.29.test.ts`
- **7 milestone 連続 snippet validation streak** (v1.23 payment / v1.24 edge / v1.25 perf-harness / v1.26 orm / v1.27 quality-metrics / v1.28 realtime / v1.29 release-invariants)

## Why これが「最終 layer」 なのか

manual filter 更新から invariant checker + fail-fast test axis + PostToolUse hook + SSOT docs の **4 layer 自動化** に転換したのが v1.29 milestone の核心。 各 layer は独立して同じ bug を catch する。

- **Layer 1 — invariant checker** (`@kiwa-test/release-invariants` v0.1)。 pure function、 downstream repo にも npm 経由 export。 3 pure function + 1 aggregator + 8 behavior test。
- **Layer 2 — release-smoke test axis** (`tests/release-smoke/tests/release-script-filter.test.ts`)。 dynamic package discovery + 40 per-package assert、 milestone finisher **前** の fail-fast。 「実 repo で今この瞬間」 の invariant を assert。
- **Layer 3 — PostToolUse hook** (`hooks/post-tool-use/release-script-filter-guard.sh`)。 Write / Edit が触った瞬間の warn、 test 実行前の proactive prevention。 実装中の contributor に catch。
- **Layer 4 — SSOT docs** (`docs/concepts/release-invariants.md` + tutorial 55 + migration guide)。 契約書 + walkthrough + migration path。 「なぜこの invariant なのか」 を 4 回 rediscovery ledger + 7 milestone streak で narrative 化。

4 layer のいずれか 1 つでも通れば bug は catch される。 4 layer 全て bypass するには意図的な 4 か所同時修正が必要。 5 回目の release script filter miss は構造的遮断された。

## 18 → 19 milestone streak

v1.11 (release gate) → v1.12 (非決定性) → v1.13 (時間軸) → v1.14 (横軸拡張) → v1.15 (AI-LLM 深化) → v1.16 (component 縦軸) → v1.17 (Observability v2) → v1.18 (Blockchain 深化) → v1.19 (Framework 深化) → v1.20 (Streaming 深化) → v1.21 (Auth 深化) → v1.22 (Auth 深化 II) → v1.23 (Payment 深化) → v1.24 (Edge / Serverless 深化) → v1.25 (Perf-harness sweep) → v1.26 (Database 深化) → v1.27 (Mutation testing sweep) → v1.28 (Realtime 深化 II) → **v1.29 (release script filter systematic root cause SSOT)**。 v1.11 以降全 milestone sub-Issue 完遂維持。 v1.29 は最軽量 sprint (3 sub-Issue、 4 layer 自動化、 1 新 npm package)。

## Roadmap

https://github.com/cardene777/kiwa#roadmap

## Feedback

- npm ... `pnpm add -D @kiwa-test/release-invariants@^0.1`
- GitHub Discussions ... https://github.com/cardene777/kiwa/discussions
- Issue 起票 ... https://github.com/cardene777/kiwa/issues/new
