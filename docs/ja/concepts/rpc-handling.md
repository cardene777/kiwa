# RPC Handling

> [🇬🇧 English](../../en/concepts/rpc-handling.md) • [🇯🇵 日本語](./rpc-handling.md)

## TL;DR

kiwa core は 9 つの EIP-1193 RPC method を直接処理し、それ以外は anvil JSON-RPC へ forward します。
これにより wallet UI を再現せずに `eth_requestAccounts` や `personal_sign` などのフローを test 内で完結できます。

## なぜ

実 wallet は popup / approve UI を介して RPC を返しますが、CI ではこの UI を再現できません。
kiwa は wallet の挙動を **コード側で完結** させることで CI フレンドリーにし、`setApprovalMode('reject')` のような UX 経路も切り替えで test できるようにしています。

## 直接処理する 9 RPC

inject された provider は以下 9 method を fixture の state から直接返します。

| method | 返すもの |
|---|---|
| `eth_requestAccounts` | provider に紐づく anvil の開発用アカウント |
| `eth_accounts` | 同上 |
| `eth_chainId` | 現在の chain ID (16 進) |
| `net_version` | 現在の chain ID (10 進の文字列) |
| `personal_sign` | 署名 |
| `eth_signTypedData_v4` | 型付きデータの署名 |
| `wallet_switchEthereumChain` | `null` (切替後に `chainChanged` を送出) |
| `wallet_addEthereumChain` | `null` (registry へ追加し、 その chain へ切替えて `chainChanged` も送出) |
| `eth_sendTransaction` | transaction hash (anvil へ broadcast) |

`eth_requestAccounts` と `eth_accounts` は複数アカウントを扱い、 現在有効なアカウントは `setActiveAccount()` で切り替えます。
接続を拒否する経路 (`rejectConnect`) やコントラクトアカウントを使う経路もあり、 詳細は [docs/RPC.md](../../RPC.md) を参照してください。

以下 5 つの method はエラーコード `4200` で拒否し、 anvil へは一切転送しません。

- `eth_subscribe`
- `eth_unsubscribe`
- `wallet_requestPermissions`
- `wallet_getPermissions`
- `eth_sign`

上記 9 つと拒否 5 つ以外の method は anvil の JSON-RPC へそのまま転送します。

## Example: setApprovalMode

~~~ts
test('user reject 経路', async ({ page, dappE2e }) => {
  await dappE2e.setApprovalMode('reject');
  await page.goto('/');
  await page.getByRole('button', { name: /connect/i }).click();
  await expect(page.getByTestId('error')).toContainText('User rejected'); // code 4001
});
~~~

## 関連

- [RPC.md (Reference)](../../RPC.md)
- [Cookbook: User Reject 経路](../cookbook/user-reject.md)
