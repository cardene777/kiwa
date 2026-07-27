# @kiwa-lab/kaname

`@kiwa-lab/kaname` は、受け入れ条件を formal、runtime、human の三つの検証層に分類し、formal 用と runtime 用の Markdown 文字列へ分ける TypeScript toolkit です。状態遷移や数学的な契約を formal、実行時の振る舞いを runtime、人が確認する UX や承認を human として、一つの item に一つの検証責任を割り当てます。

![仕様項目を検証先へ分ける流れ](/images/kiwa-docs/foundation/kaname-overview.png)

`classify` は item ID、本文、layer、`verifyBy` を調べ、重複 ID、空の本文、未知の layer、空の検証先、formal と runtime が同じ artifact を参照する状態を report します。`splitSpec` は input を変えず、formal item だけを含む `specFormal` と、runtime と human item を含む `specRuntime` を文字列として返します。file の書込み、directory 作成、git への追加、test や Lean の実行は行いません。

## 使う判断

同じ acceptance criterion を「形式検証するもの」「実行して検証するもの」「人がレビューするもの」に分け、どの artifact が責任を持つかを曖昧にしない場合に使います。runtime test と human review を一つの自動 test と誤認しないこと、formal contract と integration test が同じ `verifyBy` を共有して検証漏れを作らないことが目的です。

classification は検証先 file の存在や test の成功を確認しません。`report.ok` は item の割当てが妥当なだけで、実装の正しさの証明ではありません。分割した文書を保存した後、formal artifact は Lean など、runtime artifact は対象 runner、人手 item は review process でそれぞれ確認します。

## 読み進める

[Quickstart](./quickstart) は最小の specification を分類して split し、Vitest で実行します。[使い方](./how-to) は分類 failure の修正と、生成結果を source control へ保存する責任を説明します。[リファレンス](./reference) は issue reason、入出力の形、pure function としての制約を確認するためのページです。
