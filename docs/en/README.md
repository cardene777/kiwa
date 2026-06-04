# dapp-e2e Documentation

dapp-e2e is a headless E2E fixture for dApps that runs without a browser extension.
It launches anvil per test run, combines Playwright and viem, injects `window.ethereum`, and covers connect / sign / send tx in a single fixture.

## Start here

- 🚀 [Quickstart](./quickstart.md) — Run in 5 minutes
- 📚 [Concepts](./concepts/README.md) — Learn how it works
- 🔧 [API Reference](./api/README.md) — Function signatures
- 🍳 [Cookbook](./cookbook/README.md) — Real scenarios
- ❓ [FAQ](./faq.md) — Common questions

## Why dapp-e2e

Traditional dApp E2E tests via browser extensions become flaky from popup interactions and UI diffs.
dapp-e2e prioritizes CI-stable connect-flow verification and deliberately excludes wallet UI popups / visual regressions from scope.
See [docs/COMPARISON.md](../COMPARISON.md) for details.

## Related links

- [GitHub repository](https://github.com/cardene777/dapp-e2e)
- [Issue tracker](https://github.com/cardene777/dapp-e2e/issues)
- [日本語ドキュメント](../ja/README.md)
