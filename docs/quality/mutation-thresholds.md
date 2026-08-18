# Mutation thresholds — SSOT

## Why this file exists

The Stryker rollout across kiwa's `@kiwa-lab/*` monorepo used ad-hoc per-package thresholds up to v1.26 — `high 80 / low 60 / break 50` for `core`, `high 90 / low 80 / break 80` for `api` and `nextjs`, and no documented reason for the split. When v1.27 expands mutation testing from 22 packages to 33+, each new package needs a threshold justification that survives review.

This doc pins every package to one of four rationale tiers and encodes the mapping in each package's `stryker.config.mjs` header comment. The tiers are named after the shape of the code Stryker runs over, not the package name.

## Tier table

| Tier | Kill-rate `high` | Kill-rate `low` | Kill-rate `break` | Applies to |
|---|---|---|---|---|
| Core | 80 % | 60 % | 50 % | Pure logic packages with fully deterministic tests and no external protocol drift. |
| Framework | 70 % | 60 % | 50 % | SSR / hydration / RSC / adapter-wrapper layers where framework internals + client / server dual code paths lower the maximum practical kill-rate. |
| SaaS | 65 % | 55 % | 50 % | Provider-specific adapters (Stripe / Paddle / Anthropic / Ably / Redis / Prisma / …) where mocks approximate a live external API and drift is expected. |
| Test type | 60 % | 50 % | 40 % | Test harness packages (component / a11y / e2e) where DOM / measurement noise + browser dependence inflates false-negative mutants. |

Kill-rate = `killed / (killed + survived + timeout + error)` as reported by Stryker's `json` reporter. `high` colours the HTML report green, `low` colours it yellow, `break` fails the mutation run.

## Tier assignment — 33-plus package matrix

