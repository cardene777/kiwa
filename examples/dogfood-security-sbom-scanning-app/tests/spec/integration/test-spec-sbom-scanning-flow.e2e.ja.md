# test-spec-sbom-scanning-flow (e2e-generic layer)

部品表の組み立て / 秘密情報の走査 / 脆弱性の突き合わせの 3 経路を、Chromium の BrowserContext に
紐づく Playwright `APIRequestContext` から順に叩いて確かめる。

画面は描画しない。 `src/lib/next-server.ts` が 3 route を node server に載せ、
Playwright の `page.request` が JSON を投げる。これは `page.context().request` と同じ
API testing helper で、Chromium page 内の `fetch` ではない。

server code が明示的に設定する response header は `content-type: application/json` だけで、
組み立てた文書も走査の結果も JSON body の field として返る。

実測した実 response header は下の 5 つで、`content-type` 以外は Node が付ける。

```
content-type: application/json
date: ...
connection: keep-alive
keep-alive: timeout=5
content-length: ...
```


- module: sbom-scanning-flow
- layer: e2e-generic

## 対象機能

| 経路 | 実体 |
|---|---|
| `POST /sbom` | `src/app/sbom/route.ts` → `src/adapters/mock.ts` |
| `POST /secrets-scan` | `src/app/secrets-scan/route.ts` → 同上 |
| `POST /scanner` | `src/app/scanner/route.ts` → 同上 |

## 仕様の要約

### 検証の失敗も 200 で返る

**この仕様書で 2 番目に重要な性質。** status で成否を判別できない。

| 種別 | status | body |
|---|---|---|
| 成功 | 200 | `{ok: true, ...}` |
| **route validator の検証失敗** | **200** | `{ok: false, errorKind: '...'}` |
| **route handler が捕捉した adapter の失敗** | **200** | `{ok: false, kind, ..., errorKind: '...'}` |
| 壊れた JSON | 400 | `{ok: false, errorKind: 'body_parse_failed'}` |
| 未知の path | 404 | `{ok: false, errorKind: 'route_not_found'}` |
| POST 以外の method | 405 | `{ok: false, errorKind: 'method_not_allowed'}` |
| dispatch が応答 object を返さず例外を投げた時 | 500 | `{ok: false, errorKind: 'dispatch_failed'}` |

dispatcher は `src/lib/next-server.ts` にあり、`diff` で比べると
`dogfood-security-siem-incident-app` の同名 file と route 名以外は一致する。

**404 は POST でしか出ない。** method の検査が route の照合より前にあるため、
`GET /missing` は 404 ではなく 405 になる。 実測で 3 通りを確かめた。

| request | status | `errorKind` |
|---|---|---|
| `POST /missing` | 404 | `route_not_found` |
| `GET /sbom` | 405 | `method_not_allowed` |
| **`GET /missing`** | **405** | `method_not_allowed` |

path の照合は完全一致か `?` 始まりの後続だけを受ける。 実測で `POST /sbom?q=1` は 200、
**`POST /sbom/` は 404** になった。 末尾の `/` は別の path として扱われる。

### `ok: false` に `errorKind` が付かない経路が 1 つだけある

**この仕様書で最も重要な性質。**

`/sbom` の `kind: 'validate'` は、他の全 kind と違って `ok` に **操作の成否ではなく
部品表の検証結果** を載せる。 実測した 2 通り。

| 入力 | 応答 |
|---|---|
| 全部品の `purl` が `pkg:` 始まり | `{ok: true, kind: 'validate', errors: []}` |
| `purl` が `pkg:` 始まりでない部品を含む | **`{ok: false, kind: 'validate', errors: ['component bad has invalid purl (npm/bad@1), must start with "pkg:"']}`** |

後者に `errorKind` は付かない。 `ok` だけを見る呼出側は「操作が失敗した」 と読むが、
実際には操作は成功していて、検証が誤りを 1 件見つけただけになる。
逆に `errorKind` の有無で失敗を判別する呼出側は、この検証失敗を見逃す。

**`purl` の形は追加時には検査されない。** route validator は空でない文字列であることしか見ないため、
`npm/bad@1` のような値でも `addComponent` は `{ok: true, componentCount: 1}` を返す。
`pkg:` 始まりの検査は `validate` を呼んだ時にだけ走る。

### `/sbom` の 7 kind

必須は `sbomId` と `kind` の 2 つ。 実測した分岐。

