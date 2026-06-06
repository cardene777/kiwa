# Errors reference

本ドキュメントは kiwa の error 設計を確認したい利用者向けです。
v0.1.0 では `packages/core/src/rpc-handlers.ts` が EIP-1193 互換 code 付きの error を投げ、
`packages/core/src/fixture.ts` が page に返す envelope へ変換します。
injector script はそれを unwrap し、page 側の `catch` で `code` を読める形に戻します。

## EIP-1193 公式 error code

| Code | Name | 意味 |
|---|---|---|
| `4001` | User Rejected Request | ユーザー拒否 |
| `4100` | Unauthorized | active account と一致しない操作 |
| `4200` | Unsupported Method | provider が未対応の method |
| `4900` | Disconnected | provider が切断 |
| `4901` | Chain Disconnected | 特定 chain との接続切断 |
| `-32700` | Parse error | JSON 文字列の parse 失敗 |
| `-32602` | Invalid params | params の型や形式が不正 |
| `-32603` | Internal error | 内部失敗や transport 失敗 |

kiwa が v0.1.0 で実際に使う主要 code は `4100` `4200` `-32700` `-32602` `-32603` です。
EIP-1193 でよく見かける `4902` も周辺仕様では使われますが、
現行 core は chain 登録テーブルを持たないため emit しません。

## 実装固有 error code

EIP-1193 公式に含まれないが本実装で利用する code です。

| Code | 用途 |
|---|---|
| `3` | `eth_sendTransaction` で transaction rejected (insufficient balance / revert / signer 関連 viem error) |

code `3` は `packages/core/src/tx.ts` で viem が throw した error を catch して `Eip1193Error(3, 'transaction rejected: ...')` に正規化したものです。
page 側の catch 句で `(e as { code?: number }).code === 3` を使うと、anvil への送信時の reject を観測できます。

## kiwa での主な発生条件

### `4100`

- `personal_sign` の address が active account と一致しない
- `eth_signTypedData_v4` の signer address が一致しない
- `eth_sendTransaction` の `from` が一致しない

### `4200`

- `eth_subscribe`
- `eth_unsubscribe`
- `wallet_requestPermissions`
- `wallet_getPermissions`
- `eth_sign`

これらは blocked method として core 側で即時 reject されます。

## BLOCKED_METHODS 一覧と理由

`packages/core/src/rpc-handlers.ts` の `BLOCKED_METHODS` は、fixture が再現しない wallet 機能を
`4200 (Unsupported Method)` で明示的に reject するための一覧です。

| Method | blocked 理由 |
|---|---|
| `eth_subscribe` | inject provider は HTTP bridge 前提で、subscription ID の払い出しと継続 push を保持できないため |
| `eth_unsubscribe` | `eth_subscribe` を実装していないため、解除対象の subscription state 自体が存在しないため |
| `wallet_requestPermissions` | EIP-2255 の permission scope は request をまたぐ state 管理が必要だが、HTTP 経路ではその state を保持できないため。test fixture では allowlist / blocklist の動的管理を行わず、approval UX は `setApprovalMode('approve' | 'reject')` で代替します |
| `wallet_getPermissions` | permission registry を内部保持していないため、wallet が返すべき permission descriptor を整合的に生成できないため |
| `eth_sign` | raw digest 署名は wallet 実装ごとの差異が大きく、kiwa では deterministic な test 対象を `personal_sign` / `eth_signTypedData_v4` に絞っているため |

### `-32700`

- `eth_signTypedData_v4` の typed data 文字列が JSON として壊れている

### `-32602`

- `personal_sign` の message が hex 風だが文字種不正
- `personal_sign` の message が string ではない
- `wallet_switchEthereumChain` / `wallet_addEthereumChain` で `chainId` が無い
- `chainId` が `0x` 形式ではない

### `-32603`

- anvil port が無い状態で `eth_sendTransaction` や fallback RPC を呼ぶ
- anvil への HTTP 接続失敗
- anvil から非 200 応答や JSON 以外の応答が返る
- core 内で EIP-1193 code を持たない例外が起きる

## error envelope

fixture は page 側へ直接 throw せず、まず plain object に詰め替えます。

```typescript
type Envelope<T> =
  | { ok: true; result: T }
  | { ok: false; error: { code: number; message: string } };
```

この envelope を作るのは `packages/core/src/fixture.ts` の `page.exposeFunction('__dappE2eRpc', ...)` です。
`handleRpcRequest()` が `Eip1193Error` を投げた場合はその `code` と `message` を保持し、
通常の `Error` や unknown 例外なら `-32603` を補って返します。

```typescript
try {
  const result = await handleRpcRequest(ctx, request);
  return { ok: true, result };
} catch (e) {
  const err = e as Error & { code?: number };
  return {
    ok: false,
    error: { code: err.code ?? -32603, message: err.message },
  };
}
```

## page 境界で code を保持する仕組み

injector script は `window.__dappE2eRpc(args)` の結果を受け取り、
`ok: false` なら新しい `Error` を作って `err.code = envelope.error.code` を付けます。
そのうえで page 内で throw するため、`window.ethereum.request()` の `catch` で `code` を読めます。

```typescript
try {
  await window.ethereum.request({ method: 'eth_subscribe', params: ['newHeads'] });
} catch (e) {
  console.log((e as { code?: number }).code);
}
```

この方式なら Playwright の `page.evaluate()` をまたいでも、
`err.code === 4200` のような assertion を page 側で書けます。
実例は [examples/basic-connect/tests/connect.spec.ts](../examples/basic-connect/tests/connect.spec.ts) の
`T-E2E-007` を参照してください。

## event と error の関係

`disconnect` event の payload code は、request の reject code と同じとは限りません。
helper の `disconnect()` は `4900` を送るだけで、未完了 RPC を自動で失敗させる仕組みは持ちません。
切断後の挙動を厳密に再現したい場合は、event 発火と request assertion を分けて書く方が安全です。

`waitForRpcIdle()` が timeout した場合も `Eip1193Error` の `-32603` を使います。
これは provider 由来ではなく fixture 制御由来の失敗なので、
test では timeout message を合わせて確認するのが実用的です。

## 関連

- [EIP-1193 provider errors](https://eips.ethereum.org/EIPS/eip-1193#provider-errors)
- [RPC.md](./RPC.md)
- [EVENTS.md](./EVENTS.md)
- [examples/basic-connect/tests/connect.spec.ts](../examples/basic-connect/tests/connect.spec.ts)
