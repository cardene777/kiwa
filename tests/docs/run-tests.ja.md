# `/kiwa-test` 一括実行手順 (contract + dApp e2e、 1 コマンドで全 chain)

> 🇯🇵 日本語のみ (英語版は本手順をローカルで検証した後に追加予定)

`/kiwa-test` で kiwa skill chain (kiwa-design → kiwa-forge / kiwa-hardhat / kiwa-play → kiwa-review) を 1 コマンドで一括実行する手順。 contract test / dApp e2e test / 両方 を起動時に選べる。 個別 skill を順次叩く負担なし。

個別 skill を叩きたい場合は `tests/docs/run-contract-tests.ja.md` / `tests/docs/run-dapp-e2e-tests.ja.md` を参照。

## Step 0 — 前提環境 (+ 途中まで進めた場合のリセット)

kiwa repo を clone した root で実行。

```bash
pnpm install && pnpm -F @kiwa/core build && forge --version && anvil --version && node --version
```

途中まで進めて再 run したい場合のリセット (生成済 test / spec / cache / report を全削除)。 cwd がどこでも動く。

```bash
# contract target (例 nft-marketplace)
ROOT=$(git rev-parse --show-toplevel) && rm -rf "$ROOT/examples/nft-marketplace"/{test,hardhat-test,forge-out,hardhat-cache,hardhat-artifacts,cache,coverage,coverage.json} "$ROOT/tests/spec/contract/test-spec-nft-marketplace"* "$ROOT/tests/reports"/{contract,review,integrated}/*nft-marketplace*

# dapp target (例 nextjs-token-gating)
ROOT=$(git rev-parse --show-toplevel) && rm -rf "$ROOT/examples/nextjs-token-gating"/{tests,test-results,playwright-report,.next} "$ROOT/tests/spec/e2e/test-spec-token-gating"* "$ROOT/tests/reports"/{e2e,review,integrated}/*token-gating*

# 両方 (例 nextjs-token-gating で全 chain)
ROOT=$(git rev-parse --show-toplevel) && rm -rf "$ROOT/examples/nextjs-token-gating"/{test,hardhat-test,tests,forge-out,hardhat-cache,hardhat-artifacts,cache,coverage,coverage.json,test-results,playwright-report,.next} "$ROOT/tests/spec"/{contract,e2e}/test-spec-token-gating* "$ROOT/tests/reports"/{contract,e2e,review,integrated}/*token-gating*
```

## Step 1 — repo root で Claude Code を起動

```bash
cd $(git rev-parse --show-toplevel) && claude
```

**cwd = repo root が重要** — `/kiwa-test` は内部で example dir に cd して子 skill を起動するため、 必ず root で起動。 個別 kiwa-X skill (cwd = dApp dir 起動) と起動規約が違う点に注意。

## Step 2 — `/kiwa-test` を叩く (引数は最小、 残りは AskUserQuestion で確認)

```text
/kiwa-test --example nextjs-token-gating
```

引数省略時は対話的に確認される:
- Step 0 言語選択 — 🇯🇵 ja / 🇬🇧 en / 🌏 その他
- Step 1 target 選択 — 🔷 contract のみ / 🌐 dApp e2e のみ / 🔷+🌐 両方

直接引数指定すれば AskUserQuestion skip:

```text
# 言語 + target 全指定 (CI / 自動化用)
/kiwa-test --example nextjs-token-gating --target both --lang ja

# review skip + coverage loop skip (高速 dry-run)
/kiwa-test --example nft-marketplace --target contract --lang ja --no-review --no-coverage-loop
```

## Step 3 — skill chain 自動実行 (target 別)

`/kiwa-test` が以下を順次起動。 user 介入なし。

### target = contract

```text
[Step 3a] /kiwa-design --layer contract --module {example} --input contracts/ --lang $LANG
          → tests/spec/contract/test-spec-{example}.{lang}.md 生成
          → Step 6 で kiwa-review --mode spec-review 自動呼出

[Step 3b] /kiwa-forge --module {example} --gas-report --lang $LANG
          → examples/{example}/test/{Contract}.t.sol 生成 + forge test 全 PASS
          → Step 5b auto loop で coverage 100% (or 不可能判定) 到達
          → Step 5c で tests/reports/contract/coverage-report-{example}.{lang}.md Write
          → Step 6 で kiwa-review --mode test-review 自動呼出

[Step 3c] /kiwa-hardhat --module {example} --gas-report --lang $LANG
          → examples/{example}/hardhat-test/{Contract}.test.cjs 生成
          → hardhat test 4 round 連続 PASS (flaky 0)
          → coverage 100% (or 不可能判定) 到達
          → Step 6 で kiwa-review --mode test-review 自動呼出
```

### target = dapp

```text
[Step 4a] /kiwa-design --layer e2e --module {example} --input app/ --lang $LANG
          → tests/spec/e2e/test-spec-{example}.{lang}.md 生成
          → Step 6 で kiwa-review --mode spec-review 自動呼出

[Step 4b] /kiwa-play --mode new --rounds 4 --lang $LANG
          → examples/{example}/tests/{example}.spec.ts + helper 生成
          → playwright test 4 round 連続 PASS (flaky 0)
          → Step 9 で kiwa-review --mode test-review 自動呼出
```

### target = both

Step 3 (contract) → Step 4 (dapp) の順次実行 (default `--mode sequential`)。 contract FAIL なら dapp skip + 中断。

## Step 4 — 統合 report + result-review 確認