| 入力 | 結果 |
|---|---|
| `kind: 'start'` | `{ok: true, kind: 'start'}` |
| `kind: 'addComponent'` (`name` / `version` / `purl` 揃い) | `componentCount` が加算後の件数 |
| **同じ `purl` を再度 `addComponent`** | `{ok: false, errorKind: 'sbom_component_duplicate'}` |
| `kind: 'emitCycloneDx'` | `format: 'cyclonedx'` / `formatVersion: '1.5'` |
| `kind: 'emitSpdx'` | `format: 'spdx'` / `formatVersion: '2.3'` |
| `nowIso` を渡した `emit` | `document.generatedAtIso` がその値になる |
| `kind: 'evaluateLicense'` | `verdicts` と `overallVerdict` |
| `sbomId` 欠落 / 空文字 | `{ok: false, errorKind: 'sbomId_required'}` |
| 未知の `kind` | `{ok: false, errorKind: 'kind_unrecognised'}` |
| `addComponent` で `component` 欠落 | `{ok: false, errorKind: 'component_required'}` |
| body が **配列** | `{ok: false, errorKind: 'sbomId_required'}` |
| body が `null` / 文字列 / 数値 | `{ok: false, errorKind: 'body_not_object'}` |

配列が `sbomId_required` になるのは `typeof [] === 'object'` のため。 型の誤りが値の欠落として
報告されるので、呼出側が原因を取り違える。

**空 body は 400 にならない。** server が `raw.length === 0` を `{}` に読み替えるため、
`sbomId_required` (200) が返る。 実測で `data` を渡さない場合も同じ結果になった。

### `start` が既存の部品表を黙って捨てる

`startSbom` は `Map.set` で session を置き換える。 実測で、部品を 3 件積んだ `sbomId` に
`kind: 'start'` を投げ直すと `{ok: true}` が返り、直後の `evaluateLicense` は
`verdicts: []` / `overallVerdict: 'allow'` になった。

**同名 session の作り直しは成功として報告され、失われた部品の件数はどこにも出ない。**
同じ repo の `dogfood-security-siem-incident-app` は逆の扱いで、既存 session への
`adapter.startSiem` を `siem_session_exists` で拒む (あちらは `start` を HTTP に公開していないため、
比較の相手は adapter 呼出になる)。 2 つの example で作り直しの意味が反対になっている。

### 閉じた部品表に書けないが読めてしまう

`close` は session を消さず `closed` の印を付ける。 閉じた後に、session を作り直す `start` を除く
6 kind を実測した。

| `close` 後の操作 | 結果 |
|---|---|
| `addComponent` | `{ok: false, errorKind: 'sbom_session_closed'}` |
| **`emitCycloneDx` / `emitSpdx`** | **`{ok: true, ...}`**。 閉じた後も文書を出せる |
| **`validate` / `evaluateLicense`** | **成功する**。 `closed` を見ない |
| **`close`** | **`{ok: true}`**。 何度でも閉じられる |

`closed` を検査するのは `addComponent` だけで、残り 5 kind は素通しする。

### ライセンス判定は「不明」 を warn に倒す

`evaluateLicense` は `DEFAULT_LICENSE_POLICY` を使う。 実測した判定。

| 部品の `license` | `verdict` |
|---|---|
| `MIT` | `allow` |
| `GPL-3.0` | `deny` |
| **未指定 (`license` field なし)** | **`warn`**、応答の `license` は `null` |

全体の判定は deny が 1 件でもあれば `deny`、次に `warn`、どちらも無ければ `allow` になる。

**部品が 0 件だと `allow` になる。** 空の部品表は「危険なものが無い」 と「まだ何も調べていない」 を
区別しない。

### 秘密情報の走査

`start` は `rotateWithinDays` に **正の数** を要求する。 実測で `0` と `-1` はどちらも
`rotateWithinDays_required` になった。

`AKIAIOSFODNN7EXAMPLE` を含む 1 行を走査すると、検出は **ちょうど 1 件** になる。

```
kind: 'aws-access-key'
matched: 'AKIAIOSFODNN7EXAMPLE'
line: 1, column: 12
entropy: 3.6841837197791887
```

8 種の signature のうち `aws-secret-key` だけが entropy の下限 (3.5) を持つ。 実測した 2 例。

| 入力 (いずれも 40 文字) | entropy | 検出 |
|---|---|---|
| `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` | 4.663 | `aws-secret-key` |
| `abab…ab` (`ab` の 20 回) | 1.0 | **なし** |

