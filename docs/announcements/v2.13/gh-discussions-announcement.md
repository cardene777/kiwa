# kiwa v2.13 released — @kiwa/* → @kiwa-lab/* rename (npm org `kiwa` 使用不可 → `@kiwa-lab` 新規 org、 v2.0 rename revert form、 2326 file 一斉 rename、 42 package 全 initial release to @kiwa-lab、 v1.x @kiwa-test/* deprecated)

npm org `kiwa` が他組織 予約済で使用不可判明、 全 42 package を `@kiwa-lab/*` に rename。 `@kiwa-lab` = Lean 形式検証 + testing + spec-driven の 統合実験場 branding、 v2.14+ で Lean library 追加予定。

```bash
pnpm add -D @kiwa-lab/{package-name}
```

v1.x `@kiwa-test/*` は deprecated notice で `@kiwa-lab/*` へ誘導。

[Migration v2.12 → v2.13](https://cardene777.github.io/kiwa/migrations/v2.12-to-v2.13)
