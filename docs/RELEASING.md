# Releasing dapp-e2e

dapp-e2e の release は Changesets と GitHub Actions で管理します。
このリポジトリでは version 更新、CHANGELOG 更新、npm publish を main merge 後の workflow に寄せています。
ローカルでは changeset file の追加までを担当し、version bump と publish 実行は `release.yml` に委譲します。

## Changesets フロー

1. 変更を加えた PR で `pnpm changeset` を実行し、`.changeset/{name}.md` を追加します。
2. PR を `main` に merge します。
3. `release.yml` が起動し、Changesets bot が `chore(release): version packages` PR を作成します。
4. version PR には pending changeset を集計した package version bump と `CHANGELOG.md` 更新が含まれます。
5. version PR を merge すると `pnpm release` が走り、`pnpm publish -r --access public --provenance` で npm に公開されます。

PR 作成前に確認するローカルコマンドは次の 3 つです。

```bash
pnpm changeset
pnpm typecheck
pnpm test
```

`pnpm version-packages` は通常ローカルでは使わず、Changesets bot が作る version PR で差分を確認します。
手動で version bump を進めるのは、release 運用を一時的に切り替える場合だけにしてください。

## NPM_TOKEN 設定

npm 側で Automation Token を発行し、GitHub の `Settings > Secrets and variables > Actions` に `NPM_TOKEN` という名前で登録します。release workflow はこの secret を使って publish するため、公開前に必ず設定してください。
トークンは publish 専用の Automation Token を使い、個人アカウントの通常 token は使わない方針です。

## provenance について

`--provenance` を付けて publish すると、GitHub Actions の OIDC token を使って sigstore provenance が生成されます。npmjs.com の package ページでは、source repository や build workflow への紐付け情報を確認できます。
この設定を有効にするため、release workflow では `permissions.id-token: write` を必ず付与しています。

## 失敗時の見方

- version PR が作成されない場合は、`main` に pending changeset が存在するかを確認します。
- publish が止まる場合は、`NPM_TOKEN` secret と workflow 権限を確認します。
- tarball 内容を確認したい場合は、各 package で `npm pack --dry-run` を実行します。

## SHA pin 運用

dependabot は github-actions ecosystem を daily 監視し、`groups` 設定で全 action を 1 PR にまとめて提案します。PR は週 1 回まとめて merge する運用で、特に `changesets/action` の minor version up は内部 behavior 変化リスクがあるため手動 review を推奨します。
SHA pin により mutable major tag (例 `@v4`) 経由の supply chain 攻撃を防ぎ、各 action の更新を意図的に行えます。

routine group (`actions/*` + `pnpm/*`) も major up を手動レビュー運用に揃え、`dependabot.yml` の `ignore` で `version-update:semver-major` を弾く設定としています。
自動 PR は minor / patch のみに限定し、major up が必要な場合は手動レビューのうえで SHA pin 更新 PR を起票します (SHA 検証手順は `gh api repos/{owner}/{repo}/git/refs/tags/v{version}` → `gh api commits/{SHA}` の 2 段確認です)。
これは PR #19 で actions/checkout v4 → v6 を含む 3 アクション 2 段 major bump が自動 PR で来た経験から、routine group も `changesets/action` と同じ手動レビュー運用に揃える必要があると分かったためです。

## release.yml の CI gate

`release.yml` は main push 直接トリガで起動しますが、`changesets/action` 起動前に install → typecheck → test (core + cli) → build → consumer typecheck の 5 step を実行する CI gate を持ちます。test fail で `changesets/action` は起動せず、publish も行われません。
`release.yml` は node 20 のみで動作するため、CI matrix (node 20/22) との test surface 差異を埋めるために main branch protection で CI workflow を required check に設定し、CI fail の commit が main に push されないようにする運用とします。
将来 `workflow_run` trigger (CI workflow 完了を gate) への切替も検討余地ですが、現状は同一 workflow 内 test 再走 (案 B) + branch protection でシンプルかつ確実な gate を実装しています。

## 関連リンク

- [Changesets 公式](https://github.com/changesets/changesets)
- [changesets/action](https://github.com/changesets/action)
- [npm provenance docs](https://docs.npmjs.com/generating-provenance-statements)
