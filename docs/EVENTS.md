# Events reference

本ドキュメントは kiwa の event API を確認したい利用者向けです。
v0.1.0 では `packages/core/src/event-emitter.ts` と `packages/core/src/fixture.ts` が連携し、
EIP-1193 の 4 event を page 側へ届けます。
test 側からは `dappE2e.triggerEvent(name, payload)` を使って発火できます。

## EIP-1193 4 event

| Event | Payload | 用途 |
|---|---|---|
| `accountsChanged` | `string[]` | account 切替や空配列化の通知 |
| `chainChanged` | `0x${string}` | chain 切替後の再初期化 |
| `connect` | `{ chainId: 0x{hex} }` | provider 接続の通知 |
| `disconnect` | `{ code: number, message: string }` | provider 切断の通知 |

page 側では `window.ethereum.on(eventName, handler)` で購読します。
inject 済み provider は `removeListener()` も持つため、不要になった handler は解除できます。

```typescript
window.ethereum.on('chainChanged', (chainId) => {
  console.log('changed to', chainId);
});
```

## test 側 API

fixture から渡される `dappE2e` には、event 制御用の helper が入っています。

- `triggerEvent(event, ...args)`
- `connect()`
- `disconnect()`
- `switchChain(chainIdHex)`
- `waitForRpcIdle(timeoutMs?)`

`connect()` は `connect` event、`disconnect()` は `disconnect` event をそのまま page 側へ流します。
`switchChain()` は internal state を更新してから `chainChanged` を送るため、
event 発火後の `eth_chainId` と整合した状態を作れます。

## 基本例

次の例は `accountsChanged` を page 側 handler で受け取る最小構成です。

```typescript
import { expect } from '@playwright/test';
import { dappE2eTest as test } from '@kiwa/core';

test('accountsChanged event が page 側 handler を発火する', async ({ page, dappE2e }) => {
  await page.setContent(`
    <pre id="event-result"></pre>
    <script>
      window.ethereum.on('accountsChanged', (accounts) => {
        document.getElementById('event-result').textContent = 'accountsChanged: ' + accounts[0];
      });
    </script>
  `);

  const newAddr = '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826';
  await dappE2e.triggerEvent('accountsChanged', [newAddr]);

  const text = await page.locator('#event-result').textContent({ timeout: 5000 });
  expect(text).toBe(`accountsChanged: ${newAddr}`);
});
```

この流れは [examples/basic-connect/tests/connect.spec.ts](../examples/basic-connect/tests/connect.spec.ts) の
`T-E2E-006` と同じ考え方です。

## handler と同期を取る考え方

`triggerEvent()` 自体は `page.evaluate()` で page 内の `window.__dappE2eEmit()` を呼ぶだけです。
そのため、同期 handler なら locator 待ちだけで十分です。
event handler の中でさらに RPC を投げる場合は `waitForRpcIdle()` を併用すると、
pending RPC が空になるまで待ってから assertion に進めます。

```typescript
await dappE2e.triggerEvent('chainChanged', '0xa86a');
await dappE2e.waitForRpcIdle();
```

`waitForRpcIdle()` は pending RPC の解消に加えて、
最後に 2 回の `requestAnimationFrame` を待つため、
RPC 結果に続く DOM 更新もまとめて待ちやすくなっています。

## payload 設計の注意

`connect` と `disconnect` の payload shape は EIP-1193 に合わせています。
ただし v0.1.0 の helper が自動で投げる `disconnect()` は、
常に `{ code: 4900, message: 'Disconnected' }` を送ります。
`4901` を試したい場合は `triggerEvent('disconnect', { code: 4901, message: 'Chain disconnected' })`
のように明示してください。

`accountsChanged` は配列 payload なので、`triggerEvent('accountsChanged', [addr])` のように
配列を 1 引数として渡す形になります。

## EIP-6963 announce 仕様

kiwa は EIP-6963 (Multi Injected Provider Discovery) に対応しており、1 page 内に複数 wallet を並走 inject できます。

### イベント

| イベント | 方向 | 説明 |
|---|---|---|
| `eip6963:announceProvider` | kiwa → window | 各 wallet が自身を announce、`detail: { info, provider }` (Object.freeze) |
| `eip6963:requestProvider` | dApp → window | dApp が wallet 一覧を再要求、kiwa は登録済みの全 wallet を再 announce |

### `info` の仕様

`info` は `Object.freeze` で immutable です (EIP-6963 仕様要件)。

| field | 型 | 説明 |
|---|---|---|
| `uuid` | string | wallet ごとに unique、`crypto.randomUUID()` で生成 |
| `name` | string | wallet 表示名 (例 `MetaMask`) |
| `icon` | string | icon の data URI (`data:image/svg+xml;base64,...`) |
| `rdns` | string | reverse DNS 命名 (例 `io.metamask`) |

### `rdns` 命名規約

dApp 互換性のため、各 wallet の `rdns` は実 wallet と同じものを使うことを推奨します。

| Wallet | rdns |
|---|---|
| MetaMask | `io.metamask` |
| Rabby | `io.rabby` |
| Coinbase Wallet | `com.coinbase.wallet` |

### `window.ethereum` 互換

`window.ethereum` は **最初の wallet のみ** に inject されます。
legacy provider 互換性を維持するためで、複数 wallet を `window.ethereum` で扱いたい場合は EIP-6963 経由で取得してください。

## 関連

- [EIP-1193 events](https://eips.ethereum.org/EIPS/eip-1193#events)
- [RPC.md](./RPC.md)
- [ERRORS.md](./ERRORS.md)
- [examples/basic-connect/tests/connect.spec.ts](../examples/basic-connect/tests/connect.spec.ts)