複数行 / 複数 signature は行ごとに列挙され、`line` は 1 始まりになる。

### 走査をやり直すと検出だけが消えて追跡が残る

`scanSource` は `session.findings` を **置き換える** が、`session.trackers` には触らない。
実測した 4 手。

| 手順 | 結果 |
|---|---|
| 秘密を含む source を走査 → `trackRotation(0)` | `{ok: true, findingKind: 'aws-access-key'}` |
| 秘密を含まない source で走査し直す | `{ok: true, findings: []}` |
| **`markRotated(0)`** | **`{ok: true, findingKind: 'aws-access-key'}`**。 消えたはずの検出を報告する |
| `trackRotation(0)` | `{ok: false, errorKind: 'secrets_finding_missing'}` |

同じ index に対して `markRotated` は通り `trackRotation` は落ちる。
**`markRotated` は `trackers` を、`trackRotation` は `findings` を見ているため。**

### 期限超過の判定

`markRotated` は追跡を更新する **前** の状態で期限超過を判定する。 実測した境界。

| 期限 | 発見から交換までの日数 | `overdue` |
|---|---|---|
| 30 日 | 3 日 | `false` |
| 1 日 | 5 日 | `true` |
| **1 日** | **ちょうど 1 日** | **`false`**。 判定は `>` で、等号を含まない |

**2 回目の `markRotated` は必ず `false` を返す。** 判定は `rotatedAtMs !== null` で先に打ち切るため、
1 度交換を記録した後は何日後に呼んでも期限内として報告される。
実測で、30 日の期限に対して 99 日後の再記録が `overdue: false` になった。

`trackRotation` を経ずに `markRotated` を呼ぶと `secrets_tracker_missing` になる。

### 閉じた走査 session の扱いが操作ごとに割れる

`close` 後の実測。

| 操作 | 結果 |
|---|---|
| `scan` | `{ok: false, errorKind: 'secrets_session_closed'}` |
| **`trackRotation`** | **成功する** |
| **`markRotated`** | **成功する** |

`closed` を見るのは `scan` だけになる。 部品表側と同じ非対称がここにもある。

### 突き合わせの判定

`/scanner` は `kind: 'lookup'` と `kind: 'report'` を持ち、応答の形が違う。

| `kind` | 応答に含まれる field |
|---|---|
| `lookup` | `advisories` (`componentPurl` / `advisoryIds` / `severity`) |
| `report` | `componentCount` / `vulnerableCount` / `secretsCount` / `licenseDenies` / `overallVerdict` |

判定は「critical か high の脆弱性」 か「ライセンス deny」 があれば `deny`、
脆弱性が 1 件でもあるか秘密が 1 件でもあるかライセンス warn があれば `warn`、
どれも無ければ `allow` になる。 実測した 5 通り。

| 入力 | `overallVerdict` |
|---|---|
| critical 1 件 (該当あり) | `deny` |
| medium 1 件 (該当あり) + 秘密 1 件 | `warn` |
| 脆弱性なし + 秘密 1 件 | `warn` |
| 部品 1 件 (MIT) + 脆弱性なし + 秘密なし | `allow` |
| **部品 0 件 + critical を含む feed** | **`allow`** |

最後の行が境界になる。 **部品表が空なら、どれだけ危険な feed を渡しても `allow` が返る。**

**`vulnerableCount` は勧告の件数ではなく部品の件数を数える。** 実測で、同じ部品に当たる
critical と medium の 2 件を渡しても `vulnerableCount` は `1` だった。
同じ入力の `lookup` は `advisoryIds` に 2 件を並べるので、勧告の件数は `lookup` でしか読めない。

版の照合は `purl` から版を落としてから行う。 実測で、勧告側が `pkg:npm/lodash@9.9.9` と
書いていても `pkg:npm/lodash@4.17.20` の部品に当たった。 **勧告の `purl` に書いた版は無視される。**
実際の照合は `versionRange` だけが決める。

`/scanner` は部品表 session と走査 session の **両方** を要求する。 両方無い時は
`sbom_session_missing` が先に返る。

## 主な品質リスク

- **`validate` の `ok: false` に `errorKind` が付かない**。 操作の成否と検証結果が同じ field に
  載るため、`ok` を見る呼出側は操作失敗と読み、`errorKind` を見る呼出側は検証失敗を見逃す
