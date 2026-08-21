# 期待結果の識別力 — SSOT

生成する test が「壊れた実装を検知できるか」 の規範。
`kiwa-design` Step 4 / `kiwa-vitest` / `kiwa-forge` / `kiwa-review` が共有する。

## なぜこの file があるか

**行カバレッジは「実行されたか」 しか測らない**。 assertion が何も検証していなくても 100% になる。

kiwa 自身の package で実測した。 `packages/core/src/temp.ts` に防御分岐の test を 7 件足した時の値。

| 指標 | 前 | 後 |
|---|---|---|
| 行カバレッジ | 94.74% | 98.09% |
| **生存変異** | **36 件** | **36 件 (変化なし)** |

行カバレッジは 3.35 ポイント上がったが、**壊しても気付けない箇所は 1 件も減らなかった**。
狙いを変異に変えた 12 test で 16 件減った。 test 数だけで効果は決まらず、狙う対象で
結果が分かれた。

kiwa は利用者の test を生成する library なので、弱い test を生成すると利用者全員に伝播する。

## 規範

**期待結果は、実装を壊した時に値が変わるものを名指しする。**

Step 4 の 9 column 表の `期待結果` を書く時、次を自問する。

> この実装の該当箇所を 1 行壊したら、この期待結果は成立しなくなるか。

「はい」 でなければ、その期待結果は識別力を持たない。 観測する対象を変える。

## 期待対象を十分に識別しない 3 形 (本 repo の実測)

### 1. アプリケーション成否に関わらず成立する status

`examples/dogfood-security-*/src/lib/next-server.ts` の 6 example で実測した。
HTTP status がアプリケーション処理の成否を表していない。

| 種別 | status |
|---|---|
| 成功 | 200 |
| **route validator の検証失敗** | **200** |
| **handler が捕捉した状態不整合** | **200** |
| 未知の path | 404 |
| POST 以外の method | 405 |

正しい method / path / JSON で dispatch が応答を返せば、アプリケーション処理の成否に
関わらず 200 になる。 `status===200` は 400 / 404 / 405 / 500 の transport failure を
検知する補助 assertion にはなるが、**アプリケーション処理の成功は確かめられない**。
成否を判別している body の `ok` と結果種別を併せて見る。

| 書き方 | 識別力 |
|---|---|
| `expect(res.status()).toBe(200)` | transport failure は検知するが、検証失敗と状態不整合も通るため成功判定にはならない |
| `expect(body).toMatchObject({ ok: true, kind: 'build' })` | ある |

### 2. 実測より緩い件数

`examples/dogfood-security-sbom-scanning-app/tests/e2e/sbom-scanning-flow.spec.ts` の
`expect(scanBody.findings.length).toBeGreaterThanOrEqual(1)` を実測すると、
同じ入力に対する findings は **常にちょうど 1 件**で、契約上も AWS access key 1 件を
返す case だった。

`>= 1` は 2 件に変わっても、別種別だけが当たるようになっても通る。 契約が件数を
定める場合はその値を書き、少なくとも期待する種別と内容を確かめる。

| 書き方 | 識別力 |
|---|---|
| `expect(findings.length).toBeGreaterThanOrEqual(1)` | この case には弱い。契約は AWS access key 1 件 |
| `expect(findings).toHaveLength(1)` + `expect(findings[0].kind).toBe('aws-access-key')` | ある |

**現在の実測値だけを理由に exact count を契約へ昇格させない**。 件数を定めない契約なら
下限と期待種別を併記する。件数を定める契約なのに下限だけを書くと、挙動が変わっても
気付けない。

### 3. 両経路が同じ結果を返す

「例外が飛ぶこと」 だけを見る形。 `packages/core/tests/temp-branches.defensive.test.ts` で
実際に踏んだ。

`createManagedTempDir` の回収は、失敗を握り潰して掘る側を続行する契約を持つ。
これを確かめる test で root の権限を落とすと、**回収も `mkdtemp` も落ちる**。

| 状況 | 結果 |
|---|---|
| 握り潰している (正しい) | `mkdtemp` の例外が飛ぶ |
| 握り潰していない (壊れている) | 回収の例外が飛ぶ |

どちらも throw するので、`expect(() => ...).toThrow()` では区別できない。
**例外の出所まで見て初めて識別できる**。

~~~ts
const message = (caught as Error).message;
// mkdtemp まで進んだことを、掘ろうとした temp の prefix で確かめる
expect(message).toContain('kiwa-temp-');
// 回収側の例外が漏れていないことを、対象 entry の名前が出ないことで確かめる
expect(message).not.toContain(victimBasename);
~~~

弱い形に戻して変異を当てると **検知できない**ことを実測で確認している。

## 「消えないこと」 を見る test には対照を置く

「〜されないこと」 を見る test を並べると、**処理そのものが動いていなくても全件緑になる**。

`temp.ts` の回収では「この条件では消さない」 test を 7 件書いたが、回収が丸ごと壊れていても
7 件とも通る。 すべての条件を満たす対象が **実際に消えること** を見る test を 1 件足して、
空振りを防いだ。

同じ構造は `rules/quality.md § 対象を走査する検査は「1 件以上あった」 ことを併記済` が
別の形で記録している。

## 殺せない変異を「殺せない」 と判定してよい条件

すべての変異を殺せるわけではない。 **実測で確かめた時だけ**等価変異と判定してよい。

本 repo の実例。

| 変異 | なぜ殺せないか | 確かめ方 |
|---|---|---|
| `pid <= 0` を `pid < 0` に | 当該 mutation run の macOS 環境では `process.kill(0, 0)` が **成功した** (プロセスグループ宛て) ため、後段の生存判定が同じ結果を返した | 同じ対象環境で `node -e` を実行して再確認 |
| 脱出ガードの条件式 | 上流の検証が到達する入力を作らせない | 入力を組もうとして組めないことを示す |

「たぶん等価」 で片付けない。 判定した根拠を PR body か code comment に残す。

## Layer 2 への引き継ぎ

`kiwa-vitest` / `kiwa-forge` は Step 4 の `期待結果` を assertion に変換する。
Layer 2 は実装の現在値を見て **spec に無い期待値を発明してはならない**。 Layer 1 の期待結果が
緩くて識別力を持たない場合は強めずに報告し、Layer 1 を直す。

Layer 2 が選べるのは、同じ期待結果を正確に表現する matcher
(`toHaveLength` / `toMatchObject` / `toBe` 等) までになる。
