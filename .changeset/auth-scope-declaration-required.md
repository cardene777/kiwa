---
"@kiwa-lab/auth": minor
---

mock 認可 server が、宣言されていない scope を発行しなくなった。

`AuthorizationUser.scopes` と `ClientRegistration.scopes` は「AS が発行を許される集合」 で、
**省略は空集合を意味する**。 要求された scope は user と client の双方が宣言していなければ
拒否される。

これまでは `?? []` としてから `length > 0` で検査を gate していたため、何も宣言していない
user / client に対して任意の scope が通っていた。 `users: [{ subject: 'user-1' }]` を
preseed して `scope: 'admin'` を要求すると、どこにも許可の宣言が無いのに発行される状態だった。

要求しない経路の既定も揃えた。 双方の交差を返すので、片側が宣言していなければ空になる。
以前は client が空なら交差を取らずに user 側の集合をそのまま返していた。

**移行**。 変更が要るかは「発行される scope の値に依存するか」 で決まる。

| 形 | 変更 |
|---|---|
| scope を要求する | user と client の双方に `scopes` を宣言する |
| scope を要求せず、**発行される scope の値を見る** | 同上。 片側が省略していると空文字になる |
| scope の値に依存しない | 不要。 これまでどおり省略できる |

2 行目が要点。 要求しない経路も双方の交差を返すようになったので、**client が省略された状態で
user 側の集合が返ってくることを期待していた検査**は空文字を受け取る。

```ts
// 変更前 — 宣言が無くても通っていた
createAuthorizationServer({
  clients: [{ clientId: 'client-A', redirectUris: [cb] }],
  users: [{ subject: 'user-1' }],
});
// scope: 'openid' を要求 → 'openid' が発行される

// 変更後 — 双方の宣言が要る
createAuthorizationServer({
  clients: [{ clientId: 'client-A', redirectUris: [cb], scopes: ['openid'] }],
  users: [{ subject: 'user-1', scopes: ['openid'] }],
});
```
