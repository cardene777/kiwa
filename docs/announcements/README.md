# Announcement archive

Drafts and published copies of every public-facing release announcement live under `docs/announcements/<version>/`. They give a single source of truth for what was said about each release so we can keep messaging consistent across x.com, Zenn, and GitHub Discussions.

| Version | Date | Files | Notes |
|---|---|---|---|
| v0.5 (polyglot rewrite) | 2026-06-26 | [`v0.5/`](./v0.5) — `x-thread-ja.md` / `x-thread-en.md` / `zenn-article.md` / `gh-discussions-announcement.md` | Rewritten after PR #454 + #456 shifted the project positioning to "polyglot test toolchain". Initial drafts (mutation gate + 8 component adapters voice) were superseded; this revision leads with the **scattered test stack** problem and **polyglot (TS / Python / Solidity)** solution. |
| v1.2 (framework + ORM milestone) | 2026-06-30 | [`v1.2/`](./v1.2) — `x-thread-ja.md` / `x-thread-en.md` / `zenn-article.md` / `gh-discussions-announcement.md` | v1.2 milestone (11/11 Issue resolved) draft. Leads with **20 npm packages / 9 server-side framework adapters / 9 ORM matrix / 3 runtimes (Node/Bun/Deno) + Edge / 5 full PoC examples** delta from v0.5. v1.3 scope (A: ORM matrix completion / B: new layers / D: framework deepening) is left as open prompt for the discussion board. |

If you want to mirror an announcement on a new channel (Mastodon, Bluesky, dev.to, etc.), copy the closest match from the latest `vX.Y/` and adapt the voice — every existing file is written for `@cardene777` first-person voice.
