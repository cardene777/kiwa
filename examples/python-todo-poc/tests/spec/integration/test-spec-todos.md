# Todo API テスト仕様

- module: todos
- layer: integration

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-TODO-001 | list empty | 起動直後 in-memory store 空 | GET /todos | 200 + [] | P0 | yes | live | /todos |
| T-TODO-002 | create accepted | empty store | POST /todos {"title":"hi"} | 201 + id 1 returned | P0 | yes | live | /todos |
| T-TODO-003 | created todo retrievable | 1 todo created | GET /todos/1 | 200 + same payload | P0 | yes | live | /todos/1 |
| T-TODO-004 | get unknown id - 404 | empty store | GET /todos/9999 | 404 not found | P1 | yes | live | /todos/9999 |
| T-TODO-005 | delete known id | 1 todo created | DELETE /todos/1 | 204 + list 空 | P0 | yes | live | /todos/1 |
| T-TODO-006 | delete unknown id - 404 | empty store | DELETE /todos/9999 | 404 not found | P2 | yes | live | /todos/9999 |
| T-TODO-007 | manual schema docs | swagger UI で確認 | GET /docs | OpenAPI rendered | P3 | manual | live | /docs |
