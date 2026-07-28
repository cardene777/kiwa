# Visual リファレンス

## comparePngBuffers

`comparePngBuffers(baseline, actual, options)` は2つの PNG buffer を非同期で比較し、`CompareResult` を返します。baseline と actual のサイズは完全に一致する必要があります。

| option | 既定値 | 動作 |
| --- | --- | --- |
| `maxDiffRatio` | `0.005` | 合格とみなす最大差分比率 |
| `threshold` | `0.1` | pixelmatch の画素差感度 |
| `includeAA` | `false` | アンチエイリアスを差分に含めるか |
| `emitDiff` | `true` | 差分 PNG を生成するか |

`maxDiffRatio` は 0 から 1 の比率として指定します。関数は入力値を制限しないため、範囲外の値を渡すとその値で比較します。テストの意味を保つため、0 から 1 の範囲で指定してください。

## CompareResult

| field | 内容 |
| --- | --- |
| `size` | 比較した PNG の `width` と `height` |
| `diffPixels` | pixelmatch が返した差分画素数 |
| `diffRatio` | `diffPixels / width / height` |
| `ok` | `diffRatio` が許容比率以下か |
| `diffBuffer` | `emitDiff` が true のときの PNG buffer。それ以外は null |

幅または高さが 0 の PNG が decode できた場合、全画素数が 0 のため `diffRatio` は 0 になります。通常の PNG 生成器では有効なゼロサイズ画像を作れません。

## expectNoVisualDiff

`expectNoVisualDiff(result, expect)` は `result.ok` が false のとき Error を throw します。Error には差分画素数と百分率表示の差分比率が含まれます。true のときは渡された `expect` に `result.ok` が true である assertion を委譲します。

この helper は Vitest や Jest など、`expect(value).toBe(value)` 形状を持つ assertion 関数を受け取ります。

## エラー条件

- `pngjs` を解決できない場合は `pngjs` の追加を促す Error
- `pixelmatch` を解決できない場合は `pixelmatch` の追加を促す Error
- PNG の幅または高さが違う場合は両方のサイズを含む Error
- 不正な PNG buffer の decode error は `pngjs` からそのまま返る

このライブラリは PNG 以外の画像形式を変換しません。JPEG や WebP はあらかじめ PNG に変換してください。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>comparePngBuffers requires "pixelmatch". Run &#96;pnpm add -D pixelmatch&#96;.</code> | [packages/visual/src/compare.ts](https://github.com/cardene777/kiwa/blob/main/packages/visual/src/compare.ts#L28) |
| <code v-pre>comparePngBuffers requires "pngjs". Run &#96;pnpm add -D pngjs&#96;.</code> | [packages/visual/src/compare.ts](https://github.com/cardene777/kiwa/blob/main/packages/visual/src/compare.ts#L37) |
| <code v-pre>comparePngBuffers: size mismatch $&#123;a.width&#125;x$&#123;a.height&#125; vs $&#123;b.width&#125;x$&#123;b.height&#125;. Resize before comparing.</code> | [packages/visual/src/compare.ts](https://github.com/cardene777/kiwa/blob/main/packages/visual/src/compare.ts#L50) |
| <code v-pre>Visual diff exceeded threshold: $&#123;result.diffPixels&#125; pixels ($&#123;(result.diffRatio &#42; 100).toFixed(2)&#125;%).</code> | [packages/visual/src/compare.ts](https://github.com/cardene777/kiwa/blob/main/packages/visual/src/compare.ts#L81) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/visual/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [compare.ts](./api/compare) | 2 | 0 |
| [types.ts](./api/types) | 0 | 3 |

<!-- kiwa-public-api:end -->
