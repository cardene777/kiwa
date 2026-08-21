# test-spec-siem-incident-flow (e2e-generic layer)

監査記録の構造化と封印 / 障害対応の手順 / 2 つを束ねた判断の 3 経路を、Chromium の
BrowserContext に紐づく Playwright `APIRequestContext` から順に叩いて確かめる。

画面は描画しない。 `src/lib/next-server.ts` が 3 route を node server に載せ、
Playwright の `page.request` が JSON を投げる。これは `page.context().request` と同じ
API testing helper で、Chromium page 内の `fetch` ではない。

server code が明示的に設定する response header は `content-type: application/json` だけで、
封印の値も深刻度も JSON body の field として返る。

実測した実 response header は下の 5 つで、`content-type` 以外は Node が付ける。

```
content-type: application/json
date: ...
connection: keep-alive
keep-alive: timeout=5
content-length: ...
```


- module: siem-incident-flow
- layer: e2e-generic

## 対象機能

| 経路 | 実体 |
|---|---|
| `POST /siem` | `src/app/siem/route.ts` → `src/adapters/mock.ts` |
| `POST /incident` | `src/app/incident/route.ts` → 同上 |
| `POST /ir-orchestrator` | `src/app/ir-orchestrator/route.ts` → 同上 |

## 仕様の要約

### 検証の失敗も 200 で返る

status で成否を判別できない。

| 種別 | status | body |
|---|---|---|
| 成功 | 200 | `{ok: true, ...}` |
| **route validator の検証失敗** | **200** | `{ok: false, errorKind: '...'}` |
| **route handler が捕捉した adapter の失敗** | **200** | `{ok: false, kind, ..., errorKind: '...'}` |
| 壊れた JSON | 400 | `{ok: false, errorKind: 'body_parse_failed'}` |
| 未知の path | 404 | `{ok: false, errorKind: 'route_not_found'}` |
| POST 以外の method | 405 | `{ok: false, errorKind: 'method_not_allowed'}` |
| dispatch が応答 object を返さず例外を投げた時 | 500 | `{ok: false, errorKind: 'dispatch_failed'}` |

dispatcher は `dogfood-security-sbom-scanning-app` の同名 file と完全に一致する。
route 名を伏せて `diff` を取ると差分は 0 行になる。

**404 は POST でしか出ない。** method の検査が route の照合より前にあるため、
実測で `POST /missing` は 404、`GET /siem` と `GET /missing` はどちらも 405 になった。

### `errorKind` に 2 種類の語彙が混ざる

**この仕様書で最も重要な性質。** 同じ field に、機械向けの短い符号と人間向けの英文が混在する。

| 失敗の出どころ | `errorKind` の形 | 実測値 |
|---|---|---|
| route validator | 短い符号 | `sessionId_required` / `kind_must_be_decide` |
| adapter の session 検査 | 短い符号 | `siem_session_not_found` / `incident_session_not_found` |
| **semantics の状態機械** | **英文** | `sealEvents: no structured events to seal` |
| | | `classifySeverity: playbook must be triggered first` |
| | | `structureEvent: session is sealed, cannot structure` |

英文は `packages/security/src/semantics/` の `throw new Error(...)` の message がそのまま
`errorKind` に載ったもので、route が `err.message` を写している。
**呼出側が `errorKind` を分岐に使うと、状態機械側の文言変更で分岐が黙って外れる。**

### `/siem` と `/incident` に session を作る kind が無い

`/siem` の kind は `structure` / `seal` / `retention` / `correlate` の 4 つ、
`/incident` は `playbook` / `severity` / `escalate` / `forensics` / `post-mortem` の 5 つで、
**どちらにも `start` が無い。**

session は adapter を直接呼んで作る。

| 呼出 | 何を作るか |
|---|---|
| `adapter.startSiem({ sessionId, target })` | `/siem` の session |
| `adapter.startIncident({ sessionId, target })` | `/incident` の session |
| `adapter.startOrchestrator({ sessionId, siemTarget, incidentTarget })` | `/ir-orchestrator` の session |

