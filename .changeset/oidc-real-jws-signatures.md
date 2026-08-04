---
"@kiwa-lab/auth": minor
---

OIDC モックの id_token を実署名にし、JWKS から検証器を組み立てる経路を公開する。

これまで `setupOidcEnv` の id_token は `header.payload.kid` の SHA-256 を署名欄に入れていた。
改竄すれば検知できる一方、JWKS の `n` / `e` は `randomBytes` の埋め草で、公開鍵とは対応していなかった。

そのため RP 側が JWKS を持っていても署名を検証できず、`examples/dogfood-oidc-federation` の
callback は id_token を未検証のまま受理していた (GH #1795)。

**変更点。**

`createJwksEndpoint` が RSA-2048 (RS256) または EC P-256 (ES256) の鍵ペアを実際に生成する。
JWKS が返す `n` / `e` / `x` / `y` は `KeyObject.export({ format: 'jwk' })` の出力そのもので、
`crypto.createPublicKey({ format: 'jwk' })` に渡して署名を検証できる。

署名は `node:crypto` の同期 `sign` で作る。RS256 は RSASSA-PKCS1-v1_5、ES256 は
ECDSA P-256 で、RFC 7518 §3.4 が要求する R||S 連結 (`dsaEncoding: 'ieee-p1363'`) を使う。

`JwksEndpoint` に `signingKeyFor(kid)` を追加した。署名側だけが使う秘密鍵の取得口で、
`fetch()` / `allKeys()` が返す公開 JWKS には現れない。保持期間を過ぎた kid では `undefined` を返す。

`createJwksDocumentVerifier(document, now?)` を新たに公開する。
RP が `jwks_uri` から取得した JWKS 文書だけを材料に、4 軸 (JWS 署名 / claims / nonce echo /
hash chain) を検査する同期の検証器を返す。OP の内部状態には触れない。

**利用者への影響。**

`setupOidcEnv` / `createJwksEndpoint` / `createIdTokenSigner` の呼び出し形は変わらない。
`JwksEndpoint` を独自に実装している場合のみ `signingKeyFor` の追加が必要になる。

`createJwksEndpoint` 1 回につき鍵生成が入る。実測で RSA-2048 が 24 ms、EC P-256 が 0.02 ms。
既定は従来どおり RS256 で、`initialAlg: 'ES256'` を渡せば生成コストは無視できる範囲になる。

**確認した範囲。**

`packages/auth` は 91 file 1143 件、`examples/dogfood-oidc-federation` は 10 file 180 件が通過した。
taxonomy CLI は perf 27 / fidelity 26 / skill 26 / integration 26 の 105 cell が通過し、
`tests/release-smoke` は 371 件と 25 件が通過した。

perf 系は 27 cell すべて通過しており、鍵生成による超過は出ていない。
