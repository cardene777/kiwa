# Outstanding CRITICAL and HIGH advisories

A snapshot of what `osv-scanner` reports against this repository's lockfiles at CRITICAL
and HIGH severity, and why each open item is still open.

- Taken 2026-08-01 with osv-scanner 2.3.5
- Command: `osv-scanner scan source --recursive . --format json`
- At that point: 1 CRITICAL, 18 HIGH

MODERATE and LOW are out of scope here. They exist (53 and 12 at the same reading,
including three against `hono` and one against `tar`) and are handled by the weekly
audit, not by this document.

## What consumers are exposed to

No published `@kiwa-lab/*` package lists an affected version under `dependencies`.

`peerDependencies` is a different matter. Across the published packages:

| Peer | Required by | Optional in |
|---|---|---|
| `vitest` (`^2`) | 28 packages | 1 package |
| `@angular/core` | — | 1 (`@kiwa-lab/ui`) |
| `drizzle-orm` | — | 1 (`@kiwa-lab/orm`) |
| `kysely` | — | 1 (`@kiwa-lab/orm`) |

The 28 required ranges matter: a consumer following `"vitest": "^2"` installs a version
carrying a CRITICAL advisory. The optional ones do not force an install.

The reachability argument below — that this repository never starts the Vitest UI — does
not carry over, because a consumer's own test setup decides that. Closing it means moving
the peer range on all 29 packages, which is the migration tracked in #1725.

## Closed by pinning transitive resolutions

`pnpm-workspace.yaml` pins these under `overrides`. They arrive through something else,
so adding them to `dependencies` would declare a dependency this repository does not use.

Versions are exact rather than ranges. A range interacts badly with `minimumReleaseAge`:
"the newest version matching the range is too young" stops the install outright. An exact
version uses the one that was actually assessed, and a new advisory has to be looked at
deliberately.

| Package | Pinned to | Advisory |
|---|---|---|
| `@auth/core` | 0.41.3 | `GHSA-7rqj-j65f-68wh` |
| `next-auth` | 5.0.0-beta.32 | `GHSA-7rqj-j65f-68wh`, `GHSA-8fpg-xm3f-6cx3` |
| `tar` | 7.5.19 | `GHSA-23hp-3jrh-7fpw` |
| `adm-zip`, `axios`, `fast-uri`, `form-data`, `immutable`, `js-yaml`, `lodash`, `postcss`, `serialize-javascript`, `tmp`, `undici`, `ws` | see the file | HIGH, one or two each |
| `sharp` | 0.35.0 | `GHSA-f88m-g3jw-g9cj` |
| `svgo` | 4.0.2 | `GHSA-2p49-hgcm-8545` |
| `@opentelemetry/propagator-jaeger` | 2.9.0 | `GHSA-45rx-2jwx-cxfr` |
| `hono` | 4.12.25 | `GHSA-88fw-hqm2-52qc` |
| `kysely` | 0.28.17 | three SQL injection advisories |

Two entries need a note.

`hono` is a declared dependency, not a transitive one. Two examples ask for `^4.6.0`, so
the pinned version stays inside what they declared.

`sharp` 0.35 requires Node `>=20.9.0`, above the repository's previous `>=20`. The root
`engines` moved to match, so the declared floor and the installable floor agree.

## Closed by upgrading declared dependencies

`golang.org/x/crypto` moved from 0.48.0 to 0.53.0 across the five Go modules, closing
seven CRITICAL advisories (SSH authorisation bypass, missing key constraints, agent
constraint omission, `VerifiedPublicKeyCallback` permissions, FIDO/U2F presence checks,
an infinite loop on large channels, and a server deadlock). No CRITICAL or HIGH advisory
remains on the Go side.

That paragraph records the 2026-08-01 reading. #1864 removed the five Go modules
afterwards, so there is no Go side left to scan and the next reading will not carry the
section at all. It stays because deleting it would change what the snapshot says was
found.

