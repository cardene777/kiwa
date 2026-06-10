# Releasing kiwa (日本語)

> [🇬🇧 English](./RELEASING.md) • [🇯🇵 日本語](./RELEASING.ja.md)

kiwa の release は Changesets と GitHub Actions で管理します。
このリポジトリでは version 更新、CHANGELOG 更新、npm publish を main merge 後の workflow に寄せています。
ローカルでは changeset file の追加までを担当し、version bump と publish 実行は `release.yml` に委譲します。

## Changesets フロー

1. 変更を加えた PR で `pnpm changeset` を実行し、`.changeset/{name}.md` を追加します。
2. PR を `main` に merge します。
3. `release.yml` が起動し、Changesets bot が `chore(release): version packages` PR を作成します。
4. version PR には pending changeset を集計した package version bump と `CHANGELOG.md` 更新が含まれます。
5. version PR を merge すると `pnpm release` が走り、`pnpm publish -r --access public --provenance` で npm に公開されます。

PR 作成前に、changeset が必要な変更では `pnpm changeset` を実行します。
そのうえでローカル検証として次の 3 コマンドを必ず通します。

```bash
pnpm typecheck
pnpm test
pnpm build
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
ローカルテスト主体運用のため、本リポジトリでは GitHub Actions の PR 用 CI workflow は保持しません。PR 提出前に開発者がローカルで `pnpm typecheck && pnpm test && pnpm build` を実行し、結果を PR 本文に記載する運用とします。
publish 経路の test gate は `release.yml` 内部の test 再走で担保され、複数 Node version の同時検証は廃止しますが、release.yml が publish 前に typecheck / test / build を走らせるため動作確認は維持されます。
main branch protection の required status check は本リポジトリでは設定しません (ci.yml 廃止により `test (20)` `test (22)` の status が存在しないため required にできず、設定すると PR merge が deadlock します)。代わりに「PR 経由必須」のみを branch protection で強制し、必要に応じて signed commits など review 経路の物理強制を追加します。test gate は開発者ローカル + `release.yml` 内 5 step の二段で担保する運用とします。GitGuardian Security Checks や CodeRabbit などの third-party app status は表示されますが、required check には含めません。

## v0.1.0 初回 publish 手順

初回 publish (まだ npmjs.com に package が存在しない状態) で実行する手順を整理します。
2 回目以降は通常の Changesets フローのみで自動化されますが、初回は NPM_TOKEN 配布と Trusted Publisher 設定がユーザー手作業として必要です。

### Phase 1 — npm 側準備 (ユーザー作業)

1. **npm account の 2FA 設定** — https://www.npmjs.com/settings/{user}/profile で **Auth only** または **Auth and writes** を選択。Automation Token を使う場合は Auth only でも publish 可能です。
2. **scope の確保 (任意)** — `@kiwa-test/core` `@kiwa-test/cli` は `@kiwa-test` npm organization で公開済 (https://www.npmjs.com/org/kiwa-test)。 fork して別 scope で公開したい場合は `https://www.npmjs.com/org/create` で独自 org を作成してください。
3. **Granular Access Token を発行** — Settings > Access Tokens > Generate New Token > Granular Access Token。
   - name: `kiwa-publish`
   - expiration: 1 year (推奨)
   - packages: `@kiwa-test/*`
   - permissions: **Read and write** (publish 用)
   - **Bypass two-factor authentication (2FA): ON** (CI publish 用に必須)
   - 発行直後の token は 1 度だけ表示されるためコピー必須

### Phase 2 — GitHub 側準備 (ユーザー作業)

1. **NPM_TOKEN secret 登録** — https://github.com/cardene777/kiwa/settings/secrets/actions で `NPM_TOKEN` という名前で Phase 1.3 のトークンを登録。
2. **Workflow permissions** — Settings > Actions > General > **Read and write permissions** + Allow GitHub Actions to create and approve pull requests を有効化。これにより `release.yml` が version PR を自動作成可能になります。
3. **Trusted Publishers (provenance 強化)** — npm の Trusted Publisher を設定すると Token 不要で publish 可能になります。Settings > Packages > Trusted Publishers で repo + workflow を指定。`release.yml` で `permissions.id-token: write` を維持してください。

### Phase 3 — release workflow 起動 (自動経路)

1. `.changeset/` 配下に pending changeset を作成 (`pnpm changeset`)。
2. main に merge すると `release.yml` が起動し `chore(release): version packages` PR が自動作成される。
3. version PR を merge → `release.yml` が再起動 → `pnpm release` で npm publish 実行。
4. provenance が有効なため npmjs.com の package page に source repository / build workflow へのリンクが表示される。

### Phase 4 — publish 後確認

1. **npmjs.com で表示確認** — `https://www.npmjs.com/package/@kiwa-test/core` / `@kiwa-test/cli` で README / provenance badge / version `0.1.0` を確認。
2. **smoke test** — 別の dApp project で `pnpm dlx @kiwa-test/cli init` を実行し、生成された `e2e/connect.spec.ts` が PASS することを確認:

   ~~~bash
   mkdir /tmp/kiwa-smoke && cd /tmp/kiwa-smoke
   pnpm init
   pnpm dlx @kiwa-test/cli init
   pnpm install
   pnpm exec playwright install chromium
   pnpm exec playwright test
   ~~~

3. **完了報告** — roadmap Issue へ trace を残す。

### 既知のリスク

| リスク | 対処 |
|---|---|
| 初回 publish で package name が npm 上で reject | scope 変更 Issue を別途起票 |
| NPM_TOKEN が Read-only で publish が auth fail | Token 再発行 (Phase 1.3 を Read and write に修正) |
| GitHub Actions workflow permissions が Read-only で version PR 作成 fail | Phase 2.2 を再確認 |
| provenance が sigstore 側で fail | Trusted Publisher 設定不在、Phase 2.3 を追加 |
| changesets/action が pnpm v10 lockfile format で互換性 issue | `release.yml` の pnpm version を 10.33.2 pin で対応済 |

## 関連リンク

- [Changesets 公式](https://github.com/changesets/changesets)
- [changesets/action](https://github.com/changesets/action)
- [npm provenance docs](https://docs.npmjs.com/generating-provenance-statements)
- [npm Trusted Publishers](https://docs.npmjs.com/trusted-publishers)
- [npm Granular Access Tokens](https://docs.npmjs.com/about-access-tokens#about-granular-access-tokens)
