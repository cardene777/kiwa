# test-spec-passkey-signin (e2e-generic layer)

登録と認証の往復を実 Chrome から 2 度行い、**署名回数が進むこと**と、
**browser 側に WebAuthn の口があること**を確かめる。

`tests/e2e/passkey-signin.spec.ts` が RP 側の経路を node server に載せ、
browser の `fetch` がそこを叩く。 CDP で仮想認証器を付けるが、
**署名を作るのは RP 側の mock** になる。

- module: passkey-signin
- layer: e2e-generic

## 対象機能

| 経路 | handler | 実体 |
|---|---|---|
| `POST /register` | `createRegisterHandler` | `src/app/register/route.ts` → `src/adapters/mock.ts` |
| `POST /signin` | `createSigninHandler` | `src/app/signin/route.ts` → `src/adapters/mock.ts` |

browser 側は `PublicKeyCredential` が存在するかだけを見る。

## 仕様の要約

### 署名回数は 1 ずつ進む

実測で 4 回続けて認証した推移。

| 呼出 | `previousSignCount` | `signCount` |
|---|---|---|
| 1 回目 | 0 | 1 |
| 2 回目 | 1 | 2 |
| 3 回目 | 2 | 3 |
| 4 回目 | 3 | 4 |

登録直後は `signCount: 0`。 **RP 側が持つ値**で、browser も仮想認証器も関与しない。

### 署名は base64url の形をしているが、実際の署名ではない

`signature` / `clientDataJSON` / `authenticatorData` の 3 つが `[A-Za-z0-9_-]+` に一致する。

**`signature` は mock が作る短い文字列**で、実測で `puWQ-6blkPs` / `OMLGmDjCxpg` のように
11 文字だった。 実 ECDSA の署名 (数十 byte) とは長さが違う。

`clientDataJSON` は decode すると実際の JSON になる。

```json
{"type":"webauthn.get","challenge":"same-challenge","origin":"https://127.0.0.1","crossOrigin":false}
```

**`origin` が `https://` で始まる**が、test の server は `http://127.0.0.1:<port>` で動く。
mock が `rpId` から組み立てるため、実際の origin とは一致しない。

### challenge の単回使用は効いていない

`webauthn-server.ts` の `consumeChallenge` は「a challenge is single use」 と書かれているが、
**呼出箇所が 0 件**になる。 `mock.ts` は資格情報の保管 5 つだけを使い、
challenge 側の Map は 1 度も読み書きされない。

実測で **同じ challenge を 2 回投げると 2 回とも 200 が返る** (`signCount` は 1 → 2 と進む)。

### browser 側の口

`PublicKeyCredential` が `undefined` でないことだけを見る。
仮想認証器を付けた Chromium では常に存在する。

**この確認は RP 側を 1 度も呼ばない。** server を起動しても使わない。

## 主な品質リスク

- **challenge の単回使用が実装されていない**。 再送された ceremony を RP が拒めない
- **署名が検証されていない**。 `signature` の形 (base64url) しか見ておらず、
  公開鍵との照合を行わない。 mock が返す 11 文字でも通る
- **`clientDataJSON` の `origin` が実際の origin と違う**。 `https://<rpId>` を組み立てるため、
  `http://127.0.0.1:<port>` で動く test server とは一致しない。
  実 RP は origin の一致を検証するので、この mock では origin 検証の欠落を検出できない
- **`signCount` の巻き戻し検知が無い**。 値が進むことは確かめられるが、
  減った時に RP が拒むかは mock に分岐が無い (clone 検知の本来の目的)
- **browser 側の確認が API の有無だけ**。 実測で **仮想認証器が無くても真**になった。
  T-E2E-002 は仮想認証器の設定を検証していない

## 推奨テスト構成

`bootAdapterServer(adapter)` が RP の経路を node server に載せ、port 0 で listen する。
各 test の冒頭で `__resetWebAuthnCounters()` を呼ぶ (呼ばないと id が前 test から続く)。

CDP で仮想認証器を付ける (`hasResidentKey: true` / `isUserVerified: true` /
`automaticPresenceSimulation: true`)。

**仮想認証器を外しても結果は変わらない。** 実測した。

| 仮想認証器 | `/register` | `/signin` | `PublicKeyCredential` |
|---|---|---|---|
| あり | 200 / `credential-1` | 200 / `signCount: 1` | 存在する |
| **なし** | 200 / `credential-1` | 200 / `signCount: 1` | 存在する |

署名を作るのは RP 側の mock なので、browser 側の認証器は 1 度も使われない。

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | 登録 | `credentialId` / `signCount` |
| 2 | 認証 | `credentialId` / `previousSignCount` / `signCount` |
| 3 | 応答の形 | 3 つの base64url |
| 4 | 再認証 | 署名回数が進む |
| 5 | browser の口 | `PublicKeyCredential` の存在 |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-E2E-001 | 登録と認証を 2 度行い署名回数が進む | mock adapter を載せた server、仮想認証器を付けた page、counter を戻した状態 | `/register` → `/signin` → `/signin` を順に呼ぶ | 登録は `credentialId==='credential-1'`、`signCount===0`。 1 回目の認証は `previousSignCount===0`、`signCount===1`、`signature` / `clientDataJSON` / `authenticatorData` が `/^[A-Za-z0-9_-]+$/` に一致。 2 回目は `previousSignCount===1`、`signCount===2` | P0 | yes | node | `/register` `/signin` |
| T-E2E-002 | browser の security context に WebAuthn の口がある | 仮想認証器を付けた page | `typeof PublicKeyCredential` を評価する | `'undefined'` ではない | P2 | yes | node | `/` |

## 自動化方針

**T-E2E-001 は 3 手を 1 件に畳んである。** 署名回数が進むことは、前の呼出の結果を
前提にするため分けられない。

**assert は値を固定してある** (`credential-1` / 0 → 1 → 2)。 範囲ではない。

3 つの base64url は **形 (`/^[A-Za-z0-9_-]+$/`) だけ**を見る。 中身は見ないため、
mock が返す 11 文字の `signature` でも通る。

**T-E2E-002 は RP を 1 度も呼ばない。** server を起動するが使わず、
browser に API があるかだけを見る。 この 1 件だけは他の 1 件と独立している。

**この 2 件が覆っていない範囲**。

| 覆っていないもの | 到達 | 理由 |
|---|---|---|
| challenge の再利用が通ること | できる | 毎回違う challenge を送っている |
| `signCount` が 3 以上へ進むこと | できる | 2 回しか認証していない |
| `clientDataJSON` の中身 (`origin` の不一致) | できる | 形しか見ていない |
| `signature` の長さ | できる | 形しか見ていない |
| `userHandle` | できる | 応答に含まれるが assert していない |
| 資格情報 0 件での 400 | できる | 必ず登録してから認証している |
| `discoverable` の真偽 | できる | assert していない |
| 仮想認証器を外した場合の挙動 | できる | 常に付けている (実測では結果が変わらない) |
| 64 KiB 超の body の 413 / 未知 path の 404 | できる | 送っていない |

**到達できない範囲は無い。** ただし `webauthn-server.ts` の
`issueChallenge` / `consumeChallenge` は **呼出が 0 件**で、
HTTP からも単体テストからも通らない (書かれているが使われていない)。
