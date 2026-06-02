---
"@dapp-e2e/core": minor
"@dapp-e2e/cli": minor
---

Issue #4 — Changesets + GitHub Actions CI (node 20/22 matrix) + npm publish provenance による v0.1.0 publish 基盤を確立。
各 package に publishConfig (access public + provenance true) + repository + license MIT + keywords を追加し、`.npmignore` と `files: ["dist"]` で公開 tarball を dist のみに限定。
本 changeset は次回 release.yml 起動時の version PR に集約され、v0.0.0 → v0.1.0 bump の起点となる (実 publish は NPM_TOKEN 配布後)。