session が無い状態で route を叩くと `*_session_not_found` になる。
**`target` は HTTP から選べない。** `siem-splunk` 等の宛先は adapter 呼出でしか渡せない。

同じ id で 2 度 `startSiem` を呼ぶと `siem_session_exists` を投げる。 実測で確認した。
同じ repo の `dogfood-security-sbom-scanning-app` は逆に `Map.set` で黙って置き換えるため、
2 つの example で `start` の意味が反対になっている。

### `/siem` は一方通行の状態機械

`idle` → `structured` → `sealed` → `retention-tagged` → `correlated` の順にしか進めない。
実測した順序違反。

| 呼出 | 直前の状態 | 結果 |
|---|---|---|
| `seal` | `idle` | `{ok: false, errorKind: 'sealEvents: no structured events to seal'}` |
| `retention` | `structured` | `{ok: false, errorKind: 'applyRetention: events must be sealed first'}` |
| `correlate` | `sealed` | `{ok: false, errorKind: 'correlate: retention must be applied first'}` |

`structure` だけが `idle` と `structured` の両方から呼べるので、複数の記録を積める。
`eventId` は `evt-1` から 1 ずつ増える。

**戻れないので、各 kind は 1 度しか成功しない。** 実測した再呼出。

| 再呼出 | 結果 |
|---|---|
| `structure` (封印後) | `structureEvent: session is sealed, cannot structure` |
| **`seal` (封印後)** | **`sealEvents: no structured events to seal`** |
| **`retention` (適用後)** | **`applyRetention: events must be sealed first`** |
| **`correlate` (照合後)** | **`correlate: retention must be applied first`** |

太字の 3 行は **文言が事実と食い違う**。 2 件目の `seal` が言う「構造化された記録が 0 件」 は誤りで、
実測では 2 件積んだ後に出ている。 実際の原因は状態が `sealed` へ進んでいることの方になる。
`retention` と `correlate` も同じ形で、既に済ませた前段を「まだやっていない」 と報告する。

`/siem` と `/incident` には `close` 相当の kind が無く、`startSiem` / `startIncident` は
既存 session を拒む。 **したがって HTTP だけでは 1 つの id で手順を 2 度回せない。**
別の id を使うか、adapter の `closeSiem` / `closeIncident` を直接呼んで作り直す。
実測で `closeSiem` → `startSiem` の後は `eventId` が `evt-1` に戻った。

### 照合の窓は結果に効かない

`correlate` の一致判定は「要求された `eventId` が全て構造化済か」 だけで決まる。
`windowMs` は応答にも判定にも使われず、`metadata` に記録されるだけになる。

実測で `windowMs: 1` を渡しても `matched: true` が返った。
**時間の窓を名前に持つ引数が、時間を一切見ていない。**

**一致しなくても `ok: true` になる。** 実測で、存在しない `evt-99` を要求すると
`{ok: true, kind: 'correlate', matched: false}` が返った。 照合結果は `matched` にしか出ない。

`requiredEventIds` は route validator が文字列以外を **黙って捨てる**。
実測で `[42]` を渡すと空配列に潰れ、状態機械側の
`correlate: rule must require >= 1 event id` に落ちた。 空配列を直接渡した時と同じ応答になり、
**型の誤りと件数の不足を区別できない。**

### 封印は 32 bit の非暗号 hash

`sealHash` は `packages/security/src/semantics/siem-audit.ts` の `simpleHash` が作る。
32 bit に丸めた値を 16 進で並べ、頭に `sha-` を付けているだけで、SHA 系の実装ではない。

実測した性質。

| 入力 | `sealHash` |
|---|---|
| `previousHash: 'sha-0'` + 同じ記録 1 件 | `sha-52a5f3c9` |
| 同上 (別 session、同じ入力) | `sha-52a5f3c9`。 再現する |
| `previousHash: 'different-prev'` | `sha-570790c1` |
| **`previousHash: ''`** | **`sha-6e3217da`**。 空文字も受理される |

