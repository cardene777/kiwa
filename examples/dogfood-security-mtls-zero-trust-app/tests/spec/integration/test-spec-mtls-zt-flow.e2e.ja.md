# test-spec-mtls-zt-flow (e2e-generic layer)

mTLS の 4 呼出 / zero-trust の 4 段 / broker の判定を、Chromium の BrowserContext に紐づく
Playwright `APIRequestContext` から順に叩いて確かめる。

画面は描画しない。 `src/lib/next-server.ts` が 3 route を node server に載せ、
Playwright の `page.request` が JSON を投げる。これは `page.context().request` と同じ
API testing helper で、Chromium page 内の `fetch` ではない。

- module: mtls-zt-flow
- layer: e2e-generic

## 対象機能

| 経路 | kind | 実体 |
|---|---|---|
| `POST /mtls` | `handshake` / `pin` / `ocsp` / `ct` | `src/app/mtls/route.ts` → `src/adapters/mock.ts` |
| `POST /zero-trust` | `posture` / `risk` / `jit` / `segment` | `src/app/zero-trust/route.ts` → 同上 |
| `POST /broker` | `decide` | `src/app/broker/route.ts` → 同上 |

## 仕様の要約

### session の作成と終了は HTTP から到達できない

**この仕様書で最も重要な性質。**

3 つの session の作成 (`startMtls` / `startZeroTrust` / `startBroker`) と終了
(`closeMtls` / `closeZeroTrust` / `closeBroker`) はどの route にも生えていない。
e2e は作成だけを **adapter を直接呼んで**行い、終了は呼ばない。

```ts
await adapter.startMtls({ sessionId: 'e2e-mtls', target: 'istio' });
await adapter.startZeroTrust({ sessionId: 'e2e-zt', target: 'opa' });
await adapter.startBroker({ sessionId: 'e2e-broker', mtlsTarget: 'istio', ztTarget: 'opa' });
```

**この 3 行は HTTP を経由しない。** 「end to end」 と名の付く test だが、
前提の組み立てだけは HTTP の外で行う。

session が無い状態で route を叩くと、実測で下の 3 つが返る。

| route | `errorKind` |
|---|---|
| `/mtls` | `mtls_session_not_found` |
| `/zero-trust` | `zt_session_not_found` |
| `/broker` | `broker_session_not_found` |

### 検証の失敗も状態の不整合も 200 で返る

route が返す domain の成否は status で判別できない。非 200 を設定するのは dispatcher になる。

| 種別 | status |
|---|---|
| 成功 / route validator の検証失敗 / route handler が捕捉した状態不整合 | **200** |
| 壊れた JSON | 400 (`body_parse_failed`) |
| 未知の path | 404 (`route_not_found`) |
| POST 以外の method | 405 (`method_not_allowed`) |
| dispatch が応答 object を返さず例外を投げた時 | 500 (`dispatch_failed`) |

### mTLS は前提状態を強制するが、4 呼出の完全な直列ではない

`handshake` は `startMtls` 後の idle 状態を前提にする。`pin` は handshake 後または OCSP 後、
`ocsp` は handshake 後または pin 後、`ct` は idle / failed 以外で実行できる。
したがって E2E の `handshake` → `pin` → `ocsp` → `ct` は有効な 1 順序だが、唯一の順序ではない。
下は idle から各後段を呼んだ時に実測した文言。

| 呼出 | 前提が無い時の `errorKind` |
|---|---|
| `pin` | `verifyPin: session is idle, must have completed handshake` |
| `ocsp` | `verifyOcsp: session is idle, need handshake / pin first` |
| `ct` | `checkCtLog: session is idle, must have handshake first` |

### handshake の JSON 入力は TLS 1.2 も受理する

**5 通りを実測した** (case ごとに新しい server + bootstrap)。

| `tlsVersion` | 結果 |
|---|---|
| `'1.3'` | `{ok: true, tlsVersion: '1.3'}` |
| **`'1.2'`** | **`{ok: true, tlsVersion: '1.2'}`** |
| `'1.1'` | `{ok: false, errorKind: 'tlsVersion_must_be_12_or_13'}` |
| `'zzz'` | 同上 |
| **未指定** | 同上 (必須) |

route validator と mTLS semantics は `1.2` / `1.3` の 2 値だけを許可するため、TLS 1.2 未満は拒む。
一方、TLS 1.3 を最低版として強制する設定は無い。mock adapter は許可された入力値を
`completeHandshake` の結果へ写し、route がその値を応答に写す。

この E2E が接続するのは平文 HTTP の node server で、`tlsVersion` は JSON field である。
したがって保証するのは mock semantics が `'1.2'` を受理することであり、実 transport の
TLS negotiation や client certificate による mTLS 成立ではない。

