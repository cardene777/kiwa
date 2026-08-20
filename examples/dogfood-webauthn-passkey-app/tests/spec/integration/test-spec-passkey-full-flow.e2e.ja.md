# test-spec-passkey-full-flow (e2e-generic layer)

Passkey の 3 面 (登録 / 認証 / 管理) を、実 Chrome の仮想認証器を付けた browser から
1 巡させて確かめる。

`tests/e2e/passkey-full-flow.spec.ts` が RP 側の 4 経路を node server に載せ、
browser の `fetch` がそこを叩く。 CDP で仮想認証器を付けるが、
**資格情報を作るのは RP 側の mock** で、browser 側は同じ security context を用意するだけになる。

- module: passkey-full-flow
- layer: e2e-generic

## 対象機能

| 経路 | handler | 実体 |
|---|---|---|
| `POST /register` | `createRegisterHandler` | `src/app/register/route.ts` → `src/adapters/mock.ts` |
| `POST /signin` | `createSigninHandler` | `src/app/signin/route.ts` → `src/adapters/mock.ts` |
| `GET /manage` | `createManageListHandler` | `src/app/manage/route.ts` |
| `DELETE /manage` | `createManageDeleteHandler` | `src/app/manage/route.ts` |

資格情報の保管は `src/lib/webauthn-server.ts` の `createWebAuthnServer()` が持つ Map で、
`mock.ts` が `persistCredential` / `listCredentials` / `getCredential` / `deleteCredential` /
`reset` の 5 つを呼ぶ。

## 仕様の要約

### challenge の単回使用は**効いていない**

**この仕様書で最も重要な性質。**

`webauthn-server.ts` は `issueChallenge` と `consumeChallenge` を持ち、後者のコメントに
「WebAuthn L3 §7.1 step 4 — a challenge is single use」 と書いてある。

**どちらも呼出箇所が 0 件**になる。 `mock.ts` が `createWebAuthnServer()` を作るが、
使うのは資格情報の 5 つだけで、challenge 側の Map は 1 度も読み書きされない。
`signin` route は `adapter.signin(input)` を呼ぶだけで challenge を照合しない。

実測で確かめた。 **同じ challenge を 2 回投げると 2 回とも 200 が返る。**

| 呼出 | 結果 |
|---|---|
| `challenge: 'same-challenge'` 1 回目 | 200 / `signCount: 1` |
| `challenge: 'same-challenge'` 2 回目 | 200 / `signCount: 2` |

再送された ceremony を RP が拒めない状態になる。

### 資格情報 id は連番で、counter は test が明示的に戻す

| 登録の順 | `credentialId` |
|---|---|
| 1 件目 | `credential-1` |
| 2 件目 | `credential-2` |
| 3 件目 | `credential-3` |

counter は module scope に置かれ、`__resetWebAuthnCounters()` で 0 に戻る。
**server を新しくするだけでは戻らない** — e2e が各 test の冒頭で明示的に呼ぶ。

### `residentKey` が `discoverable` を決める

| `authenticatorSelection.residentKey` | `discoverable` |
|---|---|
| `required` | `true` |
| `discouraged` | `false` |

### 一覧の絞り込みは 3 通りではなく 2 通り + 素通し

`?discoverable=` の値で分かれる。

| query | 返る資格情報 |
|---|---|
| 指定なし | 全件 |
| `true` | `discoverable: true` のみ |
| `false` | `discoverable: false` のみ |
| **`zzz` (未知の値)** | **全件** (絞り込まない) |

`parseDiscoverableFilter` は `'true'` と `'false'` 以外を `null` に倒す。
実測で `?discoverable=zzz` が 2 件とも返した。

### 削除の 3 分岐

| 入力 | status | body |
|---|---|---|
| `?credentialId=<実在>` | 200 | `{credentialId, deleted: true, remaining}` |
| `?credentialId=<不在>` | 404 | `{error: 'credential_not_found', ...}` |
| 引数なし | 400 | `{error: 'missing_credential_id', ...}` |
| `?confirm=true` (store に 1 件以上) | 200 | `{credentialId: null, deleted: true, remaining: 0}` |
| **`?confirm=true` (store が空)** | 200 | **`{credentialId: null, deleted: false, remaining: 0}`** |

最後の行が境界になる。 `deleted` は `before.length > 0` で決まるため、
**空の store に対する「全消し」 は成功 (200) だが `deleted: false`** を返す。

### signin は資格情報が 1 件も無いと 400

| 状況 | 結果 |
|---|---|
| 登録 0 件 | 400 / `{error: 'signin_failed', message: 'makeMockAdapter.signin: no credentials are registered'}` |
| 削除して 0 件になった後 | 同じ 400 |

### `discoverable: false` の資格情報でも signin できる

`allowCredentialIds` を空にした「探索」 の呼出でも、`discouraged` で登録した
資格情報 1 件だけの store に対して **200 が返る**。 実測で確認した。

探索は「discoverable な資格情報だけを対象にする」 のが WebAuthn の意図だが、
mock は保管中の全件から選ぶ。

## 主な品質リスク

- **challenge の単回使用が実装されていない**。 `consumeChallenge` は書かれているが
  呼出が無く、同じ challenge で何度でも signin できる。 再送攻撃を RP が拒めない