再現するのは hash として正しい挙動だが、**32 bit では衝突を作れるため
「tamper-evident」 の語が保証する強度には届かない。** route validator は
`previousHash` が文字列であることしか見ないので、鎖の前段を空文字にしても通る。

### 保存期間は合計するだけ

`retention` は `hotDays` / `warmDays` / `coldDays` を足して `totalDays` を返す。
実測で `7 + 30 + 335` は `372` になった。

**`legalHold` は受け取るが応答に出ず、後続の判定にも効かない。**
`0 / 0 / 0` と `legalHold: true` の組合せは `{ok: true, totalDays: 0}` を返す。
保存期間 0 日の方針が、法的保全を立てたまま成功として通る。

### `/incident` も一方通行の状態機械

`idle` → `playbook-triggered` → `severity-classified` → `escalated` → `forensics-captured` →
`post-mortem-recorded` の順にしか進めない。 実測した順序違反。

| 呼出 | 結果 |
|---|---|
| `severity` (手順の起動前) | `classifySeverity: playbook must be triggered first` |
| `escalate` (深刻度の判定前) | `escalate: severity must be classified first` |
| `forensics` (連絡前) | `captureForensics: escalation must complete first` |
| `post-mortem` (証跡の採取前) | `recordPostMortem: forensics must be captured first` |

**`playbook` は session ごとに 1 度しか通らない。** 2 度目は
`triggerPlaybook: session is playbook-triggered, must be idle` になる。
`idle` へ戻す経路は HTTP に無く、`adapter.closeIncident` で session ごと消してから
`startIncident` で作り直すしかない。 実測でこの 2 手を踏むと `playbook` が再び通った。

`severity` の再判定も同じく塞がっている。 実測で 2 度目は
`classifySeverity: playbook must be triggered first` になった。 状態は既に
`severity-classified` へ進んでいるため、文言と実際の原因が食い違う。

### 深刻度の階段

`affectedUsers` / `dataClassification` / `serviceDown` の 3 つから 5 段を決める。
境界を実測した。

| 入力 | 深刻度 |
|---|---|
| `restricted` + 停止 | `sev1` |
| `restricted` のみ | `sev2` |
| 停止 + 1001 人 | `sev1` |
| **停止 + 1000 人** | **`sev2`**。 判定は `> 1000` で等号を含まない |
| 停止 + 101 人 | `sev2` |
| **停止 + 100 人** | **`sev4`**。 `> 100` を外れ、`> 10` に落ちる |
| `confidential` + 停止なし | `sev3` |
| 11 人 | `sev4` |
| **10 人** | **`sev5`** |

**100 人と 101 人の間で 2 段飛ぶ。** どちらも service が停止しているのに、
100 人は `sev4`、101 人は `sev2` になる。 階段が連続していない。

同じ階段が 2 箇所に実装されている。 `packages/security/src/semantics/incident-response.ts` の
`classifySeverity` と、`src/adapters/mock.ts` の `classifySeverityFromInputs` で、
後者は先頭に「照合が一致しなければ `sev5`」 の 1 行を足しただけの写しになる。
**片方だけ直すと 2 つの経路が別の深刻度を返す。**

### 証跡は大きさ 0 を数えない

`forensics` の `artifactCount` は、3 つの大きさのうち **0 より大きいものの件数** になる。
route validator は 0 を受理する (`>= 0` の検査) ため、`0 / 0 / 0` は
`{ok: true, artifactCount: 0}` を返す。 実測で確認した。

証跡を 1 件も採らなかった状態が成功として通り、`ok` からは区別できない。

`escalate` の `channels` も文字列以外を黙って捨てる。 実測で `[42]` は空配列に潰れ、
`escalate: at least one channel required` に落ちた。
**`onCallSecondary` は省略できない。** key ごと落とすと
`onCallSecondary_must_be_string_or_null` になるため、不在は `null` を明示して伝える。

