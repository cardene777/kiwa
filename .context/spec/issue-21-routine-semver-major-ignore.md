# spec: issue-21-routine-semver-major-ignore

## タスクサマリ

`.github/dependabot.yml` の `github-actions-routine` group (actions/* + pnpm/*) に semver-major ignore を追加し、`docs/RELEASING.md` に「routine group も major up は手動 SHA pin 更新」運用ルールを 1 段落追記する。
PR #19 (3 アクション 2 段 major bump) を merge した経験で、routine group も major up を手動レビューにすべきと判明した供給網防御 follow-up。

## 受入条件 (AC)

- AC 1: `.github/dependabot.yml` の `ignore` リストに `actions/*` の `version-update:semver-major` が追加されている
- AC 2: `.github/dependabot.yml` の `ignore` リストに `pnpm/*` の `version-update:semver-major` が追加されている (既存 `changesets/action` の ignore は維持)
- AC 3: `dependency-name` の glob (`*`) が dependabot 公式仕様で動作することを yaml コメント or PR body で明示している
- AC 4: `docs/RELEASING.md` の SHA pin 運用節に「routine group の major up も手動 SHA pin 更新」運用ルールが 1 段落 (2-4 文) で追記されている
- AC 5: PR merge 後の dependabot daily scan で routine group の minor / patch 自動 PR は流れる前提が運用ルールに含まれている
- AC 6: `.github/workflows/ci.yml` が削除されていること (PR 用 CI workflow をローカルテスト運用に置き換え)
- AC 7: `docs/RELEASING.md` の CI matrix 言及がローカルテスト運用記述に書き換えられており、`release.yml` 内 5 step gate と branch protection 運用が整合していること

## スコープ境界

### in (本 Issue で対応)

- `.github/dependabot.yml` の ignore リスト拡張 (3 系統 statement)
- `docs/RELEASING.md` の SHA pin 運用節への運用ルール 1 段落追記
- `.github/workflows/ci.yml` の削除と、それに伴う release 運用ドキュメント整合
- yaml lint 確認 (`actionlint` or yaml validate コマンドの実行ログ)

### out (本 Issue で対応しない)

- dependabot ecosystem の他系統追加 (npm / docker など、現状 github-actions のみ運用)
- `changesets/action` 用 group の構造変更 (既に ignore semver-major 済)
- 自動 SHA pin 更新スクリプトの実装 (将来別 Issue)
- main branch protection 設定変更 (Issue #17 のユーザー側操作と独立)
- 他リポジトリへの同設定展開 (本 repo 限定)

## 反例ケース (動かないはず・対象外)

- 反例 1: routine group 自体を削除して 1 PR = 1 action に分割する案 → group のメリット (関連 action を 1 PR で更新) を失うため不採用
- 反例 2: `ignore-major` を `applies-to: version-updates` 限定する案 → 現状 security-updates は別経路で ignore せず受け取る方針なので applies-to は default のままで OK
- 反例 3: 全 action の `version-update:semver-patch` も ignore する過剰防御 → patch 自動 PR は SHA pin の利益が一番高く、ignore する理由がない
- 反例 4: dependabot.yml の groups 構造ごと作り直す案 → 既存 routine + changesets-action 2 group 分離が PR #18 で確立済、構造変更は SSOT 違反
- 反例 5: `ci.yml` は手動運用に切り替え後も維持する案 → 今回のスコープは PR 用 CI の退避ではなく削除であり、release.yml 内 gate とローカル運用へ明示的に切り替える

## 影響範囲 (touched file 候補)

- `.github/dependabot.yml` (AC 1-3 で ignore リスト 3 系統に拡張)
- `docs/RELEASING.md` (AC 4-5 で SHA pin 運用節に 1 段落追記、L42 付近 + AC 7 で CI matrix 言及をローカル運用記述に書き換え + required check deadlock 注意を追記)
- `.github/workflows/ci.yml` (AC 6 で削除)
- `.context/spec/session-handoff-20260603.md` (Issue #17 Phase 2-3 を撤回、required status check は設定しない方針へ更新)

grep ベース確認結果。

```text
.github/dependabot.yml:10:          - "actions/*"
.github/workflows/release.yml:21,31:  actions/checkout + actions/setup-node SHA pin
.github/workflows/ci.yml:21,29:       actions/checkout + actions/setup-node SHA pin
```

workflow yaml では `release.yml` の SHA pin 値を維持しつつ、PR 用 CI の `ci.yml` のみ削除する。

## 既知のリスク・前提

- リスク 1: dependabot の `dependency-name` glob が思った通りマッチしない (例 `actions/checkout-v2` のような変則名前空間) → 公式仕様で `*` glob は動作することを確認済 (`https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file#ignore`)、影響なし
- リスク 2: minor / patch 自動 PR が止まる誤設定 → `version-update:semver-major` のみ ignore、minor / patch は引き続き自動 PR で流れる
- リスク 3: PR #18 で確立した 2 group 構造を壊す → 本 PR は ignore リスト追加のみ、groups 構造は触らない
- リスク 4: PR 段階のテストは開発者ローカル責任になり、CI 自動チェックは GitGuardian / CodeRabbit のみになる → release.yml 内の typecheck / test / build gate で publish 経路の安全性を担保する
- 前提 1: PR #19 で v6 系 SHA pin に更新済、本 PR merge 後の dependabot 次回 scan で routine group の major up は新たに提案されない
- 前提 2: docs/RELEASING.md の SHA pin 運用節 (L42-46) は既に SHA pin 防御を説明済、本 PR では「routine group も同じ運用」を 1 段落追記するのみ
- 前提 3: 当初は軽量 PR 想定だったが、ci.yml 削除と release 運用整合まで含めたため最終的に 4 file / 約 30 分規模へ拡大した

## 粒度判定

- AC 数: 7 (推奨 3-5 を超過、黄)
- 影響ファイル数: 4 (推奨 5 以下、緑)
- 推定実装時間: 約 30 分 (AC 7 × 平均 4 分、推奨 30 分以内の上限、黄)

**判定: 黄 (警告)** — scope が ci.yml 削除追加で当初想定より拡大した。実装は本 PR 内で完結したが、本来は別 Issue として切り出すべき粒度。AC 6-7 はユーザー方針変更による追加であり、本 PR の同 scope (CI/CD config 見直し) でセットにする判断を取った。
