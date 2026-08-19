# test-spec-counter (ui layer)

`<Counter />` React component の Layer 1 spec。 render / interaction / snapshot の 3 経路を統合表現する。

- module: counter
- layer: ui

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Component |
|---|---|---|---|---|---|---|---|---|
| T-UI-001 | 初期 render | initial=3 | mount Counter | value が "3" を表示 | P0 | yes | render | Counter |
| T-UI-002 | step 反映 | initial=0 step=5 | mount Counter | value が "0" を表示 | P0 | yes | render | Counter |
| T-UI-003 | + クリックで +1 | initial=0 | click + | value が "1" になる | P0 | yes | interaction | Counter |
| T-UI-004 | 連続クリック | initial=0 | click + × 3 | value が "3" になる | P0 | yes | interaction | Counter |
| T-UI-005 | reset でクリア | initial=5、 + で 8 | click reset | value が "5" になる | P1 | yes | interaction | Counter |
| T-UI-006 | max 到達で disable | initial=0 max=2 | click + × 2 | + ボタン disabled、 max reached 表示 | P1 | yes | interaction | Counter |
| T-UI-007 | snapshot initial | initial=7 | mount Counter | markup に value 7 + ボタン群が含まれる | P1 | yes | snapshot | Counter |

## 自動化方針

mode = render は `setupComponentEnv({ mode: 'render', ui: <Counter /> })` で起動 + screen query で assertion。
mode = interaction は `setupComponentEnv({ mode: 'interaction', ui: <Counter /> })` で起動 + `env.user.click()` で操作 + screen query で assertion。
mode = snapshot は `setupComponentEnv({ mode: 'snapshot', ui: <Counter /> })` で起動 + `env.markup` で markup の正規表現 / 部分一致 assertion (storage に保存する file snapshot は別 phase)。