`post-mortem` の `rootCause` は 10 文字以上を要求する。 実測で 9 文字は
`rootCause_must_be_at_least_10_chars` になった。

**`contributingFactors` の件数は応答に出ない。** adapter は
`contributingFactorCount` を計算して返すが、route の `IncidentResponse` にこの field が無く、
handler も写していない。 実測で 3 件を送った時の応答 key は
`ok` / `kind` / `sessionId` / `rootCause` / `actionItemCount` の 5 つだけだった。
呼出側は寄与要因が記録されたかを応答から確かめられない。

### 束ねた判断は呼出側の申告をそのまま信じる

`/ir-orchestrator` の `incidentTriggered` は `correlationMatched` の写しで、
`/siem` の照合結果を参照しない。 **同じ adapter に監査 session があっても突き合わせない。**

実測した 3 通り。

| 入力 | 応答 |
|---|---|
| `correlationMatched: true` + 5000 人 + `confidential` + 停止 | `{incidentTriggered: true, severity: 'sev1'}` |
| **`correlationMatched: false` + 5000 人 + `restricted` + 停止** | **`{incidentTriggered: false, severity: 'sev5'}`** |
| `correlationMatched: true` + 0 人 + `public` + 停止なし | `{incidentTriggered: true, severity: 'sev5'}` |

2 行目が境界になる。 最も重い区分の data が漏れ service も停止している状況が、
呼出側が `false` と申告しただけで **参考情報の `sev5`** に落ちる。

**`/ir-orchestrator` に状態機械は無い。** 同じ session へ何度でも `decide` を投げられる。
`/siem` と `/incident` が一方通行なのと対照的になる。

`closeOrchestrator` は `closed` を立てた直後に session を Map から削除する。
そのため `orchestrator_session_closed` は返らず、実測では常に
`orchestrator_session_not_found` が先に出た。 **到達しない分岐が 1 つ残っている。**

## 主な品質リスク

- **`errorKind` に符号と英文が混在する**。 状態機械側の失敗は `throw new Error` の message が
  そのまま載るため、文言を直すと呼出側の分岐が黙って外れる
- **再呼出の文言が事実と食い違う**。 2 度目の `seal` は「構造化された記録が 0 件」 と言うが実際は 2 件、
  2 度目の `retention` と `correlate` も済ませた前段を「まだやっていない」 と報告する
- **照合の窓が判定に効かない**。 `windowMs` は記録されるだけで、`1` を渡しても一致する。
  時間の窓を設定したつもりの呼出側は、実際には event id の集合しか見ていない
- **一致しない照合が `ok: true` で返る**。 `matched` を読まない呼出側は不一致を成功と読む
- **封印が 32 bit の非暗号 hash**。 `sha-` の接頭辞と「tamper-evident」 の語に対して強度が伴わず、
  `previousHash` に空文字を渡しても鎖が成立する
- **`legalHold` が受け取られるだけで効かない**。 応答にも出ないため、法的保全を立てたことを
  呼出側が確認できない。 保存期間 0 日との組合せも成功する
- **深刻度の階段が連続していない**。 service 停止時、100 人は `sev4` で 101 人は `sev2` になり、
  境界で 2 段飛ぶ
- **深刻度の階段が 2 箇所に実装されている**。 semantics 側と adapter 側の写しがあり、
  片方だけ直すと `/incident` と `/ir-orchestrator` が別の値を返す
- **束ねた判断が呼出側の申告を検証しない**。 `incidentTriggered` は `correlationMatched` の写しで、
  最も重い区分の状況でも申告 1 つで `sev5` に落ちる
- **証跡 0 件が成功として通る**。 大きさ 0 の 3 件は数えられず `artifactCount: 0` になる
- **配列 field の型の誤りが黙って潰される**。 `requiredEventIds` / `channels` /
  `contributingFactors` / `actionItems` は文字列以外を捨てるため、型の誤りが件数の不足として
  報告され、呼出側が原因を取り違える
