<p align="center">
  <img src="https://raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-logo.png" alt="kiwa ロゴ" width="160" />
</p>

# @kiwa-test/cli

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](./README.ja.md)

[kiwa](https://github.com/cardene777/kiwa) の CLI、 `init` / `doctor` の 2 コマンドを提供。

`@kiwa-test/cli` は `@kiwa-test/core` を使う Playwright ベース dApp E2E test を scaffold し、 ローカル環境の前提条件 check も行う。

<p align="center">
  <img src="https://raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-promo-ja.gif" alt="kiwa 概要 — contract test、dApp e2e test、手書きの 3 経路 (本 CLI は dApp e2e 経路を scaffold)" width="640" />
  <br />
  <sub><a href="https://github.com/cardene777/kiwa">kiwa</a> 全体の概要動画 — 本 CLI は動画中の dApp e2e セットアップ部分を scaffold する。<a href="https://github.com/cardene777/kiwa/blob/main/assets/kiwa-promo-ja.mp4">▶ フル画質 MP4</a>。</sub>
</p>

## インストール

```bash
pnpm add -D @kiwa-test/cli

# install せずに使うことも可能
pnpm dlx @kiwa-test/cli init
pnpm dlx @kiwa-test/cli doctor
```

### Bonus — Claude Code plugin

Claude Code を併用するなら、 kiwa の skill chain を **1 コマンドで導入** できる。 `/kiwa:kiwa-design` / `/kiwa:kiwa-play` / `/kiwa:kiwa-forge` / `/kiwa:kiwa-hardhat` / `/kiwa:kiwa-vitest` / `/kiwa:kiwa-api` / `/kiwa:kiwa-review` が任意の dApp project から呼び出せる。 (`/kiwa:kiwa-test` 一括 orchestrator は `examples/` 依存のため kiwa monorepo 専用、 plugin 経路では起動不可)

```bash
# Claude Code 内で:
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

> plugin 提供 skill は plugin 名で namespace される (`/kiwa:kiwa-design`、 `/kiwa-design` ではない)。 詳細は [kiwa README — Option A](https://github.com/cardene777/kiwa/blob/main/README.ja.md#option-a-claude-code-plugin-claude-利用時の推奨) 参照。

## コマンド

### `kiwa init`

既存 dApp project に Playwright E2E file を scaffold し、 生成された test を `@kiwa-test/core` と連携させる。

```bash
pnpm dlx @kiwa-test/cli init
# 生成 — e2e/connect.spec.ts + playwright.config.ts
# package.json も update、 tsconfig.json は無ければ作成
```

利用可能 flag — `--force` / `--testDir` / `--config-suffix` / `--script-key` / `--with-deploy`。

### `kiwa doctor`

現環境で `anvil` binary が使えるか check。

```bash
pnpm dlx @kiwa-test/cli doctor
```

## 関連

- [GitHub repository](https://github.com/cardene777/kiwa)
- [Full documentation (ja)](https://github.com/cardene777/kiwa/tree/main/docs/ja)
- [@kiwa-test/core](https://www.npmjs.com/package/@kiwa-test/core) — runtime fixture

## 作者

[cardene](https://github.com/cardene777) — [GitHub](https://github.com/cardene777) / [X](https://x.com/cardene777)

## License

MIT