| Package | Tier | Threshold | Reason |
|---|---|---|---|
| `@kiwa-lab/core` | Core | 80 / 60 / 50 | Pure parser + pool logic every adapter depends on. |
| `@kiwa-lab/api` | Core | 80 / 60 / 50 | HTTP request client + MSW bridge — protocol invariants. Ran at 90 while only 4 files were mutated; #1963 widened it to every implementation file, measured 88.29, and returned the bar to the tier default. |
| `@kiwa-lab/data` | Core | 80 / 60 / 50 | Fixture builders + assertion helpers, pure logic. |
| `@kiwa-lab/cli-test` | Core | 80 / 60 / 50 | CLI expectation runner, pure logic. |
| `@kiwa-lab/cli` | Core | 80 / 60 / 50 | CLI runtime for kiwa init / scaffold, pure logic. |
| `@kiwa-lab/security` | Core | 80 / 60 / 50 | v0.1 policy engines (CSP / rate-limit / authorization / WAF / threat-model / secrets-scan / SBOM / headers) plus the v0.2 advanced-II semantics layer — pure logic. #1965 widened it to every implementation file, the env-gated `real-driver.ts` included, and it measured 87.13. |
| `@kiwa-lab/observability` | Core | 80 / 60 / 50 | Flaky detection + coverage gap analysis, pure logic. #1980 widened it to every implementation file and measured 84.97. |
| `@kiwa-lab/nextjs` | Framework | 70 / 60 / 50 | RSC + Server Actions + Middleware invariants. v1.27-1 rolled out with an aspirational 90 / 80 / 80 override, but the v1.27-2 baseline sweep landed at 80 % covered MSI (79.35 % total). Reverted to Framework default until follow-up tests raise the bar back to 90. |
| `@kiwa-lab/edge` | Framework | 70 / 60 / 50 | Workers / Deno / Bun edge runtimes with divergent APIs. #1971 widened it from two files to every implementation file and measured 91.08, second only to `ui` at 91.18 and 21 points clear of its tier. |
| `@kiwa-lab/hono` | Framework | 70 / 60 / 50 | Hono edge + node adapter drift. |
| `@kiwa-lab/auth` | Framework | 70 / 60 / 50 | Adapter wraps NextAuth v5 / Lucia v3 / Better Auth / Clerk / Auth0 / Supabase Auth — SSR + RSC + provider drift. Ran at `override: 65` until #1973 re-measured it at 75.74 and removed it; #1980 widened it to every implementation file and measured 79.89. |
| `@kiwa-lab/ai-llm` | SaaS | 65 / 55 / 50 | Anthropic / OpenAI / Vercel AI SDK / LangChain — provider API surfaces evolve rapidly. Its narrow scope measured 64.45, below the tier; #1980 widened it to every implementation file and measured 75.83. |
| `@kiwa-lab/queue` | SaaS | 65 / 55 / 50 | BullMQ / Inngest / Cloudflare Queues / SQS / RabbitMQ — provider transport + semantics drift. #1980 widened it to every implementation file and measured 78.37; the `testcontainers-*` exclusion it carried was checked and found wrong (274 covered mutants across the two files, not 0). |
| `@kiwa-lab/cache` | SaaS | 65 / 55 / 50 | Redis / KeyDB / Memcached — client library + protocol drift. Ran on `in-memory-cache.js` alone under `override: 60`; #1967 widened it to every implementation file, measured 78.77, and deleted the override. |
| `@kiwa-lab/realtime` | SaaS | 65 / 55 / 50 | Supabase Realtime / Ably / Pusher / Socket.io — WebSocket API drift. Ran at `override: 60` until #1973 re-measured it at 67.54 and removed it; #1980 widened it to every implementation file and measured 69.41. The `pusher` / `socketio` / `report` exclusions it carried were checked and found wrong (115 / 137 / 67 covered mutants). |
| `@kiwa-lab/search` | SaaS | 65 / 55 / 50 | Algolia / Meilisearch / Typesense — index + query fidelity drift. #1969 widened it from the three adapters plus the engine to every implementation file and measured 79.89. |
| `@kiwa-lab/orm` | SaaS | 65 / 55 / 50 | Prisma / Drizzle / Kysely — SQL dialect + query planner drift. |
| `@kiwa-lab/dapp` | SaaS | 65 / 55 / 50 | viem + anvil + wallet fixture — chain protocol + wallet inject drift. |
| `@kiwa-lab/ui` | Test type | 60 / 50 / 40 | Vue / Solid / Lit / Qwik / Angular DOM harness — jsdom + framework noise. |
| `@kiwa-lab/a11y` | Test type | 60 / 50 / 40 | axe-core WCAG 2.1 AA — measurement noise + jsdom limits. The historical 90 came from a 67-line scope; #1963 added `layer-harness.ts` and it measured 82.42, exactly what § Expect scores to drop predicted. |
| `@kiwa-lab/component` | Test type | 60 / 50 / 40 | Storybook + Playwright CT + Chromatic — DOM + visual noise. |
| `@kiwa-lab/e2e` | Test type | 60 / 50 / 40 | Playwright fixture + test env — browser fixture noise. |

Any future adapter starts by picking the tier its code most resembles. If none fits, add a new tier here first, then the config.

## How each package encodes this

Every `packages/*/stryker.config.mjs` starts with a header comment that names the tier and links back to this doc:

```js
/**
 * Mutation testing config for @kiwa-lab/<name>.
 * Threshold: <tier> tier (high N / low N / break N) — <one-line reason>.
 * SSOT: docs/quality/mutation-thresholds.md § <tier> tier.
 */
```

The comment is the on-the-spot receipt. This doc is the shared law.

## What goes in `mutate` (Issue #1944)

**Every file with behaviour of its own.** Two shapes have none, and only those are out of scope:

- a barrel, which forwards other modules and decides nothing itself
- a file that declares nothing but types and interfaces, which is gone before anything runs

Everything else belongs in `mutate`. A barrel does execute, but there is nothing in it to get wrong —
Stryker generates no mutants from a re-export.

The test below tells the shapes apart by what a file exports. That is a stand-in for behaviour, and
§ Telling the shapes apart records where the two come apart.

