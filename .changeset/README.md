# Changesets

Changesets は、monorepo で package ごとの変更内容と version 更新を管理するための仕組みです。
このリポジトリでは、CHANGELOG の更新と release 用 PR の作成を自動化するために使います。

## 使い方

1. 変更した package がある PR では、作業ブランチで `pnpm changeset` を実行します。
2. 質問に答えて `.changeset/*.md` を作成し、コード変更と一緒にコミットします。
3. PR を `main` に merge すると、`release.yml` が pending changeset を集計します。
4. Changesets bot が `chore(release): version packages` PR を作成し、merge 後に publish が走ります。

## 補足

- version bump は changeset file の内容から自動計算されます。
- package ごとの `CHANGELOG.md` も version PR で自動更新されます。
- publish 対象外の workspace は `.changeset/config.json` の `ignore` で除外します。
- 今回の例では `examples-basic-connect` を release 対象に含めません。

## ローカルで使うコマンド

```bash
pnpm changeset
pnpm changeset status
pnpm version-packages
```

## 詳細

より詳しい運用ルールや FAQ は Changesets 公式 README を参照してください。

- https://github.com/changesets/changesets/tree/main/packages/cli

## 必要な GitHub 設定

`release.yml` が `chore(release): version packages` PR を自動生成するには、 `Settings → Actions → General → Workflow permissions` の `Allow GitHub Actions to create and approve pull requests` を有効にする必要があります。 無効のままだと changesets/action が version PR の作成 step で `GitHub Actions is not permitted to create or approve pull requests` という HttpError で失敗します。
