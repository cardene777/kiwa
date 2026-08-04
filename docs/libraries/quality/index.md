# 品質

品質カテゴリは、テストの結果を release 判断へつなげるためのライブラリです。coverage の数字だけを集めるのではなく、性能、accessibility、security、mutation のように異なる根拠を、同じ結果として読めるようにします。

## 確認したい品質から選ぶ


脆弱な入力、認可、秘密情報、依存関係を扱うテストは [Security](./security/)、SAST、SBOM、CI 上の security evidence を組み立てる処理は [Security DevSecOps](./security-devsecops/) を参照してください。

## 使い方の順序

まず個別のテストで metric を作り、Quickstart の例と同じように期待値を固定します。その metric を release gate へ渡すのは最後です。gate は失敗を隠す道具ではなく、どの観点が不足しているかを出すためのものです。しきい値、override、実際に release を止める条件は [リリース基準](/quality/release-gate) を確認してください。

## 境界

これらのライブラリは監査や侵入試験を代替しません。プロダクション監視、第三者監査、実運用の負荷試験は別途必要です。どこまでがテストで証明でき、どこからが運用上の確認かを各ページの対象外で区別してください。
