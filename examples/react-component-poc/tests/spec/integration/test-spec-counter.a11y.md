# test-spec-counter (a11y layer)

`<Counter />` を axe-core で検査する Layer 1 spec。
`ui` layer (`test-spec-counter.ui.md`) と同じ component を、 別の観点から見る。

- module: counter
- layer: a11y

## テストケース

| ID | Observation | Mode | Component | WCAG-rule | Severity | Expected | Priority | Automation |
|---|---|---|---|---|---|---|---|---|
| T-A11Y-001 | 既定 render に違反が無い | jsdom | Counter | WCAG 2.1 AA | serious | violations 0 件 | P0 | yes |
| T-A11Y-002 | max 到達時も違反が無い | jsdom | Counter | WCAG 2.1 AA | serious | disabled + `role="status"` の状態で violations 0 件 | P0 | yes |
| T-A11Y-003 | 名前の無いボタンを検出する | jsdom | (裸の markup) | WCAG 2.0 A | critical | `button-name` が violations に現れる | P0 | yes |
| T-A11Y-004 | 走査範囲を context で絞る | jsdom | Counter | WCAG 2.1 AA | serious | 範囲外に違反があっても Counter の走査では 0 件 | P1 | yes |
| T-A11Y-005 | 既定の閾値は minor から塞ぐ | jsdom | (合成 results) | — | minor | `reportViolations` の既定で minor も blocking に入る | P1 | yes |
| T-A11Y-006 | 閾値を上げると minor は通す | jsdom | (合成 results) | — | serious | `maxImpact: 'serious'` で minor は blocking に入らない | P1 | yes |
| T-A11Y-007 | 違反 0 件なら assertion が通る | jsdom | Counter | WCAG 2.1 AA | serious | `expectNoViolations` が例外を投げない | P0 | yes |

## 自動化方針

mode = jsdom は `@testing-library/react` の `render` で DOM に載せ、 `runAxe({ context })` で
その subtree だけを走査する。 `--environment jsdom` は example の test script が渡している。

T-A11Y-003 は **検査自身の識別力**を見る。 違反が無い component だけを見ていると、 axe が
実際には何も走っていなくても全 TC が通ってしまう。 名前の無いボタンを 1 件通して
`button-name` が出ることを確かめる。

T-A11Y-005 / 006 は閾値の既定を固定する。 `reportViolations` の `maxImpact` 既定は `minor` で、
**minor も blocking に入る**。 「serious 以上だけ落ちる」 と読むと、 minor を残したまま緑だと
誤解する。

## 不足している仕様

- jsdom では `color-contrast` / `focus-visible` が評価されない (実 browser が要る)。 これらを
  covering するには playwright mode の TC が別途要る。 本 spec は jsdom mode に限定している。