- **`purl` の形が追加時に検査されない**。 `pkg:` で始まらない値も `addComponent` は受理し、
  `validate` を呼ぶまで誤りが表面化しない
- **`start` が既存の部品表を黙って捨てる**。 成功として報告され、失われた件数は応答に出ない。
  同じ repo の siem-incident は逆に既存 session を拒むため、2 example で `start` の意味が反対になる
- **走査のやり直しで検出と追跡が食い違う**。 `markRotated` は消えた検出の `findingKind` を返し続け、
  同じ index の `trackRotation` は `secrets_finding_missing` で落ちる
- **2 回目の `markRotated` が期限超過を打ち消す**。 1 度記録した後は何日後でも `overdue: false` になり、
  遅れた交換を記録し直すだけで期限超過の印が消える
- **期限の判定に等号が含まれない**。 期限ちょうどの交換は期限内として扱われる
- **空の部品表が `allow` を返す**。 ライセンス判定も突き合わせも、部品 0 件なら危険な feed を渡しても
  `allow`。 「安全」 と「まだ調べていない」 を区別できない
- **`vulnerableCount` が勧告ではなく部品を数える**。 1 部品に 10 件の critical が当たっても `1`。
  件数を深刻さの目安に使うと過小評価する
- **勧告の `purl` に書いた版が無視される**。 照合は `versionRange` だけで決まるため、
  `purl` の版を書き誤っても気付けない
- **`closed` の検査が操作ごとに割れる**。 部品表は `addComponent` だけ、走査は `scan` だけが見る。
  閉じた session から文書を出せて、閉じた走査に交換を記録できる
- **「tamper-evident」 に相当する保護がこの example には無い**。 部品表も走査結果も
  in-memory の Map に置かれ、署名も封印も持たない

## 推奨テスト構成

`startNextServer({ adapter })` が 3 route を node server に載せ、空き port で listen する。
`makeMockAdapter({ latencyMs: 0 })` を呼出側が作って渡すため、server と adapter の寿命は分けられる。

**この example は bootstrap を持たない。** `start` が `/sbom` と `/secrets-scan` の kind として
公開されているため、3 経路とも HTTP だけで完結する
(同じ構造の siem-incident は adapter を直接呼んで session を作る)。

`page.request.post` は BrowserContext と cookie jar を共有するが、browser の navigation / renderer /
同一 origin 制約 / Service Worker は通らない。

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | 部品表の組み立てと出力 | `componentCount` / `format` / `formatVersion` |
| 2 | ライセンス判定 | `overallVerdict` |
| 3 | 秘密情報の走査と交換の追跡 | `findings` / `overdue` |
| 4 | 突き合わせの報告 | `overallVerdict` / `componentCount` / `vulnerableCount` |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-E2E-001 | 部品表 / 秘密走査 / 突き合わせが 1 つの `APIRequestContext` から連続で通る | mock adapter を載せた server と Chromium BrowserContext に紐づく `page.request` | `/sbom` (`start` → `addComponent` × 2 → `emitCycloneDx` → `evaluateLicense`) → `/secrets-scan` (`start` → `scan` → `trackRotation` → `markRotated`) → `/scanner` (`report`) を順に投げる | 部品追加は `status===200` で `{ok: true, kind: 'addComponent', componentCount: 1}`。 出力は `{ok: true, format: 'cyclonedx', formatVersion: '1.5'}`。 ライセンスは `overallVerdict==='allow'`。 走査は `ok===true` かつ `findings.length>=1`。 交換は `{ok: true, kind: 'markRotated', overdue: false}`。 報告は `{ok: true, kind: 'report', overallVerdict: 'deny'}` かつ `componentCount===2` かつ `vulnerableCount===1` | P0 | yes | node | `/sbom` `/secrets-scan` `/scanner` |

## 既存 test との対応

- 探索した runtime — `typescript`
- 探索した path — `examples/dogfood-security-sbom-scanning-app/tests/e2e/`
- 見つけた既存 test — 1 件

| TC | 既存 test の候補 | 判定 |
|---|---|---|
| T-E2E-001 | `T-E2E-001 SBOM emission + secret scan + scanner report end to end` (`examples/dogfood-security-sbom-scanning-app/tests/e2e/sbom-scanning-flow.spec.ts:44`) | 既覆 (候補) |

## 自動化すべきテスト

既覆 (候補)。