- **`contributingFactors` の件数が応答から落ちる**。 adapter は数えるが route が写さないため、
  寄与要因が記録されたかを呼出側が確認できない
- **`orchestrator_session_closed` に到達できない**。 close が session を削除するため、
  常に `not_found` が先に出る

## 推奨テスト構成

`startNextServer({ adapter })` が 3 route を node server に載せ、空き port で listen する。
`makeMockAdapter({ latencyMs: 0 })` を呼出側が作って渡すため、server と adapter の寿命は分けられる。

**この example は bootstrap を 3 回持つ。** `/siem` と `/incident` と `/ir-orchestrator` の
どれにも `start` の kind が無いため、`adapter.startSiem` / `startIncident` / `startOrchestrator` を
直接呼んでから route を叩く (同じ構造の sbom-scanning は `start` が kind として公開されている)。

session は id ごとに一方通行で、`/siem` と `/incident` は同じ id で手順を 2 度回せない。
**test を分ける時は id も分ける。**

`page.request.post` は BrowserContext と cookie jar を共有するが、browser の navigation / renderer /
同一 origin 制約 / Service Worker は通らない。

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | 監査記録の構造化と封印 | `eventId` / `sealHash` / `eventCount` |
| 2 | 保存期間と照合 | `totalDays` / `matched` |
| 3 | 障害対応の手順 | `severity` / `channelCount` / `artifactCount` / `actionItemCount` |
| 4 | 束ねた判断 | `incidentTriggered` / `severity` |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-E2E-001 | 監査 / 障害対応 / 束ねた判断が 1 つの `APIRequestContext` から連続で通る | mock adapter を載せた server と Chromium BrowserContext に紐づく `page.request`、`startSiem` / `startIncident` / `startOrchestrator` で作った 3 session | `/siem` (`structure` → `seal` → `retention` → `correlate`) → `/incident` (`playbook` → `severity` → `escalate` → `forensics` → `post-mortem`) → `/ir-orchestrator` (`decide` を一致あり / 一致なしで 2 回) を順に投げる | 構造化は `status===200` で `{ok: true, eventId: 'evt-1'}`。 封印は `{ok: true, eventCount: 1}`。 保存期間は `{ok: true, totalDays: 372}`。 照合は `{ok: true, matched: true}`。 手順は `playbookId==='suspicious-login'`、深刻度は `'sev1'`、連絡は `{channelCount: 2, hasSecondary: true}`、証跡は `artifactCount===3`、記録は `actionItemCount===2`。 束ねた判断は一致ありで `{incidentTriggered: true, severity: 'sev1'}`、一致なしで `{incidentTriggered: false, severity: 'sev5'}` | P0 | yes | node | `/siem` `/incident` `/ir-orchestrator` |

## 既存 test との対応

- 探索した runtime — `typescript`
- 探索した path — `examples/dogfood-security-siem-incident-app/` 配下の `*.test.ts` / `*.test.tsx` / `*.spec.ts` / `*.spec.tsx` (`node_modules` は除外)。 実在したのは `tests/` と `tests/e2e/` の 2 dir
- 探索した test file — 5 件

| TC | 既存 test の候補 | 判定 |
|---|---|---|
| T-E2E-001 | `T-E2E-001 structured + seal + retention + correlate + playbook + severity + escalate + forensics + post-mortem + orchestrator end to end` (`examples/dogfood-security-siem-incident-app/tests/e2e/siem-incident-flow.spec.ts:43`) | 既覆 (候補) |

## 自動化すべきテスト

既覆 (候補)。

- T-E2E-001 (P0) — 監査 / 障害対応 / 束ねた判断を 1 つの `APIRequestContext` から順に実行する happy path

T-E2E-001 は 11 手を 1 件に畳んである。 分けないのは `/siem` と `/incident` が一方通行の
状態機械で、各手が直前の状態を前提にするため。 途中で切ると後半だけを実行できない。

