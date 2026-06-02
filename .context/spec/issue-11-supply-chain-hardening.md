# spec: issue-11-supply-chain-hardening

## タスクサマリ

PR #10 (Issue #4) の `/parallel-review` で出た 2 件の MAJOR finding (F3 action mutable major tag / F4 release が CI gate なし) を v0.1.0 publish 前に解消する。
GitHub Actions の 7 箇所 (ci.yml 3 + release.yml 4) を full commit SHA に pin + dependabot で自動更新 PR を回す + release.yml が CI matrix 完了を gate する仕組みを追加し、初回 publish 時点から supply chain 防御を効かせる。
release.yml の trigger は変更せず main push 直接トリガを維持、CI gate は release.yml 内で test 再走する案 B を採用 (案 A workflow_run trigger は workflow_run の chained workflow リスクで除外)。

## 受入条件 (AC)

- AC 1: `.github/dependabot.yml` を新規作成し、github-actions ecosystem を daily 監視、groups 機能で全 action を 1 つの PR にまとめる設定で、初回 dependabot scan が SUCCESS する
- AC 2: `.github/workflows/ci.yml` の 3 箇所 (actions/checkout / pnpm/action-setup / actions/setup-node) を **full commit SHA (40 文字 hex)** に pin し、各行に `# v4.X.X` のような version tag コメントを inline で残す
- AC 3: `.github/workflows/release.yml` の 4 箇所 (actions/checkout / pnpm/action-setup / actions/setup-node / changesets/action) を full commit SHA に pin し、version tag を inline コメントで残す
- AC 4: `.github/workflows/release.yml` に changesets/action 起動前に `pnpm install --frozen-lockfile → pnpm typecheck → SKIP_ANVIL_TESTS=1 pnpm -F @dapp-e2e/core test → pnpm -F @dapp-e2e/cli test → pnpm -F examples-basic-connect typecheck` の test 再走 step を追加し、test fail で publish が起動しない
- AC 5: `docs/RELEASING.md` に SHA pin 更新フロー (dependabot PR の merge 手順) と CI gate (release.yml 内 test 再走の意図) を 1 段落ずつ追記

## スコープ境界

### in (本 Issue で対応)

| 観点 | in |
|---|---|
| dependabot | github-actions ecosystem daily 監視 + groups 設定 |
| ci.yml SHA pin | 3 action (checkout / pnpm-setup / setup-node) を SHA pin |
| release.yml SHA pin | 4 action (checkout / pnpm-setup / setup-node / changesets/action) を SHA pin |
| release.yml CI gate | install → typecheck → test → build の test 再走を changesets/action 前に追加 (案 B) |
| docs 更新 | docs/RELEASING.md に SHA pin 運用 + CI gate 説明追記 |
| version tag コメント | 各 uses 行に `# v4.X.X` の inline コメントで可読性維持 |

### out (本 Issue で対応しない)

| 観点 | out |
|---|---|
| workflow_run trigger 設計 (案 A) | spec §既知のリスクで両案比較済、本 PR は案 B 採用 |
| Codecov / lighthouse / e2e (Playwright) を CI に統合 | Issue #4 の反例 5 で確立、本 PR でも踏襲 |
| anvil 実 spawn を CI で動かす | Issue #4 反例 5、本 PR でも touch しない |
| Trusted Publisher 設定 (npm 側) | Issue #17 (publish 実行手順) に移譲、release.yml 側変更不要 |
| dependabot で pnpm packages 監視 | 別 Issue (npm ecosystem 監視は scope crep、本 Issue は github-actions に集中) |
| ci.yml に E2E Playwright 追加 | Issue #4 反例 5 / 永続的 out |
| pnpm/action-setup の version を 11.x にアップグレード | dependabot に任せる、本 PR は現状 10.33.2 pin 維持 |

## 反例ケース (動かないはず・対象外)

- 反例 1: `ci.yml` / `release.yml` の uses 行を SHA pin **せずに** dependabot.yml だけ追加する PR は AC 2 + 3 違反、reject
- 反例 2: release.yml の trigger を `workflow_run` に変更する PR は spec §既知のリスクで案 A 除外、本 PR scope 外、reject (将来別 Issue で再検討可能)
- 反例 3: changesets/action 自体を別 action (semantic-release 等) に置き換える PR は Issue #4 SSOT 違反、reject
- 反例 4: SHA pin で version tag inline コメント (`# v4.X.X`) を **削除** する PR は AC 2 + 3 違反 (可読性確保のため必須)、reject
- 反例 5: dependabot.yml の monitoring 範囲を docker / pip / npm 等 多 ecosystem に拡張する PR は scope crep、本 Issue は github-actions のみ

