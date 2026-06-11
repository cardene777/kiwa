<p align="center">
  <img src="https://raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-logo.png" alt="kiwa ロゴ" width="160" />
</p>

# @kiwa-test/cli

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](./README.ja.md)

<p align="center">
  <img src="https://raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-promo-ja.gif" alt="kiwa 65 秒概要" width="720" />
</p>

[kiwa](https://github.com/cardene777/kiwa) の CLI、 `init` / `doctor` の 2 コマンドを提供。

`@kiwa-test/cli` は `@kiwa-test/core` を使う Playwright ベース dApp E2E test を scaffold し、 ローカル環境の前提条件 check も行う。

## インストール

```bash
pnpm add -D @kiwa-test/cli

# install せずに使うことも可能
pnpm dlx @kiwa-test/cli init
pnpm dlx @kiwa-test/cli doctor
```

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
