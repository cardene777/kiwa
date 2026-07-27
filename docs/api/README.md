# kiwa API reference

Auto-generated API documentation for every language kiwa ships:

- **TypeScript** — `typedoc` output under [`docs/api/typescript/`](./typescript/) covers every `@kiwa-lab/*` package
- **Rust** — `cargo doc --all-features --no-deps` output under [`docs/api/rust/`](./rust/) covers `kiwa-test-rs`
- **Solidity** — `forge doc` output under [`docs/api/solidity/`](./solidity/) covers the dogfood Foundry project

## Regeneration

The three generators are wired into a single local skill:

```bash
claude /docs-generate
```

The skill runs typedoc + cargo doc + forge doc in sequence and writes each language's output under `docs/api/<language>/`. Because the outputs are large (typedoc alone is ~30 MiB across 23 packages), the actual HTML lives outside git — the `docs/api/` directories are placeholders + `.gitignore`-controlled.

To rebuild after a package changes:

```bash
pnpm -F @kiwa-lab/<name> build   # keep dist/ current
claude /docs-generate --only typescript   # or rust / solidity
```

## Layout

```
docs/api/
├── README.md            <- this file
├── typescript/          <- typedoc output (gitignored)
│   ├── index.html
│   └── modules/…
├── rust/                <- cargo doc output (gitignored)
│   └── kiwa/index.html
└── solidity/            <- forge doc markdown (gitignored)
    └── src/…/DogfoodToken.sol/*.md
```

## Publishing

v1.11-6 wires the generated site into VitePress + GitHub Pages. In the interim, browse locally by opening `docs/api/typescript/index.html` in a browser.