### zero-trust も 4 段の順序を強制する

`startZeroTrust` → `posture` → `risk` → `jit` → `segment`。 実測した文言。

| 呼出 | 前提が無い時の `errorKind` |
|---|---|
| `risk` | `scoreRisk: posture must be evaluated first` |
| `jit` | `requestJit: risk must be scored first` |
| `segment` | `enforceMicroSegment: JIT must be granted first` |

`posture` は 4 つの真偽値を受け、**1 つでも偽なら `passed: false`** を返す
(ただし `ok: true` で、拒否ではなく評価結果として返る)。

`jit` の route validator について、今回実測した 2 つの分岐。

| 入力 | 結果 |
|---|---|
| `ttlSeconds: 0` | `{ok: false, errorKind: 'ttlSeconds_must_be_positive'}` |
| `justification: ''` | `{ok: false, errorKind: 'justification_required'}` |

**この 2 つは session の状態より先に判定される** (session を作る前でも同じ文言が返る)。

### broker の 4 通り

`mtlsOk` と `ztOk` の組合せで `reason` が分かれる。 **4 通りとも `ok: true`** で返る。

| `mtlsOk` | `ztOk` | `admitted` | `reason` |
|---|---|---|---|
| `true` | `true` | `true` | `admitted` |
| `false` | `true` | `false` | `mtls_denied` |
| `true` | `false` | `false` | `zt_denied` |
| `false` | `false` | `false` | `mtls_and_zt_denied` |

**拒否も `ok: true` になる。** `ok` は「処理できたか」 で、`admitted` が「通したか」 になる。

## 主な品質リスク

- **browser / transport の security 境界を通らない**。`page.request` は API testing helper で、
  mTLS / zero-trust の値は平文 HTTP 上の JSON と mock semantics だけを通る
- **session の作成と終了が HTTP に無い**。 e2e は作成を adapter 直呼びで迂回し、終了を呼ばないため、
  HTTP の外にある lifecycle の配線は検証しない
- **TLS 1.3-only の方針を表現できない**。 JSON field は `'1.2'` / `'1.3'` の 2 値を許可する。
  TLS 1.3 を必須にする呼出側の方針はこの layer では保証されず、実 transport の negotiation も検証しない
- **status が domain の成否を表さない**。 route validator の失敗も、handler が捕捉した状態不整合も 200
- **`ok` と `admitted` の意味が違う**。 broker の拒否は `ok: true` / `admitted: false` で返るため、
  `ok` だけを見る client は拒否を成功と読む
- **`posture` の失敗が拒否にならない**。 `passed: false` を返すだけで後続を止めない
  (止めるのは `risk` を呼ぶ順序の検査であって、`passed` の値ではない)
- **前提状態の失敗が共通 category を持たない**。 `errorKind` は個別の説明文なので、
  呼出側が一括分類するには文字列の列挙が必要になる

## 推奨テスト構成

`startNextServer({ adapter })` が 3 route を node server に載せる。
`makeMockAdapter({ latencyMs: 0 })` を呼出側が作って渡す。

**session の bootstrap を忘れると全経路が `*_session_not_found` になる。**
実測で確認した (最初の probe がこれで全件失敗した)。

順序が結果に効く。zero-trust は前段を飛ばせず、mTLS は各 op が許す前提状態に従う。

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | mTLS の 4 段 | `handshake` / `pin` / `ocsp` / `ct` |
| 2 | zero-trust の 4 段 | `posture` / `risk` / `jit` / `segment` |
| 3 | broker の判定 | `admitted` / `reason` |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-E2E-001 | mTLS 4 呼出 + zero-trust 4 段 + broker 2 通りが 1 つの `APIRequestContext` から連続で通る | mock adapter を載せた server、Chromium BrowserContext に紐づく `page.request`、**adapter を直接呼んで作った 3 session** | `/mtls` を `handshake` → `pin` → `ocsp` → `ct` の順に、`/zero-trust` を `posture` → `risk` → `jit` → `segment` の順に、`/broker` を `mtlsOk: true` と `mtlsOk: false` の 2 通りで投げる | すべて `status===200`。 mTLS は `handshake` が `ok: true`、`pin` が `matched: true`、`ocsp` が `good: true`、`ct` が `sctOk: true`。 zero-trust は `posture` が `passed: true`、`risk` / `jit` / `segment` が `ok: true` で `segment` は `allowed: true`。 broker は 2 通りとも `kind: 'decide'` | P0 | yes | node | `/mtls` `/zero-trust` `/broker` |

## 既存 test との対応

