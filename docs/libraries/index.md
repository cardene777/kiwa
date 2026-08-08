---
title: kiwa ライブラリ
description: テスト対象の境界から kiwa のライブラリを選ぶ。
---

# kiwa ライブラリ

kiwa は、アプリケーションが外部と接する場所ごとに選べる 49 のテストライブラリ群です。TypeScript package に加え、Python のネイティブライブラリがあります。各ページは README、public export、代表 test を根拠にしています。まずテストしたい境界を決め、そこで必要な最小のライブラリだけを選んでください。

<img src="/images/kiwa-docs/library-catalog.webp" alt="テスト対象からライブラリカテゴリを選ぶ流れ" width="1693" height="929" loading="lazy" decoding="async">

## テスト対象から選ぶ

HTTP、ブラウザ、CLI、dApp、端末などアプリケーションそのものの境界を扱う場合は [基盤](./foundation/) を開きます。Next.js、Nuxt、Hono、Remix の route と server handler は [フレームワーク](./frameworks/) を選んでください。

認証、決済、メール、キャッシュ、queue のように外部サービスとやり取りする処理は [サービス](./services/) が対象です。LLM、agent、検索、イベント配信、画像比較は [AI とリアルタイム](./ai-realtime/) にあります。a11y、性能、release gate、security evidence をテスト結果へ組み込む場合は [品質](./quality/) を参照します。

Python の標準 test runner で直接使う場合は [ネイティブ言語](./native-languages/) を選びます。

## ページの役割

Overview では、採用してよい問題と対象外の実サービス挙動を確認します。Quickstart は、最小のテストを動かすための手順です。使い方では、実装中に増える状態、失敗、複数の操作を扱います。Reference は public API の引数、戻り値、失敗条件を確認する場所です。最初から Reference を読み切る必要はありません。Quickstart を通して、疑問が出た API だけを Reference で調べてください。
