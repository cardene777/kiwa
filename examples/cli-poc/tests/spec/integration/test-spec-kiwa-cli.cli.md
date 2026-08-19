# test-spec-kiwa-cli (cli layer)

`kiwa` CLI 自身を dogfooding する Layer 1 spec。
exit code / stdout / stderr / temp dir 副作用を表現する。

- module: kiwa-cli
- layer: cli

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Topic |
|---|---|---|---|---|---|---|---|---|
| T-CLI-001 | --help 正常終了 | 引数 --help | kiwa --help | exit=0、 stdout に Usage を含む | P0 | yes | mock | help |
| T-CLI-002 | -h short flag | 引数 -h | kiwa -h | exit=0、 stdout に Usage を含む | P0 | yes | mock | help |
| T-CLI-003 | unknown command | 引数 unknown | kiwa unknown | exit!=0、 stderr に Unknown command を含む | P1 | yes | mock | help |
| T-CLI-004 | doctor (環境依存) | PATH を偽 dir で prepend | kiwa doctor | anvil 不在環境では stderr に anvil not found、 在環境では stdout に OK anvil | P1 | yes | mock | doctor |
| T-CLI-005 | doctor (anvil 在) | PATH に anvil あり | kiwa doctor | exit=0、 stdout に OK anvil を含む | P0 | yes | mock | doctor |
| T-CLI-006 | init: empty dir で auto scaffold | 空 cwd | kiwa init | exit=0、 e2e/connect.spec.ts 生成 | P0 | yes | mock | init |
| T-CLI-007 | init with package.json | seedFiles に package.json | kiwa init | exit=0、 e2e/connect.spec.ts が生成される | P0 | yes | mock | init |
| T-CLI-008 | anvil seed --out 引数欠落 | 引数 anvil seed script.js | kiwa anvil seed | exit!=0、 stderr に --out を含む | P1 | yes | mock | anvil-seed |

## 自動化方針

mode = mock は `setupCliEnv()` で isolated tempdir + env override + `runCli()` で deterministic 起動。
mode = live は本番 CLI 経路を実際に使う場合 (本 PoC では未使用)。
