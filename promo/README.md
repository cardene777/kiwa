# kiwa-promo

Promotional videos for [kiwa](https://github.com/cardene777/kiwa) authored with [Remotion](https://www.remotion.dev/).
React + TSX で programmatic に動画を作成し、 git diff で改善を review 可能にします。

## Compositions

| id | duration | usage |
|---|---|---|
| `Opening` | 5s | Title scene with logo zoom-in, tagline reveal, boundary line effect |
| `Outro` | 5s | CTA scene with npm install command, GitHub / npm links |

Phase B-1 (this PR) covers scaffold + Opening + Outro. Demo scenes (Problem / Solution / Demo / Coverage / Install) land in subsequent PRs.

## Develop

```bash
pnpm install
pnpm -F kiwa-promo studio   # launches Remotion Studio at http://localhost:3000
```

## Render

```bash
pnpm -F kiwa-promo render:opening   # → promo/out/opening.mp4
pnpm -F kiwa-promo render:outro     # → promo/out/outro.mp4
```

Rendering requires ffmpeg-compatible environment. Output goes to `promo/out/` (gitignored).

## Structure

```
promo/
├── public/
│   └── kiwa-logo.png        ← staticFile target for KiwaLogo
├── src/
│   ├── index.ts             ← registerRoot entry
│   ├── Root.tsx             ← Composition registry
│   ├── tokens.ts            ← Color / font / spacing design tokens
│   ├── components/
│   │   ├── Background.tsx   ← Gradient background wrapper
│   │   ├── KiwaLogo.tsx     ← Spring-animated logo
│   │   └── BoundaryEffect.tsx  ← Vertical boundary line (kiwa motif)
│   └── scenes/
│       ├── Opening.tsx
│       └── Outro.tsx
├── package.json
├── tsconfig.json
└── remotion.config.ts
```

## License

MIT, same as kiwa. Logo asset is shared from `assets/kiwa-logo.png` via `promo/public/`.
