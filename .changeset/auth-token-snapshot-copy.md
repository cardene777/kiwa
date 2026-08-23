---
"@kiwa-lab/auth": patch
---

`listAccessTokens()` / `listRefreshTokens()` が要素も copy して返すようになった。

両 method は doc に「snapshot」 と書かれているが、実体は `Array.from(map.values())` で
**配列だけが新しく、要素は内部の Map が持つオブジェクトと同一参照**だった。
戻り値の型 `readonly AccessToken[]` が凍らせるのは配列であって要素ではない。

そのため呼出側が返り値の `scope` を書き換えると、refresh 側が保存済みの値を信頼するため
**一度も宣言されていない scope の access token を発行できた**。 `listAccessTokens()` の要素を
書き換えれば `introspect()` の応答にも現れた。

```ts
server.listRefreshTokens()[0].scope = 'admin';
// 以前はこの後の refresh で 'admin' が発行された
```

`revoked` を `false` に戻して失効を取り消す形も同じ経路で起きた。

登録側も同じ形だった。 `createAuthorizationServer({ clients, users })` と
`registerClient()` / `registerUser()` は呼出側の object をそのまま保持していたため、
**登録した後に `scopes.push('admin')` するだけで**同じことが起きた。 4 経路とも
object と配列 field (`scopes` / `redirectUris`) を copy して取り込む形にした。

**挙動の変更**。 参照を書き換えて内部状態を操作していた test は効かなくなる。 操作別の移行先は
以下のとおり。

| したいこと | 移行先 |
|---|---|
| token の `scope` を変える | `clients` / `users` に scope を宣言して token を発行し直す |
| token を失効させる | `revoke(token, clientId)` |
| 全部消す | `reset()` |
| 登録済みの client / user を変える | **手段は無い**。 別の `createAuthorizationServer()` を組む |

**状態を変える公開 API は `revoke()` と `reset()` の 2 つだけ**で、`scope` を後から変える API は
無い。 列挙して読むだけの test は影響しない。