## Open

### `vitest` 2.1.9 — CRITICAL, 1 advisory

`GHSA-5xrq-8626-4rwp` (arbitrary file read and execution through the Vitest UI server) is
patched in 3.2.6. The 2.1 line ends at 2.1.9, so no patch release closes it.

71 packages declare `"vitest": "^2"`, and 29 published packages carry it as a peer, so
raising the root alone changes nothing. Tracked separately (#1725) because it is a 2 → 3
migration across the whole repository.

This repository only runs `vitest run` and never starts the UI server. That does not
extend to consumers, as noted above.

### `next` 14.2.35 / 15.5.19 — 8 advisories

Fixed in 15.5.21. Nineteen packages declare `next`, most of them examples that also carry
Playwright suites, so the upgrade needs a build and an end-to-end run per example. The two
major lines in use (14 and 15) have to be consolidated as part of it.

### `astro` 5.18.2 — 2 advisories

Fixed in 6.3.3, a major upgrade. One example depends on it.

### `brace-expansion` 1.1.16 — 1 advisory

Accepted for now, and not because of effort. Pinning it breaks the build.

`minimatch@10` imports it as `import { expand } from 'brace-expansion'`, while the 2.x
line exports the function directly. Overriding everything to 2.1.3 produces
`Named export 'expand' not found` and `(0 , brace_expansion_1.expand) is not a function`;
`packages/lean`'s coverage run fails outright, since `glob@13` and `test-exclude@7` both
pull `minimatch@10`. Ordinary test runs do not, which is why the whole suite passed while
this was broken.

Per-major override selectors (`brace-expansion@^1`, `@1`, parent-scoped) were not
recognised, and the versions they resolved to fell inside `minimumReleaseAge`, stopping
the install.

The fixed 5.x line is three days old at this reading, so it sits inside the waiting
period. Adding it to `minimumReleaseAgeExclude` would work, and would also punch a hole in
the exact mechanism that period exists for. Left alone, it resolves itself once the
version ages out.

### `drizzle-orm` 0.36.4 — 1 advisory

Fixed in 0.45.2. `packages/orm` declares `>=0.36` as an optional peer and `^0.36.0` as a
development dependency, so the peer range published to users changes with it.

### `@angular/core` 19.2.25 — 1 advisory

Fixed in 20.3.25. `packages/ui` declares it as an optional peer (`^17 || ^18 || ^19`), so
closing this widens the range published to users.

### `turbo-stream` 2.4.1 — 1 advisory

Fixed in 3.0.0, a major upgrade. Reached only through `@remix-run/react` and
`@remix-run/server-runtime` at fixed versions; pinning across a major boundary would
likely break them.

### `vite` 5.4.21 — 1 advisory

Fixed in 6.4.3, a major upgrade. Three examples declare `^5.4.x`, so the pin has to move
together with their declarations.

## A note on pinning across majors

`kysely` and `brace-expansion` pulled in opposite directions, and the difference is worth
keeping in mind before adding an override.

`kysely` had been pinned at 0.27.6 with the stated reason that 0.28 breaks types in
combination with `drizzle-orm`. Measured: 249 packages typecheck clean, `packages/orm`
passes 581 tests, and both Kysely examples pass. The reason did not hold, and three HIGH
advisories had been left open on the strength of it.

`brace-expansion` went the other way. The override looked routine and passed the full
suite, because nothing in the ordinary test path exercises it — only coverage does.

An override changes which API a consumer receives. When the majors involved differ in
their export shape, "it installed and the tests passed" is not enough. Run coverage too.

## Keeping this current

Re-run the scanner and compare against this snapshot:

```
osv-scanner scan source --recursive . --format json
```

Counts drift as advisories are published, so a difference is expected. What should stay
true is that every CRITICAL and HIGH either appears in Open with a reason, or is absent
from the scan. If something appears in neither, this document is stale.
