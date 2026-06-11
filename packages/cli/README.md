<p align="center">
  <img src="https://raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-logo.png" alt="kiwa logo" width="160" />
</p>

# @kiwa-test/cli

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](./README.ja.md)

CLI for [kiwa](https://github.com/cardene777/kiwa) with `init` and `doctor` commands.

`@kiwa-test/cli` scaffolds Playwright-based dApp E2E tests that use `@kiwa-test/core`, and provides a quick prerequisite check for local setup.

<p align="center">
  <img src="https://raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-promo-en.gif" alt="kiwa overview — contract test, dApp e2e test, and manual write paths (this CLI scaffolds the dApp e2e path)" width="640" />
  <br />
  <sub>Full <a href="https://github.com/cardene777/kiwa">kiwa</a> overview — this CLI scaffolds the dApp e2e setup shown in the video. <a href="https://github.com/cardene777/kiwa/blob/main/assets/kiwa-promo-en.mp4">▶ Full-quality MP4</a>.</sub>
</p>

## Installation

```bash
pnpm add -D @kiwa-test/cli

# or use it without installing
pnpm dlx @kiwa-test/cli init
pnpm dlx @kiwa-test/cli doctor
```

### Bonus — Claude Code plugin

Use kiwa with Claude Code? Install the matching skill chain in **one command** — `/kiwa-test`, `/kiwa-design`, `/kiwa-play` etc. become available across any dApp project.

```bash
# In Claude Code:
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
```

See [kiwa README — Option A](https://github.com/cardene777/kiwa#option-a-claude-code-plugin-recommended-for-claude-users) for the full skill list.

## Commands

### `kiwa init`

Scaffolds Playwright E2E files into an existing dApp project and wires the generated test to `@kiwa-test/core`.

```bash
pnpm dlx @kiwa-test/cli init
# creates: e2e/connect.spec.ts + playwright.config.ts
# also updates package.json and creates tsconfig.json if missing
```

Available flags include `--force`, `--testDir`, `--config-suffix`, `--script-key`, and `--with-deploy`.

### `kiwa doctor`

Checks that the required `anvil` binary is available in the current environment.

```bash
pnpm dlx @kiwa-test/cli doctor
```

## Related

- [GitHub repository](https://github.com/cardene777/kiwa)
- [Full documentation](https://github.com/cardene777/kiwa/tree/main/docs/en)
- [@kiwa-test/core](https://www.npmjs.com/package/@kiwa-test/core) - runtime fixture

## Author

[cardene](https://github.com/cardene777) — [GitHub](https://github.com/cardene777) / [X](https://x.com/cardene777)

## License

MIT