- 探索した runtime — `typescript`
- 探索した path — `examples/dogfood-security-mtls-zero-trust-app/` 配下の `*.test.ts` / `*.test.tsx` / `*.spec.ts` / `*.spec.tsx` (`node_modules` は除外)。 実在したのは `tests/` と `tests/e2e/` の 2 dir
- 探索した test file — 5 件

| TC | 既存 test の候補 | 判定 |
|---|---|---|
| T-E2E-001 | `T-E2E-001 mTLS handshake + pin + OCSP + CT log + posture + risk + JIT + segment + broker end to end` (`examples/dogfood-security-mtls-zero-trust-app/tests/e2e/mtls-zt-flow.spec.ts:42`) | 既覆 (候補) |

## 自動化すべきテスト

既覆 (候補)。

- T-E2E-001 (P0) — `/mtls` を `handshake` → `pin` → `ocsp` → `ct` の順に、`/zero-trust` を `posture` → `risk` → `jit` → `segment` の順に、`/broker` を 2 通りで投げ、mTLS 4 呼出 + zero-trust 4 段 + broker 2 通りが 1 つの `APIRequestContext` から連続で通ることを確かめる

1 件で 3 route / 10 HTTP 呼出を畳んである。 分けないのは mTLS と zero-trust の後段が
同じ session の前提状態に依存するため。

**`status===200` の assert だけでは domain の成否を判別できない。** JSON parse や dispatch 自体の
失敗は 400 / 500 になるが、route validator と route handler が返す失敗は 200 になる。

**broker は 4 通りのうち 2 通りしか通していない** (`mtlsOk: true/ztOk: true` と
`mtlsOk: false/ztOk: true`)。 `zt_denied` と `mtls_and_zt_denied` は未観測。

**この 1 件が覆っていない範囲**。 到達可否は表のとおり。

| 覆っていないもの | 到達 | 理由 |
|---|---|---|
| session が無い時の 3 つの `*_session_not_found` | できる | 必ず bootstrap してから投げている |
| 順序を飛ばした時の 6 つの `errorKind` | できる | 順序どおりに投げている |
| **TLS 1.2 が受理されること** | できる | `1.3` だけを送っている |
| `pin` の不一致 / 空 list | できる | 一致する形だけを送っている |
| `ocsp` の失効 / 未 staple | できる | 良の形だけを送っている |
| `ct` の不足 (`sctCount < minSctRequired`) と境界 (等しい) | できる | 3/2 だけを送っている |
| mTLS の代替順序 (`handshake` → `ocsp` → `pin`、handshake 直後の `ct`) | できる | E2E の 1 順序だけを送っている |
| `posture` の `passed: false` | できる | 全 true だけを送っている |
| `risk` の threat 有り | できる | 全 false だけを送っている |
| `riskScore >= 50` で JIT が `granted: false` になること | できる | riskScore 0 だけを使っている |
| `jit` の `ttlSeconds: 0` / 理由なし | できる | 正しい形だけを送っている |
| `jit` の `ttlSeconds > 3600` / 10 文字未満の理由 | できる | route validator は通るが mock semantics が拒む境界を送っていない |
| `segment` の拒否 | できる | 許可される形だけを送っている |
| broker の `zt_denied` / `mtls_and_zt_denied` | できる | 4 通りのうち 2 通りだけを送っている |
| 重複 handshake / posture と CT の負の `minSctRequired` | できる | 各 step を有効値で 1 回だけ呼んでいる |
| 応答の未 assert field (`sessionId`、handshake の `peerCn` / `tlsVersion`、pin の `fingerprint`、OCSP の `stapled`、CT の `sctCount`) | できる | 各 step の一部 field だけを assert している |
| JIT の `riskScore`、segment の `workload` / `requestedPeer`、broker の `mtlsOk` / `ztOk` | できる | 応答に含まれるが assert していない |
| 3 route の必須 field / 型 / kind の検証失敗 | できる | 正しい形だけを送っている |
| dispatcher の 404 / 405 | できる | 既知の 3 path へ POST だけを送っている |
| 壊れた JSON の 400 | できる | Playwright の `data` で正しい JSON だけを送っている |
| `dispatch_failed` の 500 | 通常入力ではできない | dispatch が例外を投げた時だけの防御経路 |
| session の作成 / 終了 | HTTP からはできない | `start*` / `close*` が route に無い |

route が公開する domain 分岐は、adapter 直呼びの bootstrap を併用すれば HTTP request で選べる。
一方、session の作成 / 終了と、防御用の 500 は通常の HTTP 入力だけでは到達できない。

## 手動確認でよいテスト

(なし)

## 不足している仕様

(なし)
