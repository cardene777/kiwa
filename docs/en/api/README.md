# API Reference

Main API exported from `@dapp-e2e/core`.

| Function / Type | Role |
|---|---|
| [`dappE2eTest`](./dapp-e2e-test.md) | Playwright `test` extended for dApps |
| [`startAnvil`](./start-anvil.md) | Spawn anvil and wait for ready |
| [`waitForChainState`](./wait-for-chain-state.md) | Predicate-based contract view polling |
| [`getFreePort`](./get-free-port.md) | Obtain an OS-allocated free port |
| [`AnvilHandle`](./anvil-handle.md) | Return type of `startAnvil` (port + stop helper) |

Other exports (`handleRpcRequest` / `createEventEmitter` / `sendTransaction` / `createInjectorScript`) are internal-facing and rarely needed in tests.

## Related

- [Concepts](../concepts/README.md)
- [Cookbook](../cookbook/README.md)
