# kiwa Documentation

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](../ja/README.md)

kiwa is a headless E2E fixture for dApps that runs without a browser extension.
It launches anvil per test run, combines Playwright and viem, injects `window.ethereum`, and covers connect / sign / send tx in a single fixture.

## Start here

- 🚀 [Quickstart](./quickstart.md) — Run in 5 minutes
- 🧭 [Examples](./examples/README.md) — Reverse lookup by feature
- 🚶 [Examples Walkthrough](./examples/walkthrough.md) — Guided tour through 5 popular examples
- 📚 [Concepts](./concepts/README.md) — Learn how it works
- 🔧 [API Reference](./api/README.md) — Function signatures
- 🍳 [Cookbook](./cookbook/README.md) — Real scenarios
- ❓ [FAQ](./faq.md) — Common questions

## Why kiwa

Traditional dApp E2E tests via browser extensions become flaky from popup interactions and UI diffs.
kiwa prioritizes CI-stable connect-flow verification and deliberately excludes wallet UI popups / visual regressions from scope.
See [docs/COMPARISON.md](../COMPARISON.md) for details.

## Related links

- [GitHub repository](https://github.com/cardene777/kiwa)
- [Issue tracker](https://github.com/cardene777/kiwa/issues)
- [日本語ドキュメント](../ja/README.md)
