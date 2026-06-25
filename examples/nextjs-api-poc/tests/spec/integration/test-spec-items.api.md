# test-spec-items (api layer)

`/api/items` Route Handler の Layer 1 spec。 GET + POST の正常系 / 異常系 / 境界値を 9 column 表で記述する。

- module: items
- layer: api

## テストケース

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-API-001 | GET 正常系 | items=[] | GET /api/items | 200 + [] を返す | P0 | yes | live | /api/items |
| T-API-002 | POST 正常系 | items=[] | POST /api/items {name:"x"} | 201 + {id:1,name:"x"} を返す | P0 | yes | live | /api/items |
| T-API-003 | POST + GET 整合性 | items=[] | POST 後に GET | 直前で POST した item が GET に含まれる | P0 | yes | live | /api/items |
| T-API-004 | body 無し | items=[] | POST /api/items {} | 400 + {error:"name required"} | P1 | yes | live | /api/items |
| T-API-005 | name 長過ぎ (>100) | items=[] | POST /api/items {name: 101字} | 422 + {error:"name too long"} | P1 | yes | live | /api/items |
| T-API-006 | 未対応 method | items=[] | DELETE /api/items | 405 を返す | P2 | yes | live | /api/items |
| T-API-007 | 未対応 path | items=[] | GET /api/other | 404 を返す | P2 | yes | live | /api/other |
| T-API-008 | mock 経路で 200 | (mock 上書き) | GET /api/items | mock handler の固定応答が返る | P1 | yes | mock | /api/items |
| T-API-009 | hybrid 経路で live + mock 共存 | live 実装 + mock 上書きなし | POST + GET | live 実装の動作が反映される | P2 | yes | hybrid | /api/items |

## 自動化方針

mode = live は `setupApiServer({ mode: 'live', app: createItemsHandler() })` で起動。
mode = mock は msw handler で固定応答を注入。
mode = hybrid は live を立てつつ mock 経路を保持し、 必要時に msw で path 単位 override する経路。
