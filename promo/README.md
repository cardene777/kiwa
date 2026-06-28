# kiwa-promo

Promotional videos for [kiwa](https://github.com/cardene777/kiwa) authored with [Remotion](https://www.remotion.dev/).
React + TSX で programmatic に動画を作成し、 git diff で改善を review 可能にします。

現在の出力は v10 = 14 scene 127s 構成、 Web (Next.js) / Contract (Solidity) / dApp (Playwright) の 3 カテゴリ × 6 step (design → gen → run → review → patch → coverage) を 1 本に統合した kiwa overview。

## Compositions

統合 composition は `KiwaPromo`、 13 個の v10 scene を `Series` で連結する (合計 127s)。

| id | duration | usage |
|---|---|---|
| `KiwaPromo` | 127s | 統合 composition (v10 全 scene を Series 連結、 ja / en は `src/tokens.ts` の `locale` 切替で再 render) |
| `V10BrandIntro` | 5s | logo + tagline + boundary line (1 本縦線エフェクト) |
| `V10Problem` | 6s | 課題提示 (AI 時代の test SSOT 不在) |
| `V10Explain` | 5s | kiwa が解く範囲の説明 |
| `V10Solution` | 8s | 6 surface (contract / api / ui / e2e / a11y / visual) を左右に配置した hub-and-rays |
| `V10Method` | 5s | 11 観点 × 9 セクションの統一仕様 format |
| `V10Coverage` | 6s | カバレッジ確認とギャップ可視化 |
| `V10Loop` | 7s | 仕様書 → テスト → カバレッジの循環フロー |
| `V10DemoWeb` | 22s | Web デモ (Next.js UserProfile、 6 step 完結) |
| `V10DemoContract` | 22s | Contract デモ (Solidity TokenGate、 6 step 完結) |
| `V10DemoDapp` | 22s | dApp デモ (Playwright MintFlow、 6 step 完結) |
| `V10ManualWrite` | 10s | 手書き経路 (単一 CodeBlock 表示、 spec panel なし) |
| `V10Cta` | 4s | CTA (npm install / GitHub link) |
| `V10BrandOutro` | 5s | logo + tagline + boundary line (longer sweep) |

## Develop

```bash
pnpm install
pnpm -F kiwa-promo studio   # launches Remotion Studio at http://localhost:3737
```

Studio is pinned to port **3737** (see `remotion.config.ts`) so it never fights with a Vite or Next dev server on the usual 3000 slot. Override with `--port=<n>` on the CLI if you need a different one.

## Render

```bash
# 統合 composition (推奨、 これだけで OK)
pnpm -F kiwa-promo render:promo   # → promo/out/kiwa-promo.mp4 (127s)

# 個別 scene を debug 用に出力したい場合
pnpm -F kiwa-promo exec remotion render V10DemoWeb out/web.mp4
pnpm -F kiwa-promo exec remotion still V10BrandIntro out/intro-frame-60.png --frame=60
```

ja / en は `src/tokens.ts` の `locale: "ja" | "en"` を切替えて 2 回 render、 web 互換版は ffmpeg で main profile + faststart に変換する。

```bash
# ja → en 切替で 2 回 render
sed -i '' 's/locale: "ja"/locale: "en"/' src/tokens.ts
pnpm exec remotion render KiwaPromo out/v104-en.mp4 --concurrency=2 --jpeg-quality=88

# web 互換 + size 圧縮 (各 2-3 MB target)
ffmpeg -y -i out/v104-en.mp4 -c:v libx264 -profile:v main -preset slow -crf 23 \
  -pix_fmt yuv420p -movflags +faststart -an out/v104-en-web.mp4
```

Rendering requires ffmpeg-compatible environment. Output goes to `promo/out/` (gitignored)、 完成 mp4 は `assets/kiwa-promo-{ja,en}.mp4` に commit して repo top README から参照する。

## Structure

```
promo/
├── public/
│   └── kiwa-logo.png        ← staticFile target for KiwaLogo
├── src/
│   ├── index.ts             ← registerRoot entry
│   ├── Root.tsx             ← Composition registry (KiwaPromo + 13 V10 scene)
│   ├── tokens.ts            ← color / font / spacing / locale (ja/en) 切替
│   ├── components/
│   │   ├── Background.tsx   ← Gradient background wrapper
│   │   ├── KiwaLogo.tsx     ← Spring-animated logo
│   │   ├── BoundaryEffect.tsx  ← 1 本縦線「ビリビリ」 エフェクト (kiwa motif)
│   │   ├── SceneLayout.tsx  ← eyebrow + headline + content の構造分離
│   │   ├── Terminal.tsx     ← macOS 風 terminal + 行ごと type animation
│   │   ├── CodeBlock.tsx    ← 8 種 syntax highlight (TS / Solidity 等)
│   │   └── SplitScreen.tsx  ← 2-3 panel 横並び
│   └── scenes/
│       ├── KiwaPromo.tsx           ← Series 連結
│       ├── V10BrandIntro.tsx
│       ├── V10Problem.tsx
│       ├── V10Explain.tsx
│       ├── V10Solution.tsx
│       ├── V10Method.tsx
│       ├── V10Coverage.tsx
│       ├── V10Loop.tsx
│       ├── V10DemoCategory.tsx     ← Web / Contract / Dapp 共通 6 step terminal flow
│       ├── V10DemoWeb.tsx
│       ├── V10DemoContract.tsx
│       ├── V10DemoDapp.tsx
│       ├── V10ManualWrite.tsx
│       ├── V10Cta.tsx
│       └── V10BrandOutro.tsx
├── package.json
├── tsconfig.json
└── remotion.config.ts
```

## License

MIT, same as kiwa. Logo asset is shared from `assets/kiwa-logo.png` via `promo/public/`.
