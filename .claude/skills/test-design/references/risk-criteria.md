# 品質リスク判定基準

`docs/SKILL-DESIGN.md` § Step 2 の 5 基準を判定する際の境界例と判定指針。 SSOT は `docs/SKILL-DESIGN.md`、 本 file は実運用の判定 hint。

## 5 基準のスコアリング規約

各基準を **高 / 中 / 低** の 3 段階で評価し、 1 文の根拠を必ず添える。 「N/A」「該当なし」で逃げない (低 と書く)。

### 1. 売上影響

| スコア | 例 | 判定基準 |
|---|---|---|
| 高 | チェックアウト / 課金 / 決済 / mint fee 徴収 / subscription billing | 機能不具合で売上が直接減る |
| 中 | コンバージョン経路 (商品閲覧 → カート / wallet connect → mint) | 不具合で間接的に売上に影響 |
| 低 | プロフィール編集 / 通知設定 / ヘルプページ | 売上に関係しない |

判定 hint — 「この機能が動かないと今日の売上が下がるか?」で Yes なら 中以上、 明確に Yes なら 高。

### 2. セキュリティ影響

| スコア | 例 | 判定基準 |
|---|---|---|
| 高 | 認証バイパス / 署名偽造 / private key 漏洩 / access control bypass / reentrancy | 直接的な財産・データ流出 |
| 中 | XSS の DOM injection / CSRF (state-changing endpoint) / open redirect | 条件付きで被害発生 |
| 低 | 内部ログ表示 / read-only public endpoint | 漏洩しても被害なし |

判定 hint — OWASP Top 10 + Smart Contract Weakness Classification (SWC) に該当するか確認。 該当すれば 高。

### 3. データ破壊リスク

| スコア | 例 | 判定基準 |
|---|---|---|
| 高 | 不可逆 write (DROP / blockchain commit) / soft delete なし / replay 攻撃で state 破壊 | 復旧不能 or バックアップなし |
| 中 | UPDATE で旧値を loss するが audit log で復元可能 | 復旧コストあり |
| 低 | INSERT のみ / audit log + soft delete 両方あり | 即時復元可能 |

判定 hint — 「この操作を誤実行したらバックアップから戻せるか?」で No なら 高。

### 4. 利用頻度

| スコア | 例 | 判定基準 |
|---|---|---|
| 高 | 全 page load / 全 transaction / 認証経路 | 1 user 1 day で必ず通る |
| 中 | 主要 flow の一部 (cart → checkout / mint → list) | 1 user 1 week で 1-3 回通る |
| 低 | 月次レポート / admin only 機能 / 設定変更 | 1 user 1 month で 1 回以下 |

判定 hint — DAU / MAU の割合で判定。 DAU の 50%以上が通れば 高、 10-50% で 中、 10% 未満で 低。

### 5. 過去障害履歴

| スコア | 例 | 判定基準 |
|---|---|---|
| 高 | 過去 6 ヶ月で同一機能の bug 報告あり / hotfix 履歴あり | repeat offender |
| 中 | 過去 12 ヶ月で類似機能の bug 報告あり | 注意領域 |
| 低 | 過去 12 ヶ月で bug 報告なし | 既知問題なし |

判定 hint — `git log --grep="fix.*<module>"` / GitHub Issue の `bug` ラベルを 6 ヶ月分検索。 該当 1 件以上で 高。

## リスク表の書き方 (skill 出力)

skill は以下フォーマットで Step 2 のリスク表を生成する。

```markdown
| 入力要素 | 売上影響 | セキュリティ影響 | データ破壊 | 利用頻度 | 過去障害 | 根拠 |
|---|---|---|---|---|---|---|
| mint() 関数 | 高 | 高 | 中 | 高 | 低 | 主要収益 fn + access control 経路 |
| transfer() 関数 | 低 | 中 | 高 | 中 | 低 | 不可逆 write、 owner check 必須 |
| metadata 表示 | 低 | 低 | 低 | 高 | 低 | read-only public IPFS |
```

根拠 column は 1 文 (40 文字以内目安)。 「重要だから」「念の為」のような抽象表現禁止 (`rules/response-style.md` §3 と整合)。

## 優先度導出 (Step 5 で使う)

skill は以下ロジックで優先度を機械的に判定する。 主観で上書きしない。

| 優先度 | 条件 |
|---|---|
| 高 | 売上 / セキュリティ / データ破壊 の少なくとも 1 つが「高」 |
| 中 | 上記が全て「中以下」 + 利用頻度 / 過去障害 のいずれかが「高」 |
| 低 | 全基準が「中以下」 + 利用頻度 / 過去障害 も「中以下」 |

複数行の入力要素に紐付くテストケースは、 最も高い優先度を採用する (例: mint() のリスク = 高 → mint test の優先度 = 高)。

## 関連

- SSOT: `docs/SKILL-DESIGN.md` § Step 2 (高 / 中 / 低 のスコアリング規約)
- 観点との連動: `references/viewpoints-catalog.md` (どの観点をどのリスクと紐付けるか)
- 出力フォーマット: `references/output-skeleton.md` § 主な品質リスク