- T-E2E-001 (P0) — 部品表 / 秘密走査 / 突き合わせを 1 つの `APIRequestContext` から順に実行する happy path

T-E2E-001 は 10 手を 1 件に畳んである。 分けないのは後段が前段の状態を前提にするため。
`addComponent` は `start` を、`scan` は `start` を、`trackRotation` は `scan` を、
`markRotated` は `trackRotation` を、`report` は部品表と走査の両 session を前提にする。

**`status===200` の assert だけでは domain の成否を判別できない。** JSON parse や dispatch 自体の
失敗は 400 / 500 になるが、route validator と route handler が返す失敗は 200 なので、
domain の成否を判別しているのは `toMatchObject({ok: true, ...})` の方になる。

**`findings.length>=1` は実測より緩い。** 同じ入力の実測値はちょうど 1 件なので、
signature が増えて 2 件に変わっても、あるいは別の kind が当たるようになっても、この assert は通る。

**`overallVerdict==='deny'` は 2 つの原因を区別しない。** この入力では critical の脆弱性が
単独で `deny` を決めるため、同時に成立している `secretsCount===1` は結果に効いていない。
実測で、同じ session に対して feed を空にすると `warn` へ落ちた。

**この 1 件が覆っていない範囲**。 到達可否は表のとおり。

| 覆っていないもの | 到達 | 理由 |
|---|---|---|
| `validate` の `ok: false` が `errorKind` を持たないこと | できる | `validate` を 1 度も呼んでいない |
| `emitSpdx` の `format` / `formatVersion` | できる | `emitCycloneDx` だけを呼んでいる |
| `nowIso` を渡した時の `generatedAtIso` | できる | 省略している |
| `lookup` の `advisories` / `advisoryIds` / `severity` | できる | `report` だけを呼んでいる |
| `close` と、閉じた後の kind ごとの差 | できる | 呼んでいない |
| 同じ `purl` の再追加が `sbom_component_duplicate` になること | できる | 別々の `purl` を送っている |
| `pkg:` で始まらない `purl` が追加時には通ること | できる | 正しい `purl` を送っている |
| `start` が既存の部品表を黙って捨てること | できる | 各 id を 1 回だけ開始している |
| ライセンス未指定が `warn`、`GPL-3.0` が `deny` になること | できる | `MIT` だけを送っている |
| 部品 0 件で `allow` が返ること | できる | 部品を 2 件積んでいる |
| `rotateWithinDays: 0` / 負値が拒まれること | できる | `30` を送っている |
| entropy の下限が `aws-secret-key` だけに効くこと | できる | `aws-access-key` の 1 種しか送っていない |
| 複数行 / 複数 signature の `line` と `column` | できる | `findings.length` しか見ていない |
| 走査やり直し後に `markRotated` と `trackRotation` が食い違うこと | できる | 走査を 1 回だけ行っている |
| 2 回目の `markRotated` が `overdue` を打ち消すこと | できる | 1 回だけ記録している |
| 期限ちょうどの交換が期限内になること | できる | 期限の 1/10 で交換している |
| `secrets_tracker_missing` / `secrets_finding_missing` | できる | 順序どおりに送っている |
| `vulnerableCount` が部品の件数であること | できる | 勧告 1 件 / 該当部品 1 件で両者が一致している |
| 勧告の `purl` の版が無視されること | できる | 版を持たない `purl` を送っている |
| 部品表 / 走査の各 session が無い時の `report` の失敗順序 | できる | 両方を先に作っている |
| route validator が返す各 `ok: false` | できる | 正常な入力だけを送っている |
| 未知の path の 404 と POST 以外の 405 | できる | 正常な path と method だけを送っている |
| body が配列 / `null` / 文字列の場合 | できる | object だけを送っている |
| 空 body が 400 でなく `sbomId_required` になること | できる | 常に body を送っている |
| 壊れた JSON の 400 | できる | Playwright の `data` で正しい JSON だけを送っている |
| `dispatch_failed` の 500 | 通常入力ではできない | dispatch が例外を投げた時だけの防御経路 |
| adapter が記録する trace | HTTP からはできない | trace を返す route が無く、`traces()` を直接読む必要がある |

route validator と handler の分岐は HTTP から到達できる。 到達できないのは防御用の 500 と、
応答に載らない trace の 2 つだけになる。
**HTTP の口の数と、その下にある route / adapter の分岐の数は別になる。**

## 手動確認でよいテスト

(なし)

## 不足している仕様

(なし)
