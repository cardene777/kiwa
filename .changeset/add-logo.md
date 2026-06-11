---
"@kiwa-test/core": patch
"@kiwa-test/cli": patch
---

公式 logo を packages/{core,cli}/README header に追加して npm package page で表示できるようにした。

assets/kiwa-logo.png を repo に配置し、 packages/{core,cli}/README.{md,ja.md} の冒頭に `<p align="center">` で中央寄せ logo を挿入。 npm package page は repo の相対 path を解決できないため、 raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-logo.png の絶対 URL で参照する。 logo は黒緑 2 色で「際 (boundary)」 を体現するキャラクター design、 brand identity を確立する目的の patch release。 機能 / API 変更なし。
