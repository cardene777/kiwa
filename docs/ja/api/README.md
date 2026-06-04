# API Reference

`@dapp-e2e/core` から export される主要 API。

| Function / Type | 役割 |
|---|---|
| [`dappE2eTest`](./dapp-e2e-test.md) | Playwright `test` を拡張した dApp 用 fixture |
| [`startAnvil`](./start-anvil.md) | anvil 子プロセスを spawn し ready まで待つ |
| [`waitForChainState`](./wait-for-chain-state.md) | predicate ベース contract view ポーリング |
| [`getFreePort`](./get-free-port.md) | OS allocate された free port を取得 |
| [`AnvilHandle`](./anvil-handle.md) | `startAnvil` の戻り値 (port + stop helper) |

その他の export (`handleRpcRequest` / `createEventEmitter` / `sendTransaction` / `createInjectorScript`) は内部実装向けで通常 test では使用しません。

## 関連

- [Concepts](../concepts/README.md)
- [Cookbook](../cookbook/README.md)
