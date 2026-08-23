---
"@kiwa-lab/auth": major
---

mock 認可 server の **authorize / token 経路**が、宣言されていない scope を発行しなくなった。

発行済み token を後から書き換える経路 (`listAccessTokens()` / `listRefreshTokens()` が返す
オブジェクトは内部の実体と同一参照) は本 release の対象外で、`@kiwa-lab/auth#2179` で扱う。

**破壊的変更**。 `@kiwa-lab/auth` は 2.2.0 (post-1.0) で、公開 API の観測可能な挙動が変わる。
壊れるのは利用側の test に限られるが、semver は test 用の API を例外にしない。
同 package の `oidc-real-jws-signatures` も同じ整理で `major` を選んでいる。

`AuthorizationUser.scopes` と `ClientRegistration.scopes` は「AS が発行を許される集合」 で、
**省略は空集合を意味する**。 要求された scope は user と client の双方が宣言していなければ
拒否される。

これまでは `?? []` としてから `length > 0` で検査を gate していたため、何も宣言していない
user / client に対して任意の scope が通っていた。 `users: [{ subject: 'user-1' }]` を
preseed して `scope: 'admin'` を要求すると、どこにも許可の宣言が無いのに発行される状態だった。

要求しない経路の既定も揃えた。 双方の交差を返すので、片側が宣言していなければ空になる。
以前は client が空なら交差を取らずに user 側の集合をそのまま返していた。

**移行**。 まず「scope を要求するか」 で分かれ、要求しない場合だけ値への依存で決まる。

| 形 | 変更 |
|---|---|
| **scope を要求する** | 返却値を読むかに関係なく、user と client の双方に `scopes` を宣言する |
| 要求せず、発行される scope の値を見る | 双方に宣言する。 片側が省略していると空文字になる |
| 要求せず、値にも依存しない | 不要。 これまでどおり省略できる |

**1 行目が要点**。 要求しただけで throw するので、返却値を一切参照しない検査でも
`scope` を渡していれば変更が要る。

2 行目は要求しない経路の変更。 双方の交差を返すようになったので、**client が省略された状態で
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
