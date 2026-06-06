# RPC reference

本ドキュメントは kiwa の EIP-1193 互換 RPC を確認したい利用者向けです。
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
| `personal_sign` | `[message: string, address: 0x{hex}]` | `0x${string}` | `4001` / `4100` / `-32602` |
| `eth_signTypedData_v4` | `[address: 0x{hex}, typedDataJson: string]` | `0x${string}` | `4001` / `4100` / `-32700` |
| `wallet_switchEthereumChain` | `[{ chainId: 0x{hex} }]` | `null` | `4001` / `4902` / `-32602` |
| `wallet_addEthereumChain` | `[{ chainId: 0x{hex}, ... }]` | `null` | `-32602` |
| `eth_sendTransaction` | `[txRequest]` | `0x${string}` | `3` / `4001` / `4100` / `-32603` |

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
fixture API `dappE2e.setApprovalMode('reject')` が有効な間は、
`personal_sign` と `eth_signTypedData_v4` は `4001` (`User rejected the request.`) を返します。

```typescript
const sig = await window.ethereum.request({
  method: 'personal_sign',
  params: ['hello kiwa', account],
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
v0.3 から chain registry (`dappE2e.setChainRegistry(chains)`) が optional で利用可能になり、
registry を有効化すると未登録 chain への `wallet_switchEthereumChain` で EIP-3326 の `4902 (Unrecognized Chain ID)` を返します。
registry 未設定の場合は従来どおり常に成功 (下位互換)。
approval mode が `'reject'` のときは `wallet_switchEthereumChain` のみ `4001` で失敗し、
`wallet_addEthereumChain` は従来どおり実行されます。

```typescript
await window.ethereum.request({
  method: 'wallet_switchEthereumChain',
  params: [{ chainId: '0xa86a' }],
});
```

#### chain registry の利用 (v0.3+)

`dappE2e.setChainRegistry(chains)` で初期 chain 集合を設定すると、未登録 chain への `wallet_switchEthereumChain` が `4902` で失敗するようになります。

```typescript
await dappE2e.setChainRegistry([
  { chainId: '0x1', chainName: 'Ethereum Mainnet' },
  { chainId: '0xa', chainName: 'Optimism' },
]);

// 0xa86a (Avalanche) は登録されていないので 4902 で失敗
await window.ethereum.request({
  method: 'wallet_switchEthereumChain',
  params: [{ chainId: '0xa86a' }],
});
```

`wallet_addEthereumChain` を呼ぶと registry にも追加され、以後 switch 可能になります (EIP-3085 準拠)。

### transaction 系

`eth_sendTransaction` は `from` が active account と一致するかを確認し、
anvil へ送信した tx hash を返します。
fixture lifecycle の外で anvil port が無い場合は `-32603` で失敗します。
viem からの transaction rejection (insufficient balance / revert / signer 関連 error) は EIP-1193 code `3` で reject されます。
approval mode が `'reject'` のときは broadcast 前に `4001` を返します。

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

## Approval Mode (v0.2+)

`dappE2e.setApprovalMode(mode)` で wallet approval 挙動を切り替えられます。
test 側から User Reject (`EIP-1193` code `4001`) を deterministic に発火したいときに使います。

### API

| Mode | 挙動 |
|---|---|
| `'approve'` (default) | 対象 4 method を通常実行 |
| `'reject'` | 対象 4 method が `Eip1193Error(4001, 'User rejected the request.')` を返す |

### 対象 method

- `personal_sign`
- `eth_signTypedData_v4`
- `eth_sendTransaction`
- `wallet_switchEthereumChain`

### 利用例

```typescript
import { dappE2eTest as test } from '@kiwa/core';

test('reject 経路の error UX 確認', async ({ page, dappE2e }) => {
  await dappE2e.setApprovalMode('reject');

  const error = await page.evaluate(async () => {
    try {
      await (window as any).ethereum.request({
        method: 'personal_sign',
        params: ['hello', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'],
      });
      return null;
    } catch (e) {
      return { code: (e as { code?: number }).code ?? null };
    }
  });

  expect(error?.code).toBe(4001);
});
```

read-only method (`eth_requestAccounts` / `eth_accounts` / `eth_chainId` / `net_version` など) と
`wallet_addEthereumChain` は approval check の対象外です。

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
