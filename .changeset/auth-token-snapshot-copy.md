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

**挙動の変更**。 返り値の要素を書き換えて内部状態を操作していた test は効かなくなる。
内部状態を変えたい場合は公開 API (`revoke()` など) を使う。 列挙して読むだけの test は影響しない。
