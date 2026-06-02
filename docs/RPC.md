# RPC reference

本ドキュメントは dapp-e2e の EIP-1193 互換 RPC を確認したい利用者向けです。
v0.1.0 の core は `packages/core/src/rpc-handlers.ts` で 9 method を直接処理し、
それ以外は anvil JSON-RPC へ forward します。
error の返し方は [ERRORS.md](./ERRORS.md) を参照してください。

## 直接処理される 9 RPC

| Method | Params | Returns | 主な error code |
|---|---|---|---|
| `eth_requestAccounts` | なし | `string[]` | なし |
| `eth_accounts` | なし | `string[]` | なし |
| `eth_chainId` | なし | `0x${string}` | なし |
| `net_version` | なし | `string` | なし |
| `personal_sign` | `[message: string, address: 0x{hex}]` | `0x${string}` | `4100` / `-32602` |
| `eth_signTypedData_v4` | `[address: 0x{hex}, typedDataJson: string]` | `0x${string}` | `4100` / `-32700` |
| `wallet_switchEthereumChain` | `[{ chainId: 0x{hex} }]` | `null` | `-32602` |
| `wallet_addEthereumChain` | `[{ chainId: 0x{hex}, ... }]` | `null` | `-32602` |
| `eth_sendTransaction` | `[txRequest]` | `0x${string}` | `3` / `4100` / `-32603` |

これら 9 method は、active account と current chain を fixture の state から引いて返します。
`eth_sendTransaction` だけは anvil への broadcast が必要なため、内部で `sendTransaction()` を呼びます。
sign 系は viem の account 実装を使いますが、呼び出し元からは通常の `window.ethereum.request()` と同じ形で扱えます。

### account / chain 系

`eth_requestAccounts` と `eth_accounts` は、inject 済み provider に紐づく anvil dev account を返します。
`eth_chainId` は hex、`net_version` は 10 進文字列で返るため、
既存 dApp の provider 初期化コードをそのまま通しやすい構成です。

```typescript
const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
const chainId = await window.ethereum.request({ method: 'eth_chainId' });
const networkId = await window.ethereum.request({ method: 'net_version' });
```

戻り値は `accounts[0]` が 20 byte address、`chainId` が `0x7a69` のような hex、
`networkId` が `31337` のような 10 進文字列になります。

### sign 系

`personal_sign` は 2 通りの message を受けます。

- `0x` で始まる偶数長 hex string
- 通常の UTF-8 string

hex 風の文字列でも文字種が不正、または奇数長なら `-32602` を返します。
address が active account と一致しない場合は `4100` です。

```typescript
const sig = await window.ethereum.request({
  method: 'personal_sign',
  params: ['hello dapp-e2e', account],
});
```

`eth_signTypedData_v4` は第 2 引数に JSON string を受け取り、
内部で `JSON.parse()` した後に `EIP712Domain` を除いた `types` を viem へ渡します。
JSON 自体が壊れている場合は `-32700` で失敗します。

```typescript
const sig = await window.ethereum.request({
  method: 'eth_signTypedData_v4',
  params: [account, JSON.stringify(typedData)],
});
```

### chain 更新系

`wallet_switchEthereumChain` と `wallet_addEthereumChain` は、
どちらも `chainId` を検証したうえで `chainState.current` を更新し、
内部 emitter 経由で `chainChanged` を page 側へ通知します。
v0.1.0 では chain 登録テーブルを持たないため、未登録 chain 判定による `4902` は返しません。

```typescript
await window.ethereum.request({
  method: 'wallet_switchEthereumChain',
  params: [{ chainId: '0xa86a' }],
});
```

### transaction 系

`eth_sendTransaction` は `from` が active account と一致するかを確認し、
anvil へ送信した tx hash を返します。
fixture lifecycle の外で anvil port が無い場合は `-32603` で失敗します。
viem からの transaction rejection (insufficient balance / revert / signer 関連 error) は EIP-1193 code `3` で reject されます。

```typescript
const hash = await window.ethereum.request({
  method: 'eth_sendTransaction',
  params: [{
    from: account,
    to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    value: '0xde0b6b3a7640000',
  }],
});
```

## anvilProxy fallback

上記 9 method 以外は `proxyToAnvil()` 経由で anvil JSON-RPC に forward されます。
代表例は `eth_blockNumber` `eth_getBalance` `eth_call` `eth_estimateGas` `eth_getCode` です。
anvil 側が通常の JSON-RPC error を返した場合、その `code` と `message` をそのまま page 側へ返します。
接続失敗、非 200 応答、JSON 以外の応答、無効な response shape は `-32603` です。

```typescript
const blockNumber = await window.ethereum.request({ method: 'eth_blockNumber' });
```
## blocked method

HTTP 経路では扱わない method は core 側で先に弾きます。
v0.1.0 の blocked method は次の 5 つです。

- `eth_subscribe`
- `eth_unsubscribe`
- `wallet_requestPermissions`
- `wallet_getPermissions`
- `eth_sign`

これらは anvil へ forward せず、常に `4200` を返します。
page 境界をまたいだときの観測例は [ERRORS.md](./ERRORS.md) で説明しています。

## 関連

- [EIP-1193 仕様](https://eips.ethereum.org/EIPS/eip-1193)
- [viem local account docs](https://viem.sh/docs/accounts/local/privateKeyToAccount.html)
- [EVENTS.md](./EVENTS.md)
- [ERRORS.md](./ERRORS.md)
- [examples/basic-connect/tests/connect.spec.ts](../examples/basic-connect/tests/connect.spec.ts)