## 影響範囲 (touched file 候補)

新規 1 file:

- `/Users/cardene/Desktop/projects/dapp-e2e/.github/dependabot.yml` — github-actions ecosystem daily + groups

修正 3 file:

- `/Users/cardene/Desktop/projects/dapp-e2e/.github/workflows/ci.yml` — uses 3 行を SHA pin + version tag inline コメント
- `/Users/cardene/Desktop/projects/dapp-e2e/.github/workflows/release.yml` — uses 4 行を SHA pin + version tag inline コメント + changesets/action 前に test 再走 step 追加 (5 step: install / typecheck / test core / test cli / consumer typecheck)
- `/Users/cardene/Desktop/projects/dapp-e2e/docs/RELEASING.md` — SHA pin 運用 + CI gate (案 B) の説明追記

合計 4 file (新規 1 + 修正 3)。

## 既知のリスク・前提

### 前提

- Issue #4 で確立した release.yml の changesets/action 経路を維持 (反例 3)
- Issue #5/#6 で確立した CI scope (core + cli のみ、anvil/Playwright 不在) を release.yml の test 再走でも踏襲
- v0.1.0 publish 前の最後のタイミング、本 PR merge 後に Issue #17 手順で publish 実行
- 各 action の current SHA は GitHub API (`gh api repos/{owner}/{repo}/git/refs/tags/v{version}`) で取得、impl 段階で実 SHA を取得
- SHA pin 後の Dependabot 動作は初回 scan が完了するまで時間 (1-24 時間) がかかる場合あり、本 PR merge 後の確認は別タスク

### リスク

- リスク 1: **案 A (workflow_run trigger) vs 案 B (release.yml 内 test 再走) の選択** — 本 PR は案 B 採用、案 A は workflow_run 経路で changesets/action と組み合わせる場合の挙動が複雑 (workflow_run trigger は default branch でのみ動作 + on push trigger と排他)、案 B は CI と publish の test を 2 重実行するが env 差異リスクを最小化、シンプル。将来 release.yml の build cost が問題化した時に案 A 再検討可能 (緩和: spec で両案を文書化し将来 Issue 化可能な状態に)
- リスク 2: **SHA pin 後の dependabot 自動 PR が大量に来る** — 各 action のリリースサイクル + Dependabot が毎日 scan するため、各 PR の merge コストが体感問題化する可能性 (緩和: dependabot.yml の `groups` 設定で github-actions 全 action を 1 PR にまとめる、weekly 監視に変更可能)
- リスク 3: **changesets/action の minor version up で publish 挙動が壊れる** — dependabot 自動 PR で changesets/action SHA を bump した時、内部 behavior 変化で publish が失敗する可能性 (緩和: dependabot.yml の changesets/action update を minor/patch のみに制限する設定、impl 段階で検討)
- リスク 4: **release.yml の test 再走 step で CI と差異が出る** — env 差異 (matrix なし、node 20 のみ等) で test 結果が CI と乖離する可能性 (緩和: release.yml の test 再走は node 20 のみで CI と同 scope + 同 env 変数、impl 段階で確実な整合確保)
- リスク 5: **SHA pin の更新負荷で dependabot PR を放置する** — 結果として security advisory 対応が遅れて反って supply chain 弱体化する可能性 (緩和: docs/RELEASING.md で「dependabot PR は 1 週間以内に merge する」運用ルール明記)

### 粒度判定

- AC 数: 5 (緑閾値 3-5、緑)
- 変更 file 数: 4 (緑閾値 5 以下、緑)
- 推定実装時間: 50 分 (黄閾値 30-60、黄)
- **判定: 緑〜黄の境界 (緑寄りで単発進行)**、実装は workflow yaml + dependabot yml + docs のみ、ロジックなし、案 B 採用で設計シンプル

## 次ステップ

1. 本 spec を入力に Issue #11 body を gh api PATCH で更新 (Issue #4-#6 と同じ flow)
2. feature branch `feature/11-supply-chain-hardening` 作成済 (本 spec 保存と同 branch)
3. SHA 取得 + 実装は Codex 委譲 (gh api で各 action の current SHA を取得 + yaml 4 file 修正 + docs 1 file 追記)
4. `/impl` → `/parallel-review` → `/verify` → PR (Closes #11)
5. PR merge 後 v0.1.0 publish (Issue #17 手順) を実行