**The repo reached this target in #1982.** All 68,353 implementation lines are in `mutate`, across
all 22 packages (§ Widening a package's scope). A green mutation gate now covers every package's
implementation rather than whatever its config happened to list.

No config names a barrel any more (`api`, `ui`, and `a11y` each listed their `index.js` until #1963
widened them). Listing one is harmless — Stryker finds nothing to mutate there — but it makes the
scope read wider than it is, so drop it when you widen a package. The report lists any that come back
under "named in `mutate`, holds no runtime value".

### Telling the shapes apart

`scripts/mutation-scope-report.mjs` applies the test below, so a package's answer is one command
rather than a reading of every file (`--list <package>`, § Widening a package's scope).

Compile the file with the types stripped and read what the emitted JavaScript still exports. Types,
interfaces, and `declare` forms leave nothing behind, so whatever remains is what exists at runtime.

Then classify what remains. The split is syntactic: an export carrying a module specifier
(`export * from './a.js'`, `export { b } from './b.js'`) forwards, and anything else counts as the
file's own.

Syntax is not meaning here. `import x from './a.js'; export default x` re-publishes someone else's
value without a specifier, so it reads as implementation. That is the safe direction to err — the
file ends up in `mutate` and Stryker finds little to mutate. No file in the repo is shaped that way
today; the report counts them on every run so the claim stays checked rather than remembered.

- own values present → implementation
- only forwards → barrel
- neither → type-only

**A file that runs but publishes nothing of its own is where this test disagrees with the rule.** It
has behaviour and belongs in `mutate`, but there is no export for the test to read. It lands in
type-only if it forwards nothing, and in barrel if it also re-exports — so the report keys the check
on "publishes no values of its own", not on the bucket.

Two files in the repo are shaped that way, and the report names both rather than letting them sit in
a bucket that reads "forwards only" or "declares only types":

| file | what it is | call |
|---|---|---|
| `cli/src/bin.ts` | the CLI entrypoint — imports `runCli` and calls it | belongs in `mutate`; add it when `cli` widens |
| `dapp/src/strict-abi-typing.ts` | type-level assertions guarded by `if (false)` | leave out — the only code that survives erasure never runs |

The call differs per file, which is why the report names them instead of deciding.

Do **not** decide by reading the source and listing which declaration forms produce runtime values.
#1944 wrote that check and had to extend it in four consecutive review rounds — first for
`export { run }` written apart from its declaration, then `export default <expr>`, then
`export namespace`, then `export declare function`.

The first three dropped real implementation out of scope. The fourth erred the other way, counting a
type declaration as implementation. Both directions are wrong and neither announces itself, and
there is no point at which such a list is provably complete.

A file can be both shapes at once: `cli/detect/index.ts` and `component/fixture.ts` re-export *and*
implement. Count those as implementation. Their re-export lines then sit inside the implementation
total, which matters only when the line count drives an estimate. The two come to 440 lines, **19 of
them re-export** — that 19 is the number to subtract, not the 440, and the report prints both.

The rule is deliberately blunt. `mutate` lists paths by hand, so a file added later is outside the
scope until someone remembers to add it. #1936 is what that costs: `index.ts` was split into
`runCli.ts`, the list kept pointing at the old shape, and the argument parsing and command routing
that moved sat outside every gate while the report still read green. Adding the file back produced
611 mutants — none of which existed while it was out of scope, which is why nothing failed.
"Every file with behaviour of its own" removes the remembering.

### The measurement that produced this rule

`node scripts/mutation-scope-report.mjs` produces it (#1948). The numbers below are that script's
output as of #1980 (2026-08-18, 22 packages); they move as the source does, so re-run it rather than
reading the snapshot as current.

| bucket | lines |
|---|---|
| implementation, in `mutate` | 68,353 |
| implementation, not in `mutate` | 0 |
| barrel | 3,361 |
| type-only | 692 |

So 100.0% of implementation lines were covered (68,353 of 68,353).

Everything outside `mutate` totals 4,053 lines, and **all of it is barrel plus type-only** — the two
shapes this section defines as out of scope. All 22 packages are at 100%.

The gap this section opened with was 50,225 lines at 26.5%, and seven PRs closed it entirely
(#1966 `security`, #1968 `cache`, #1970 `search`, #1972 `edge`, #1983 the large group, #1985 `orm`,
#1987 `dapp`) **without a new test**: every package that was widened met its tier as it already
stood. What the widenings cost was config edits and, twice, finding out why the tests that already
existed were not running.


#1944 classified the same files by hand and published totals 404 lines higher — one per file, from
counting the empty string after a file's trailing newline as a line. Which bucket each file landed
in was the same; only the line counts moved.

### Expect scores to drop, and do not read that as regression

Adding one 467-line file to `@kiwa-lab/a11y` moved it from 47 to 256 mutants, 95.74 to 82.42, and
9 to 36 seconds. The new file scored 79.43 on its own and diluted the 95.74 that the old, narrower
scope reported.

Nothing got worse. A range that was never measured became visible. Narrowing the scope back would
restore the high number by not looking, which is the failure this rule exists to prevent.

## Overrides

**Use the tier default.** An override is an exception and needs the reason recorded next to it.

### Current overrides

<!-- generated: override-roster -->
| package | tier | override | direction | reason |
|---|---|---|---|---|
| (none) | — | — | — | — |
<!-- /generated: override-roster -->

**This table is generated from `PACKAGE_TIER` — do not edit it by hand.**
`node scripts/sync-override-roster.mjs --write` rewrites it, and release-smoke runs the same script
in check mode, so a hand edit or a stale roster fails.

It is generated rather than checked because #1975 tried checking first: a parser read the
hand-written table and compared it to `PACKAGE_TIER`, and seven review rounds each found another way
a hand-written table can disagree with itself (a `(none)` row beside real rows, one package listed
twice, a `tier` cell naming the wrong tier, a repeated column name, a second copy of the section
further down). Markdown has no bottom to that list. A generated table has nothing to disagree with.

Everywhere else — the assignment table above, the concept doc, the tutorials, the JSDoc on
`ReleaseGateContext.mutationTierThreshold` — points here instead of repeating it. #1973 spent seven
review rounds on the alternative: the same fact written into six files, each going stale on its own
schedule, and the fix for each one restating the *new* current value so the next change would stale
them again.

Prose below this table describes overrides that existed and why they went. That is history and does
not go stale; the roster is state and does.

**`scripts/check-mutation-gates.mjs` (`PACKAGE_TIER`) is what the gate reads.** The assignment table
above repeats those numbers for readability, so the two can drift — `@kiwa-lab/a11y` sat at
60 / 50 / 40 in the table while running at `override: 90` until #1944 corrected the row. When they
disagree, `check-mutation-gates.mjs` is right.

Overrides that *raise* the bar come from a narrow scope where a high number was easy to hold. They
are not evidence that the widened scope can hold the same bar, so they return to the tier default as
each package's scope grows.

**Both of the raised overrides this doc used to cite are gone** (#1963). `@kiwa-lab/api` ran at 90
over 4 files and measured 88.29 once every implementation file was mutated; `@kiwa-lab/a11y` ran at
90 over 67 lines and measured 82.42 once `layer-harness.ts` joined. Neither package got worse — the
number that was easy to hold was a number about a small scope. No raised override remains.

Overrides that *lower* the bar are temporary by construction and must not drop below the tier's
`break` threshold. Re-evaluate each one when its package's scope widens — `@kiwa-lab/orm` carried
`override: 60` with a "raises back to 65" note until #1941 covered the 18 mutants that had no test at
all, at which point the score reached 90.43 and the override was deleted rather than adjusted.

**Re-evaluating means re-measuring, because the number an override cites goes stale.**
`@kiwa-lab/cache` held `override: 60` against a 62.68 measurement, waiting on TTL and eviction
follow-up. #1967 re-ran the same narrow scope and got 68.42 — the follow-up had landed at some point
and nothing re-read the override. Widening then took it to 78.77 and the override was deleted. A
lowered override that no one re-measures reads as "this package is weak" long after it stopped being
true, and the gate scores against the lower bar the whole time.

The last two lowered overrides went the same way as `cache` (#1973): `@kiwa-lab/auth` was pinned at
65 against a 68.86 sweep and measured 75.74, `@kiwa-lab/realtime` was pinned at 60 against 62.31 and
measured 67.54. What the roster holds today is § Current overrides above, not this paragraph.

`auth` is the one worth reading twice. Its reason named `session.js` at 56.76 % and said follow-up
tests would raise it — and `session.js` is still 57.89. What moved was `adapter.js` (76.71) and
`providers.js` (86.21), which carry the aggregate the gate reads. **The stated condition was never
met; the bar it protected stopped needing it.** A reason that names one file is a note about intent,
not a condition the gate can check, so re-measure the package rather than reading the note.

A looser override still requires a one-line justification in the PR body that introduces it.
Re-measure it before the next milestone rather than leaving it to the next scope change — the three
removed so far had all been removable for some time before anyone looked.

## Widening a package's scope

One Issue per unit of work, sized by how much sits outside `mutate` today. A unit is usually one
package, but packages that turn out to need the same edit go together: #1963 widened nine in one PR
and #1980 widened five. The three groups below were drawn on the assumption that the work differs in
kind with volume — that the small group would be a config edit plus a re-run and the large group
would need its own test-writing plan.

**Only the first half held.** #1980 measured the large group and five of its seven packages were
also a config edit plus a re-run (§ The large group was measured before it was planned). The two
that were not failed on wall-clock and on missing tests, neither of which the grouping predicts.
Read the groups as a record of how the work was scheduled, not as a claim about how hard each one is.

| group | packages | uncovered lines each |
|---|---|---|
| large — measured in #1980 | ~~`auth` (13,899)~~, ~~`orm` (5,011)~~, ~~`queue` (4,978)~~, ~~`observability` (4,970)~~, ~~`ai-llm` (4,735)~~, ~~`realtime` (3,950)~~, ~~`dapp` (3,501)~~ | 3,000+ |
| medium — done | ~~`edge` (2,802)~~, ~~`search` (2,179)~~, ~~`cache` (2,084)~~, ~~`security` (2,116)~~, ~~`cli` (2,053)~~ | 1,000-3,000 |
| small — done in #1963 | ~~`component`, `nextjs`, `a11y`, `ui`, `core`, `e2e`, `cli-test`, `api`, `data`~~ | under 1,000 |

`hono` already sat at 100% and needed no Issue. `cli` widened in #1961, the small group in #1963,
`security` in #1965, `cache` in #1967, `search` in #1969, `edge` in #1971, five of the large group
in #1980, `orm` in #1981, and `dapp` in #1982. **All 22 packages are at 100%; the checklist is
closed.**

### The large group was measured before it was planned (#1980)

This section used to say the large group "will not go that way" — that config edits plus a re-run
would not be enough, and it needed its own test-writing plan. The evidence was one number: `auth`
mutated 2.0% of its 14,187 lines.

#1980 widened all seven on a throwaway branch and ran them once each. Five met their tier with no
test written, and every one of the five scored *higher* than its narrow scope did.

| package | tier | before | after | mutants | run |
|---|---|---|---|---|---|
| `auth` | 70 | 75.74 | **79.89** | 6,171 | 15m52s |
| `observability` | 80 | 84.43 | **84.97** | 3,581 | 5m18s |
| `ai-llm` | 65 | 64.45 | **75.83** | 4,375 | 8m45s |
| `queue` | 65 | 77.47 | **78.37** | 2,839 | 14m36s |
| `realtime` | 65 | 67.54 | **69.41** | 2,409 | 4m04s |
| `orm` | 65 | 90.43 | **76.94** | 2,856 | 11m28s *(after #1981)* |
| `dapp` | 65 | 85.09 | **68.36** | 2,473 | 33m33s *(after #1982)* |

`auth` is the one the old text was written about, and it cleared its tier by ten points. `ai-llm` is
the sharper case: its narrow scope scored 64.45, *below* the SaaS bar, and widening took it to 75.83
— **the six files it had been mutating were its worst-tested ones.**

**Line count does not predict this.** `observability` (5,544 lines) finishes in 5 minutes; `orm`
(5,134) took 2.5 hours without finishing, and 11m28s once #1981 found what it was waiting on. Within
the medium group `search` (2,179) took 1m41s and `cache` (2,084) took 5m02s. What the count measures
is how much code there is, and the question is what the tests do with it.

Two packages did fail, for reasons that are not about score. **Both are now resolved, and in
neither case did the stated reason survive being measured.**

- **`orm` — wall-clock** (#1981, resolved). 2,463 of 2,856 mutants in 11 minutes, then roughly 8
  mutants a minute with timeouts climbing to 24. What it waited on was not the semantics suite but
  two live-container test files, which start a real MySQL and Postgres in `beforeAll`; per-test
  coverage made every mutant they cover pay a container startup. Excluding them from mutation runs
  brought the run to 11m28s at 76.94 covered MSI. § A slow test can also be a weak one records why
  excluding them reads the code more honestly than including them did.
- **`dapp` — the tests were there all along** (#1982, resolved). 2,103 of 2,473 widened mutants
  landed as no-coverage, and the config header attributed it to a dry run that "can't construct"
  the forge artefacts its suite needs. Both halves were wrong. The artefacts are committed under
  `examples/nextjs-bridge/forge-out/`, so nothing needs constructing, and `vitest.stryker.config.mjs`
  was not excluding a few files — it named **three of the package's thirty-seven test files** in an
  `include` allowlist. #1980 widened `mutate` to 25 files against those three tests, which is the
  whole of the 85 %. With the suite switched back on the figure is 15 % and the score is 68.36.
  § A no-coverage rate can be a switched-off suite records what the measurement looked like.

The lesson is the one § Overrides already states about override values, applied to a different kind
of claim. **"This will be expensive" is a measurement, and an unmeasured one goes stale the same way
a number does.** The claim here was never measured, and five of the seven packages it described had
been one config edit away the whole time. The remaining two were not one config edit away, but what
they needed was still a measurement rather than a plan: each carried a written reason for its own
exclusion, and neither reason held.

### A no-coverage rate can be a switched-off suite (#1982)

`dapp` reported 85 % no-coverage after #1980 widened it, and the natural reading of that number is
the one this document warns about elsewhere: code the unit suite cannot reach. Its config header
said as much, naming forge artefacts the dry run "can't construct on its own".

Measured, the number was not about the code at all.

| | before | after |
|---|---|---|
| test files Stryker ran | **3 of 37** | 37 of 37 |
| no-coverage | 2,103 of 2,473 (85 %) | 347 of 2,473 (15 %) |
| covered MSI | 48.92 | **68.36** |

`vitest.stryker.config.mjs` carried an `include` **allowlist** naming three test files. Its `mutate`
list named the three implementation files those tests cover, so while both were narrow the config
was self-consistent. #1980 widened `mutate` to 25 files and left the allowlist alone, and the 85 %
is entirely that mismatch.

Removing the allowlist surfaced one real dry-run failure, and its cause was also not artefact
construction. `deploy-contract.test.ts` resolved the example root from `process.cwd()`, which is the
package dir under `pnpm test` and `.stryker-tmp/sandbox-*` under Stryker — so it looked for
`packages/dapp/examples/...` and found nothing. Resolving from the repo root fixed it.
`injector.test.ts` carried the same form and was fixed with it.

**Two things generalise from this.**

The first is about reading a no-coverage rate. It is a statement about what ran, not about what
could run, and the gap between those is a config away. Before concluding that code is unreachable,
check how many test files the mutation runner is actually given — `Initial test run succeeded. Ran N
tests` in the Stryker log is the number to compare against `pnpm test`.

The second is about `include` allowlists in a `vitest.stryker.config.mjs`. They stay correct only
while `mutate` stays matched to them by hand, and nothing checked the pairing. `dapp` now globs
(`.vitest-dist/tests/**/*.test.js`), and a check in
`tests/release-smoke/tests/mutation-gate-coverage.test.ts` derives which packages still name files
outright rather than leaving that count written down here.

**Writing "none remain" here would have been wrong the day it was written.** The check found `ui`,
which names six of its test files and records 54 no-coverage of 190 mutants — the same shape at a
smaller scale. Whether its remaining files can join the run is #1986; the check holds it as a
recorded exception with that reason, so the exception cannot go quiet.

It found a second one on the round after, and that one was in this PR. `exclude` narrows the same
set from the other side, so a check reading `include` alone passes a canonical glob paired with
`exclude: ['**/rpc-handlers*.test.js']` — measured, it did. Covering both sides also caught `orm`,
whose live-container exclusion (§ A slow test can also be a weak one) is a deliberate narrowing that
had no recorded home until now. `**/.stryker-tmp/**` is the one exclude that is not a narrowing: it
drops sandbox copies of the suite rather than members of it (#1984).

### A slow test can also be a weak one (#1981)

`orm` looked like a pure runtime problem, and the obvious reading of "exclude the slow tests" is that
it trades measurement for speed. Measured, the trade was smaller than it looked, and it ran the other
way.

The two live test files start a real MySQL and Postgres through testcontainers in `beforeAll`. Under
per-test coverage, Stryker re-runs the covering tests for every mutant, so each mutant they cover
pays a full container startup. On `setup-orm-env.js:1-120` that is 107 mutants in over 11m30s with
them and 20s without.

Excluding them turns 43 % of that slice's mutants into no-coverage, which is the shape this document
warns about under § Exceptions — an exclusion that protects a score by not looking. So the slice they
alone cover (`:81-91`, the postgres-js driver wiring) was run **with** them:

| status | count |
|---|---|
| killed | 1 |
| timeout | 6 |
| survived | 5 |
| no-coverage | 3 |

Fifteen mutants, 3m19s, one kill. The covered score of 58.33 is seven twelfths timeout, and **a
mutant that hangs the connection times out whether or not the test asserts anything** — covered MSI
counts a timeout as caught, so including these tests inflates the number rather than earning it.
Reporting the same mutants as no-coverage says the true thing: no fast test reaches that code.

So the general rule holds — measure before excluding — and the measurement is what licensed the
exclusion here, on evidence about detection rather than about speed. The 341 no-coverage mutants in
the widened run, 295 of them in `setup-orm-env.js`, are the standing record of what is still unreached.

The exclusion lives in `packages/orm/vitest.stryker.config.mjs`, which Stryker alone reads; `pnpm
test` still runs both files. `KIWA_MODE=real` is the repo's existing gate for container-backed tests
and these two never adopted it, which is why they ran unconditionally in the first place.

`tests/release-smoke/tests/mutation-gate-coverage.test.ts` holds the other half of that sentence in
`FULLY_WIDENED`, which has to be exactly the packages with nothing left outside `mutate`. A widened
package that lets a file back out fails it, and so does a widening that lands without adding its
name — #1965 added the second direction, having found that the first would have passed with
`security` left off.

`node scripts/mutation-scope-report.mjs --list <package>` prints that package's implementation files
outside `mutate`, largest first. That list is the input for the checklist below — the numbers in the
table above are the same output, summed.

`@kiwa-lab/security` joined the plan in #1951. It had carried a Stryker config since v1.27 that
nothing scored — no `PACKAGE_TIER` entry, no `PKG_DIRS` entry, and absent from root `test:mutation`,
so the run never happened and no threshold would have read it if it had. Scored at last, its nine
policy engines came in at 84.90 % covered MSI over 1,203 mutants. Two runs landed 84.31 and 84.90 —
the covered score counts timeouts as killed, and the timeout count moves with machine load, so read
the last digit as noise.

#1965 then widened it to all 22 implementation files: 2,539 mutants at 87.13 % covered MSI, up from
86.16 on the same day's narrower run. The v0.2 semantics layer it added scores above the v0.1 policy
engines it joined, so the average rose.

Rising is not the rare case § Expect scores to drop is written against. Of the nine packages #1963
widened, `component` went 67.78 → 82.99, `nextjs` 80 → 83.95, and `data` 86.93 → 88.13. That section
is about how to read a *fall*, and the reason it needs saying is that a fall looks like damage while
a rise does not. Neither direction means anything on its own: both are the average of a different
set of files, and only the scope being fixed makes two numbers comparable at all.

`tests/release-smoke/tests/mutation-gate-coverage.test.ts` keeps that from recurring: every
`packages/*/stryker.config.mjs` must have a tier, a directory, and a place in the run, or the check
fails and names the package.

### What a widening PR has to show

The scope grows and the score moves, so both belong in the PR body:

- the files added to `mutate`, and for anything left out, which of the two out-of-scope shapes it is
- the score before and after, from an actual run
- the run time before and after — a package's scope can grow several times over (6x across the repo,
  more for the ones starting near 3%), so the number informs whether it needs `concurrency` tuning
- if the score landed below the tier, the tests written to bring it back, or the explicit plan to
  widen in further steps within the same Issue

A PR that only edits `mutate` and reports a passing gate has not shown the second half of the work.

### When the widened scope drops below the tier

**Write tests. Do not lower the bar.** The score fell because the newly visible code is less well
tested than the code that was already in scope — that is the finding, not an accident to be
configured away.

If reaching the tier in one PR is impractical, widen in steps *within that package's Issue*: add a
subset of files, cover them, land it, repeat. The scope only ever grows, and the threshold stays at
the tier default throughout. A temporary override with a "raise it back later" note is exactly the
shape #1941 removed, and it survived four milestones before anyone returned to it.

## Baseline snapshots

Each package writes a per-package baseline JSON to `.mutation-baseline/<pkg>.json` (folder is tracked). The baseline is the last known green mutation report — kill-rate + surviving-mutant list + timestamp. Baseline refresh happens in-PR when kill-rate improves, and is written by the same PR that raises test coverage — never as a standalone commit.

**Nothing compares against it automatically.** The baselines are read by people, through the `git diff` a refresh produces; `pnpm test:mutation` runs Stryker and `check-mutation-gates.mjs` scores the fresh report against the tier threshold, and neither opens the baseline. This doc claimed the comparison happened until #1951 checked. Whether a comparator should exist is open — a score may legitimately fall when a package widens its `mutate` (§ Expect scores to drop), so a monotonic baseline floor would reject the work this plan asks for.

## 12-axis release gate integration (v1.27-4)

v1.27-4 promotes the mutation kill rate to a first-class 12th axis in the release gate.
`@kiwa-lab/quality-metrics` exposes three new symbols so downstream apps can opt in:

- `DEFAULT_MUTATION_TIER_THRESHOLDS` — the SSOT table (`core: 80 / framework: 70 / saas: 65 / test-type: 60`), a `Readonly<Record<MutationTier, number>>` that mirrors the tier `high` column above.
- `resolveMutationTier(label)` — normalises the verbal tier label (`Core` / `Framework` / `SaaS` / `Test type`) written in `.mutation-baseline/*.json` into the machine `MutationTier` enum (`core` / `framework` / `saas` / `test-type`). Case-insensitive, trim-tolerant.
- `assertMutationTier({ metric, tier, threshold? })` — asserts `metric.killRate >= threshold ?? DEFAULT_MUTATION_TIER_THRESHOLDS[tier]`. Zero-mutation metrics throw (`no mutation signal`) so an empty test suite never silently passes.

`evaluateReleaseGate` gains an optional third parameter:

```ts
evaluateReleaseGate(report, thresholdOverrides, {
  mutationTier: 'saas',          // required to enable the 12th axis
  mutationTierThreshold: 60,     // optional looser override; see § Overrides for who has one
});
```

When `mutationTier` is omitted the verdict stays at 7 (non-AI-LLM) or 11 (AI-LLM) axes for backward compatibility. When present the verdict count grows by 1 (`axesEvaluated` becomes 8 or 12) and any threshold miss surfaces as a `mutation.tier` blocker alongside the legacy `mutation.killRate` axis (both axes coexist so v1.11 consumers keep the old shape).

The three v1.26 dogfood apps (`dogfood-postgres-cdc-outbox-app`, `dogfood-mysql-rls-tenant-app`, `dogfood-vector-search-app`) pass `mutationTier: 'saas'` through their `runFidelityHarness` input so their `evaluateReleaseGate` invocation exercises the 12-axis path. `dogfood-storybook-design-system` (component, `test-type` tier) exposes the same optional field so a v1.27-5 follow-up can flip it on without another wire change.

`scripts/check-mutation-gates.mjs` follows the same shape: the top of the file exports `PACKAGE_TIER`, `TIER_THRESHOLD`, and `thresholdFor()` so tests and neighbouring tooling read the exact same tier map instead of re-deriving it.

## Related

- `docs/quality/release-gate.md` — 12-axis release gate (mutation axis has its own bar of `≥ 60 %` used at the release-gate layer, above per-package `break`; the tier-aware axis added in v1.27-4 is the 12th).
- `docs/quality/perf-thresholds.md` — perf p95 SSOT (three-rationale model this file is patterned after).
- `packages/quality-metrics/src/gate.ts` — `DEFAULT_MUTATION_TIER_THRESHOLDS`, `assertMutationTier`, `resolveMutationTier`, and the 12-axis extension of `evaluateReleaseGate`.
- `packages/*/stryker.config.mjs` — per-package configs.
- `scripts/check-mutation-gates.mjs` — CI gate; `PACKAGE_TIER` / `TIER_THRESHOLD` / `thresholdFor()` exports.
- `scripts/mutation-scope-report.mjs` — the classification above, run over every gate package; `--list <package>` for one.
- `scripts/run-mutation.mjs` — what root `test:mutation` runs. It derives the package list from `PACKAGE_TIER`, so the run and the scoring cannot name different sets (#1951). `node scripts/run-mutation.mjs <pkg>` runs one.
- `scripts/package-mutation.mjs` — what each package's `test:mutation` runs: remove `.vitest-dist`, compile, then Stryker. A bare `stryker run` scored a gitignored build directory that a clean checkout does not have and a stale workspace fills with old JavaScript (#1955).
