<p align="center">
  <img src="https://raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-logo.png" alt="kiwa logo" width="160" />
</p>

# @kiwa-lab/cli

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](./README.ja.md)

CLI for [kiwa](https://github.com/cardene777/kiwa) with `init` and `doctor` commands.

`@kiwa-lab/cli` scaffolds Playwright-based dApp E2E tests that use `@kiwa-lab/dapp`, and provides a quick prerequisite check for local setup.

<p align="center">
  <img src="https://raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-promo-en.gif" alt="kiwa 127s overview — generate full-spec tests across Web (Next.js) / Contract (Solidity) / dApp (Playwright) in 6 steps (this CLI scaffolds the dApp e2e setup)" width="640" />
  <br />
  <sub>Full <a href="https://github.com/cardene777/kiwa">kiwa</a> overview (127s) — this CLI scaffolds the dApp e2e setup shown in the video. <a href="https://github.com/cardene777/kiwa/blob/main/assets/kiwa-promo-en.mp4">▶ Full-quality MP4 (2.9 MB)</a>.</sub>
</p>

## Installation

```bash
pnpm add -D @kiwa-lab/cli

# or use it without installing
pnpm dlx @kiwa-lab/cli init
pnpm dlx @kiwa-lab/cli doctor
```

### Bonus — Claude Code plugin

Use kiwa with Claude Code? Install the matching skill chain in **one command** — `/kiwa:kiwa-design`, `/kiwa:kiwa-play`, `/kiwa:kiwa-forge`, `/kiwa:kiwa-hardhat`, `/kiwa:kiwa-vitest`, `/kiwa:kiwa-api`, `/kiwa:kiwa-review` become available across any dApp project. (The `/kiwa:kiwa-test` one-shot orchestrator requires `examples/` and is kiwa-monorepo-only.)

```bash
# In Claude Code:
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

> Plugin skills are namespaced by plugin name (`/kiwa:kiwa-design`, not `/kiwa-design`). See [kiwa README — Option A](https://github.com/cardene777/kiwa#option-a-claude-code-plugin-recommended-for-claude-users) for the full skill list.

## Commands

### `kiwa init`

Scaffolds Playwright E2E files into an existing dApp project and wires the generated test to `@kiwa-lab/dapp`.

```bash
pnpm dlx @kiwa-lab/cli init
# creates: e2e/connect.spec.ts + playwright.config.ts
# also updates package.json and creates tsconfig.json if missing
```

Available flags include `--force`, `--testDir`, `--config-suffix`, `--script-key`, and `--with-deploy`.

### `kiwa doctor`

Checks that the required `anvil` binary is available in the current environment.

```bash
pnpm dlx @kiwa-lab/cli doctor
```

### `kiwa anvil seed <script> --out <path>`

Runs `<script>` (any executable `.mjs` / `.js`) against a fresh anvil instance and dumps the full chain state to `<path>` via `anvil --dump-state`. The script reads `process.env.ANVIL_RPC_URL` to deploy contracts and prepare seed data; on exit, anvil writes the state file that downstream vitest tests can pass to `setupTestEnv({ anvil: { loadState: ... } })` for instant chain startup.

```bash
pnpm dlx @kiwa-lab/cli anvil seed tests/seed.ts --out tests/fixtures/state.json
# OK seeded state at /…/tests/fixtures/state.json (port 49xxx)
```

Flags: `--chain-id <n>` (default 31337), `--port <n>` (default: random free port).

## Related

- [GitHub repository](https://github.com/cardene777/kiwa)
- [Full documentation](https://github.com/cardene777/kiwa/tree/main/docs/en)
- [@kiwa-lab/dapp](https://www.npmjs.com/package/@kiwa-lab/dapp) - runtime fixture

## Author

[cardene](https://github.com/cardene777) — [GitHub](https://github.com/cardene777) / [X](https://x.com/cardene777)

<!-- kiwa-docs:start -->
## Documentation

公開ドキュメントを正本として管理しています。

- [概要](https://cardene777.github.io/kiwa/libraries/foundation/cli/)
- [はじめる](https://cardene777.github.io/kiwa/libraries/foundation/cli/quickstart)
- [使い方](https://cardene777.github.io/kiwa/libraries/foundation/cli/how-to)
- [リファレンス](https://cardene777.github.io/kiwa/libraries/foundation/cli/reference)

編集元は [docs/libraries/foundation/cli](../../docs/libraries/foundation/cli/) です。
<!-- kiwa-docs:end -->

## License

MIT