全 chain 完了後、 `/kiwa-test` が以下を生成:

```text
tests/reports/integrated/{example}-{target}.{lang}.md
```

4 section 構造:
- Section 1 実行サマリ (各段階 PASS / FAIL + 件数 + score)
- Section 2 生成 file 一覧 (spec / test / coverage / review report の path 集約)
- Section 3 critical / major 指摘 (子 review 集約)
- Section 4 次アクション (PASS なら docs 更新 + PR 起票推奨、 FAIL なら修正手順)

Step 5b で `/kiwa-review --mode result-review` が auto 呼出され、 test 実行結果の総合品質を 5 軸 (coverage 達成度 / passing 件数 / flaky / 子 review 集約 / 後追い項目) で判定。

```text
tests/reports/review/result-review-{example}.{lang}.md
```

## Step 4.5 — auto-fix loop (review FAIL 時の自走修正、 上限なし)

result-review or 子 review が FAIL の場合、 `/kiwa-test` Step 5c が **自動で修正 loop** を回す。 上限なし、 以下 3 条件で終了。

| 終了条件 | アクション |
|---|---|
| ✅ PASS | result-review weighted_score >= 7.0 + critical 0 → 完了 |
| ⏸️ 停滞 | 連続 2 round で改善なし → user 介入 (継続 / 諦め完了 / 中断) |
| ⚠️ critical | security 関連 / 設計根本問題 / contract 未実装 等は自動修正不可 → user 介入必須 |

各 round で:
1. **failure 分類** — spec-review FAIL / test-review FAIL / result-review FAIL のいずれか
2. **対応 skill 再走** — review 指摘 prompt 付きで `/kiwa-design` (spec FAIL) or `/kiwa-{forge|hardhat|play}` (test FAIL or coverage 不足) を再起動
3. **再 review** — 修正後に review chain を再実行
4. **round 別 report 累積** — `tests/reports/integrated/{example}-{target}-round-{N}.md` に各 round 履歴保存

`--no-auto-fix` 引数で skip 可能 (review FAIL でも修正試行せず終了、 CI / 単発確認用)。

## Step 5 — completion summary を確認

`/kiwa-test` が user に return する summary 例:

```text
🎉 /kiwa-test 完了 — nextjs-token-gating (both)

判定: ✅ ALL PASS

実行サマリ:
- contract: Foundry 20/20 + Hardhat 23/23 × 4 round / coverage 100%
- dapp e2e: Playwright 12/13 PASS (1 skip TC-005) / 4 round flaky 0
- result-review: 8.4/10 PASS

統合 report: tests/reports/integrated/nextjs-token-gating-both.ja.md

次アクション: docs 更新 + PR 起票推奨
```

## debug 用 — 個別 skill を再走らせたい場合

`/kiwa-test` で全 chain が完走しない (例 contract で coverage 未達)、 個別 skill を debug したい:

```text
# spec 再生成
/kiwa-design --layer contract --module nextjs-token-gating --input contracts/ --lang ja

# Foundry test 再生成 (auto loop で coverage 補完)
/kiwa-forge --module nextjs-token-gating --gas-report --lang ja

# review 単体起動 (再 review)
/kiwa-review --mode spec-review --module nextjs-token-gating --layer contract --lang ja
/kiwa-review --mode test-review --module nextjs-token-gating --layer contract --lang ja
/kiwa-review --mode result-review --module nextjs-token-gating --lang ja
```

各 skill 単体起動の詳細手順は `tests/docs/run-contract-tests.ja.md` / `tests/docs/run-dapp-e2e-tests.ja.md`。

## トラブルシューティング

| 症状 | 対処 |
|---|---|
| `examples/{X}/app/ が存在しません` (dapp target) | UI なし example (mint-nft / nft-marketplace 等) なので target=contract を選択 |
| `examples/{X}/contracts/ が存在しません` (contract target) | contract なし example (basic-connect 等) なので target=dapp を選択 |
| contract FAIL で dapp skip された | contract 修正 (`/kiwa-forge` 単体起動で debug) 後に `/kiwa-test` 再走 |
| anvil port 衝突 | `pkill -f anvil` で既存 daemon 停止 |
| Playwright chromium 不在 | `pnpm --filter examples-{X} exec playwright install chromium` |
| Foundry panic (macOS) | `--no-coverage-loop` 引数で auto loop 1 round 化、 or 個別 skill で `FOUNDRY_OFFLINE=true` 指定 |
| review FAIL critical で停止 | report 指摘を確認 (`tests/reports/review/`)、 spec / test 修正後に再走 |

## 関連 docs

- contract test 個別手順 (Foundry + Hardhat): `tests/docs/run-contract-tests.ja.md`
- dApp e2e test 個別手順 (Playwright + viem): `tests/docs/run-dapp-e2e-tests.ja.md`
- skill 全体像 + 6 skill 役割: `tests/docs/README.ja.md`
- Layer 1 skill: `.claude/skills/kiwa-design/SKILL.md`
- Layer 2 Foundry skill: `.claude/skills/kiwa-forge/SKILL.md`
- Layer 2 Hardhat skill: `.claude/skills/kiwa-hardhat/SKILL.md`
- Layer 2 Playwright skill: `.claude/skills/kiwa-play/SKILL.md`
- reviewer skill: `.claude/skills/kiwa-review/SKILL.md`
- 統合 orchestrator skill: `.claude/skills/kiwa-test/SKILL.md`
