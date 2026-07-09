# Changelog

kiwa uses per-package Changelogs plus per-milestone documentation instead of a
monolithic root changelog. This file is the pointer to those authoritative
sources; do not paste release notes here.

## Where to find changes

- **Per-package changelogs** — `packages/*/CHANGELOG.md` (npm-published packages
  under `@kiwa-lab/*`)
- **Migration guides** — [`docs/migrations/`](./docs/migrations) (`vX.Y-to-vX.Z.md`,
  one file per milestone since v1.32)
- **Announcements** — [`docs/announcements/`](./docs/announcements)
  (`vX.Y/gh-discussions-announcement.md` per released milestone)
- **Release-smoke tests** — [`tests/release-smoke/tests/`](./tests/release-smoke/tests)
  (`vX-Y-publish.test.ts`, one file per milestone; a good way to see exactly
  which package versions were pinned at release)
- **Concepts** — [`docs/concepts/`](./docs/concepts) (long-form design SSOTs
  introduced by milestones)
- **MANIFESTO** — [`MANIFESTO.md`](./MANIFESTO.md) (project philosophy and the
  3-axis fusion that motivates milestone direction)

## Milestone index

The most recent milestone entries at a glance. Follow the migration links for
the full change list.

- **v2.17** — `/spec-kit` skill on the plugin marketplace + npm/skill role
  split ([migration](./docs/migrations/v2.16-to-v2.17.md))
- **v2.16** — MANIFESTO + `@kiwa-lab/spec-kit` v0.1 = 3-axis fusion complete
  ([migration](./docs/migrations/v2.15-to-v2.16.md))
- **v2.15** — `@kiwa-lab/lean` v0.2 verify layer + Lean toolchain integration
  ([migration](./docs/migrations/v2.14-to-v2.15.md))
- **v2.14** — `@kiwa-lab/lean` v0.1 Lean 4 spec generator
  ([migration](./docs/migrations/v2.13-to-v2.14.md))
- **v2.13** — `@kiwa/*` → `@kiwa-lab/*` rename across 42 packages
  ([migration](./docs/migrations/v2.12-to-v2.13.md))
- **v2.8 – v2.12** — backend systems layer depth-5 pattern completion
  (ORM / Auth / Cache / Queue / cli-test)

Older milestones follow the same convention; see `docs/migrations/` for the
full history.
