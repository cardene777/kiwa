# @kiwa-lab/feature-flag

`@kiwa-lab/feature-flag` は、GrowthBook、LaunchDarkly、PostHog、Unleash で表す flag の評価を in-process で test する harness です。provider 名は evaluation record の id prefix に使われますが、実 provider SDK、remote config、network へは接続しません。

![フラグと利用者をルールで評価し一致時は有効値それ以外は既定値を返す流れ](/images/kiwa-docs/services/feature-flag-overview.png)

## 利用者と rule から値を選ぶ

flag は boolean、文字列、数値の既定値を持ちます。`evaluateFlag` は利用者 id と rule を順に評価し、最初に一致した targeting、attribute、percentage rollout の値を返します。どの rule に一致しなかった場合も既定値へ戻り、評価 record に理由が残ります。未知 key は throw せず、`flag-not-found` の record と boolean false を返します。

このため、新機能を誰に見せるか、rollout をどの条件で通すか、想定外の key を画面がどう扱うかを高速に固定できます。rule の登録順は評価順でもあるため、優先順位を変えるときは順序を assertion に含めてください。

## 実 provider と分ける範囲

実 provider の bucket algorithm、SDK cache、remote config fetch、analytics exposure は再現しません。設定を変更する integration test と、この library の評価契約 test を分けます。idempotency cache は flag key と user id だけで結果を持つため、attributes や rule を変更した test では cache を作り直します。

## 読み進める

[Quickstart](./quickstart) で既定値と未知 key を確認します。[使い方](./how-to) では targeting、rollout、attribute、cache を扱います。公開 API は [リファレンス](./reference) にあります。