**`status===200` の assert だけでは domain の成否を判別できない。** JSON parse や dispatch 自体の
失敗は 400 / 500 になるが、route validator と route handler が返す失敗は 200 なので、
domain の成否を判別しているのは `toMatchObject({ok: true, ...})` の方になる。

**この test は束ねた判断が照合結果を見ていないことを、意図せず示している。**
`/siem` の `correlate` は `matched: true` を返しているのに、直後の 2 回目の `decide` には
`correlationMatched: false` を渡して `sev5` を受け取っている。 2 つが同じ adapter を共有していても
突き合わせは起きない。

**この 1 件が覆っていない範囲**。 到達可否は表のとおり。

| 覆っていないもの | 到達 | 理由 |
|---|---|---|
| 順序違反が返す 4 種の英文 `errorKind` | できる | 正しい順序でしか送っていない |
| 再呼出の文言が事実と食い違うこと | できる | 各 kind を 1 度ずつしか送っていない |
| `structure` を 2 件以上積んだ時の `eventId` と `eventCount` | できる | 1 件だけ送っている |
| `windowMs` が判定に効かないこと | できる | `60000` の 1 通りしか送っていない |
| `matched: false` が `ok: true` で返ること | できる | 存在する `evt-1` だけを要求している |
| `requiredEventIds` / `channels` の非文字列が黙って捨てられること | できる | 文字列だけを送っている |
| `sealHash` の値と `previousHash` による変化 | できる | `eventCount` しか assert していない |
| `previousHash: ''` が受理されること | できる | `'sha-0'` を送っている |
| `legalHold: true` が応答に出ないこと | できる | `false` を送り、`totalDays` しか見ていない |
| 保存期間 `0 / 0 / 0` が通ること | できる | `7 / 30 / 335` を送っている |
| 深刻度の階段の 9 通りと、100 人と 101 人の段差 | できる | `5000` 人の 1 通りしか送っていない |
| semantics 側と adapter 側の階段が一致すること | 一部できる | 同じ入力 1 通りで両経路とも `sev1` を assert しているが、残り 8 通りは比べていない |
| `artifactCount` が大きさ 0 を数えないこと | できる | 3 つとも正の値を送っている |
| `onCallSecondary` を省略した時の失敗 | できる | 常に明示している |
| `rootCause` が 10 文字未満の時の失敗 | できる | 43 文字を送っている |
| `contributingFactorCount` | **できない** | adapter は数えるが route が応答に載せない |
| `decide` を同じ session へ繰り返せること | できる | 2 回送っているが、繰り返せること自体は assert していない |
| `startSiem` の重複が `siem_session_exists` になること | できる | 各 id を 1 回だけ開始している |
| `*_session_not_found` の 3 種 | できる | 先に session を作っている |
| `orchestrator_session_closed` | **できない** | close が session を削除するため `not_found` が先に出る |
| route validator が返す各 `ok: false` | できる | 正常な入力だけを送っている |
| 未知の path の 404 と POST 以外の 405 | できる | 正常な path と method だけを送っている |
| 壊れた JSON の 400 | できる | Playwright の `data` で正しい JSON だけを送っている |
| `dispatch_failed` の 500 | 通常入力ではできない | dispatch が例外を投げた時だけの防御経路 |
| adapter が記録する trace | HTTP からはできない | trace を返す route が無く、`traces()` を直接読む必要がある |
| `target` の指定 (`siem-splunk` 等) | HTTP からはできない | adapter 呼出でしか渡せない |

到達できない 5 つは性質が 3 つに分かれる。 `orchestrator_session_closed` は
**実装上どの入力でも到達しない** 死んだ分岐、`contributingFactorCount` は
**adapter が計算した値を route が捨てている** ため応答に現れない、
残り 3 つは HTTP の口が無いか防御用の経路になる。
**HTTP の口の数と、その下にある route / adapter / semantics の分岐の数は別になる。**

## 手動確認でよいテスト

(なし)

## 不足している仕様

(なし)
