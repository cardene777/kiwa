# test-spec-mtls-zt-flow (e2e-generic layer)

mTLS の 4 段 / zero-trust の 4 段 / broker の判定を、実 Chromium から順に叩いて確かめる。

画面は描画しない。 `src/lib/next-server.ts` が 3 route を node server に載せ、
Playwright の `page.request` が JSON を投げる。

- module: mtls-zt-flow
- layer: e2e-generic

## 対象機能

| 経路 | kind | 実体 |
|---|---|---|
| `POST /mtls` | `handshake` / `pin` / `ocsp` / `ct` | `src/app/mtls/route.ts` → `src/adapters/mock.ts` |
| `POST /zero-trust` | `posture` / `risk` / `jit` / `segment` | `src/app/zero-trust/route.ts` → 同上 |
| `POST /broker` | `decide` | `src/app/broker/route.ts` → 同上 |

## 仕様の要約

### session の作成は HTTP から到達できない

**この仕様書で最も重要な性質。**

3 つの session (`startMtls` / `startZeroTrust` / `startBroker`) はどの route にも生えていない。
e2e は **adapter を直接呼んで**用意する。

```ts
await adapter.startMtls({ sessionId: 'e2e-mtls', target: 'istio' });
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

status で成否を判別できない。 使うのは dispatcher の 2 種だけ。

| 種別 | status |
|---|---|
| 成功 / 検証失敗 / 状態不整合 | **200** |
| 未知の path | 404 (`route_not_found`) |
| POST 以外の method | 405 (`method_not_allowed`) |

### mTLS は 4 段の順序を強制する

`startMtls` → `handshake` → `pin` → `ocsp` / `ct` の順で、飛ばすと拒む。 実測した文言。

| 呼出 | 前提が無い時の `errorKind` |
|---|---|
| `pin` | `verifyPin: session is idle, must have completed handshake` |
| `ocsp` | `verifyOcsp: session is idle, need handshake / pin first` |
| `ct` | `checkCtLog: session is idle, must have handshake first` |

### handshake は TLS 1.2 も受理する

| `tlsVersion` | 結果 |
|---|---|
| `'1.3'` | `{ok: true, tlsVersion: '1.3'}` |
| **`'1.2'`** | **`{ok: true, tlsVersion: '1.2'}`** |

**最低版の強制が無い。** 応答は受け取った版をそのまま返すだけで、判定に使わない。

### zero-trust も 4 段の順序を強制する

`startZeroTrust` → `posture` → `risk` → `jit` → `segment`。 実測した文言。

| 呼出 | 前提が無い時の `errorKind` |
|---|---|
| `risk` | `scoreRisk: posture must be evaluated first` |
| `jit` | `requestJit: risk must be scored first` |
| `segment` | `enforceMicroSegment: JIT must be granted first` |

`posture` は 4 つの真偽値を受け、**1 つでも偽なら `passed: false`** を返す
(ただし `ok: true` で、拒否ではなく評価結果として返る)。

`jit` は 2 つの検証を持つ。

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

- **session の作成が HTTP に無い**。 e2e が adapter を直接呼んで用意するため、
  **実際の deploy でどう session が作られるかを 1 度も通していない**
- **TLS 1.2 が通る**。 mTLS を主題にする example で最低版を強制していない。
  応答が版をそのまま返すため、古い版で繋いでも成功に見える
- **status が成否を表さない**。 検証失敗も状態不整合も 200
- **`ok` と `admitted` の意味が違う**。 broker の拒否は `ok: true` / `admitted: false` で返るため、
  `ok` だけを見る client は拒否を成功と読む
- **`posture` の失敗が拒否にならない**。 `passed: false` を返すだけで後続を止めない
  (止めるのは `risk` を呼ぶ順序の検査であって、`passed` の値ではない)
- **順序の強制が文言でしか分からない**。 3 つの `errorKind` がすべて別の文言で、
  機械的に分類できる code を持たない

## 推奨テスト構成

`startNextServer({ adapter })` が 3 route を node server に載せる。
`makeMockAdapter({ latencyMs: 0 })` を呼出側が作って渡す。

**session の bootstrap を忘れると全経路が `*_session_not_found` になる。**
実測で確認した (最初の probe がこれで全件失敗した)。

順序が結果に効く。 mTLS も zero-trust も前段を飛ばせない。

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | mTLS の 4 段 | `handshake` / `pin` / `ocsp` / `ct` |
| 2 | zero-trust の 4 段 | `posture` / `risk` / `jit` / `segment` |
| 3 | broker の判定 | `admitted` / `reason` |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-E2E-001 | mTLS 4 段 + zero-trust 4 段 + broker 2 通りが 1 つの page から連続で通る | mock adapter を載せた server、Chromium の page、**adapter を直接呼んで作った 3 session** | `/mtls` を `handshake` → `pin` → `ocsp` → `ct` の順に、`/zero-trust` を `posture` → `risk` → `jit` → `segment` の順に、`/broker` を `mtlsOk: true` と `mtlsOk: false` の 2 通りで投げる | すべて `status===200`。 mTLS は `handshake` が `ok: true`、`pin` が `matched: true`、`ocsp` が `good: true`、`ct` が `sctOk: true`。 zero-trust は `posture` が `passed: true`、`risk` / `jit` / `segment` が `ok: true` で `segment` は `allowed: true`。 broker は 2 通りとも `kind: 'decide'` | P0 | yes | node | `/mtls` `/zero-trust` `/broker` |

## 自動化方針

1 件で 3 route / 9 呼出を畳んである。 分けないのは 8 つが順序を強制するため。

**`status===200` の assert は空振りになる。** route へ到達すれば必ず 200 が返る。

**broker は 4 通りのうち 2 通りしか通していない** (`mtlsOk: true/ztOk: true` と
`mtlsOk: false/ztOk: true`)。 `zt_denied` と `mtls_and_zt_denied` は未観測。

**この 1 件が覆っていない範囲**。 いずれも同じ経路から到達できる。

| 覆っていないもの | 到達 | 理由 |
|---|---|---|
| session が無い時の 3 つの `*_session_not_found` | できる | 必ず bootstrap してから投げている |
| 順序を飛ばした時の 6 つの `errorKind` | できる | 順序どおりに投げている |
| **TLS 1.2 が受理されること** | できる | `1.3` だけを送っている |
| `pin` の不一致 / 空 list | できる | 一致する形だけを送っている |
| `ocsp` の失効 / 未 staple | できる | 良の形だけを送っている |
| `ct` の不足 (`sctCount < minSctRequired`) と境界 (等しい) | できる | 3/2 だけを送っている |
| `posture` の `passed: false` | できる | 全 true だけを送っている |
| `risk` の threat 有り | できる | 全 false だけを送っている |
| `jit` の `ttlSeconds: 0` / 理由なし | できる | 正しい形だけを送っている |
| `segment` の拒否 | できる | 許可される形だけを送っている |
| broker の `zt_denied` / `mtls_and_zt_denied` | できる | 4 通りのうち 2 通りだけを送っている |
| dispatcher の 404 / 405 | できる | 既知の 3 path へ POST だけを送っている |

到達できない範囲は無い。 ただし **session の作成は HTTP に無い**ため、
その経路だけは e2e が adapter を直接呼んで迂回している。
