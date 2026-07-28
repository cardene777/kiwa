# Security DevSecOps

`@kiwa-lab/security-devsecops` は、CI におけるセキュリティ監査の orchestration と report の扱いを test する harness です。SAST、SCA、secret scan、IaC scan、DAST、container security を axis として選び、preset が選んだ順に adapter を実行して一つの report に集めます。Semgrep、Trivy、Gitleaks、tfsec、OWASP ZAP、Grype を起動したり、target file を解析したりはしません。

<img src="/images/kiwa-docs/quality/security-devsecops-overview.webp" alt="presetとtargetからsecurity axesをadapterで実行してreportへ集約する流れ" width="1672" height="941" loading="lazy" decoding="async">

`audit-all` と `threat-model` は六 axis、`supply-chain` は SCA と container security、`specialty` は SAST、secret scan、DAST を選びます。orchestrator は選んだ axis を順に実行します。一つの adapter が throw すると後続 axis は実行されず report も返りません。そのため CI では completed axis の数だけでなく、呼び出し自体が reject しなかったことと、各 axis の結果を確認します。

mock mode は、preset 選択、adapter 呼び出し、report 集約を再現可能に test するための mode です。real mode は `KIWA_SECURITY_MODE=real` と axis ごとの URL 環境変数を要求しますが、その URL に接続しません。completed report は workflow が成立したことを示すだけで、repository に脆弱性がないこと、scanner が正常に動いたこと、production target が安全であることを示しません。

## 使う判断

security scanning の結果を受け取る CI workflow、preset の選択、report の集計、threat-model の STRIDE tag を application code として検証する場合に使います。実 scanner を実行して脆弱性や policy 違反を検出する段階ではなく、その scanner を別の CI job で動かしたあとの report consumption を固定する用途です。

## 読み進める

[Quickstart](./quickstart) は supply-chain preset を保存して実行します。[使い方](./how-to) は axis failure と real-mode env gate を含めた CI の扱いを説明します。[リファレンス](./reference) は preset、環境変数、report の契約を確認するためのページです。