- **探索が discoverable を見ない**。 `discouraged` で登録した資格情報が探索経路で選ばれるため、
  discoverable の区別が認証の可否に効いていない
- **`/manage` に認証が無い**。 route の doc comment が「単一利用者の dogfood だから」 と
  明記した上で省いている。 一覧も全消しも誰でも呼べる
- **未知の絞り込み値が全件を返す**。 `?discoverable=zzz` が絞り込まないため、
  値を間違えた client が意図より多くを受け取る
- **空の store への全消しが 200 を返す**。 `deleted: false` で区別できるが、
  status だけを見る client は「消えた」 と読む
- **id が連番**。 `credential-1` から順に振るため、他の利用者の資格情報 id を推測できる。
  `/manage?credentialId=` に認証が無いことと組み合わさると、当てずっぽうで削除できる

## 推奨テスト構成

`bootAdapterServer(adapter)` が RP の 4 経路を node server に載せ、port 0 で listen する。
**adapter は呼出側が作って渡す**ため、server と adapter の寿命は分けられる。

各 test の冒頭で `__resetWebAuthnCounters()` を呼ぶ。 **これを忘れると id が前 test から続く**。

`context.newPage()` の後に CDP で仮想認証器を付ける
(`WebAuthn.enable` → `WebAuthn.addVirtualAuthenticator`、`hasResidentKey: true` /
`isUserVerified: true`)。

**仮想認証器を外しても結果は変わらない。** 実測した。

| 仮想認証器 | `/register` | `/signin` | `PublicKeyCredential` |
|---|---|---|---|
| あり | 200 / `credential-1` / `discoverable: true` | 200 / `signCount: 1` | 存在する |
| **なし** | 200 / `credential-1` / `discoverable: true` | 200 / `signCount: 1` | 存在する |

資格情報も署名も RP 側の mock が作るため、browser 側の認証器は 1 度も使われない。
**この 2 件の assert は仮想認証器の有無を区別しない。**

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | 登録 | `discoverable` / `credentialId` |
| 2 | 一覧 | 件数と中身 |
| 3 | 探索での認証 | `signCount` |
| 4 | 削除 | `deleted` / `remaining` |
| 5 | 削除後の認証 | 400 と `error` |
| 6 | 全消し | `deleted` / `remaining` / 消えた後の一覧 |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-E2E-001 | 登録から削除後の認証失敗まで 1 巡する | mock adapter を載せた server、仮想認証器を付けた page、counter を戻した状態 | `/register` (`residentKey: required`) → `/manage` → `/signin` (探索) → `/manage?credentialId=` DELETE → `/signin` を順に呼ぶ | 登録は `status===200`、`discoverable===true`、`credentialId==='credential-1'`。 一覧は 1 件で id と `discoverable` が一致。 認証は `credentialId` 一致で `signCount===1`。 削除は `deleted===true`、`remaining===0`。 削除後の認証は `status===400`、`error==='signin_failed'`、message が `/no credentials/` に一致 | P0 | yes | node | `/register` `/manage` `/signin` |
| T-E2E-002 | 全消しが 1 回で全件を消す | 資格情報を 2 件登録した store | `/manage` で 2 件を確認 → `/manage?confirm=true` DELETE → `/manage` を再度呼ぶ | 全消しは `status===200`、`deleted===true`、`remaining===0`。 再度の一覧が 0 件 | P0 | yes | node | `/manage` |

## 自動化方針

2 件とも実 Chrome を起動し、CDP で仮想認証器を付ける。

**T-E2E-001 は 5 手を 1 件に畳んである。** 分けないのは、削除後の認証失敗が
「その前に登録して認証できていた」 ことを前提にするため。 分けると前提が別の test に移る。

**assert は値を固定してある** (`credential-1` / `signCount===1` / `remaining===0`)。
範囲ではないため、値が変われば落ちる。

**この 2 件が覆っていない範囲**。

| 覆っていないもの | 到達 | 理由 |
|---|---|---|
| challenge の再利用が通ること | できる | 毎回違う challenge を送っている |
| `discouraged` で登録した資格情報 | できる | `required` だけを送っている |
| 探索が `discoverable: false` を選ぶこと | できる | 同上 |
| `?discoverable` の 3 値 (`true` / `false` / 未知) の絞り込み | できる | 絞り込みなしだけを送っている |
| `?credentialId=<不在>` の 404 | できる | 実在する id だけを送っている |
| 引数なし DELETE の 400 | できる | 常に引数を付けている |
| **空の store への `?confirm=true`** (`deleted: false`) | できる | 2 件ある状態だけを送っている |
| `signCount` が 2 以上へ進むこと | できる | 1 回しか認証していない |
| 3 件目以降の id 採番 | できる | 最大 2 件しか登録していない |
| `attestationObject` / `clientDataJSON` の中身 | できる | 応答に含まれるが assert していない |
| 64 KiB 超の body の 413 | できる | 小さい body だけを送っている |
| 未知 path の 404 | できる | 既知の 3 path だけを送っている |

**到達できない範囲は無い。** ただし「HTTP の口が 4 本」 は「実装に分岐が無い」 を意味しない。
`webauthn-server.ts` の `issueChallenge` / `consumeChallenge` は **呼出が 0 件**で、
HTTP からも単体テストからも通らない (書かれているが使われていない)。
