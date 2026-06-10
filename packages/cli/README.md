# @kiwa/cli

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](./README.ja.md)

CLI for [kiwa](https://github.com/cardene777/kiwa) with `init` and `doctor` commands.

`@kiwa/cli` scaffolds Playwright-based dApp E2E tests that use `@kiwa/core`, and provides a quick prerequisite check for local setup.

## Installation

```bash
pnpm add -D @kiwa/cli

# or use it without installing
pnpm dlx @kiwa/cli init
pnpm dlx @kiwa/cli doctor
```

## Commands

### `kiwa init`

Scaffolds Playwright E2E files into an existing dApp project and wires the generated test to `@kiwa/core`.

```bash
pnpm dlx @kiwa/cli init
# creates: e2e/connect.spec.ts + playwright.config.ts
# also updates package.json and creates tsconfig.json if missing
```

Available flags include `--force`, `--testDir`, `--config-suffix`, `--script-key`, and `--with-deploy`.

### `kiwa doctor`

Checks that the required `anvil` binary is available in the current environment.

```bash
pnpm dlx @kiwa/cli doctor
```

## Related

- [GitHub repository](https://github.com/cardene777/kiwa)
- [Full documentation](https://github.com/cardene777/kiwa/tree/main/docs/en)
- [@kiwa/core](https://www.npmjs.com/package/@kiwa/core) - runtime fixture

## Author

[cardene](https://github.com/cardene777) — [GitHub](https://github.com/cardene777) / [X](https://x.com/cardene777)

## License

MIT
