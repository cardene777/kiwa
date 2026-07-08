# x.com 投稿用下書き — 日本語 thread (v1.2 milestone voice)

> 投稿先 ... [@cardene777](https://x.com/cardene777)
> Voice ... 本人名義 / 個人 dev 視点 / 「v1.2 完成した」 maker トーン
> 動画 ... `assets/kiwa-promo-ja.mp4` (再利用) を 1 ツイート目に添付
> 想定 ... 1 ツイート 140 字以内
> 全 8 ツイート、 番号 [1/8] 付き

---

## [1/8] (動画添付)

polyglot test toolchain 「kiwa」 v1.2 milestone (11/11 resolved) が land しました。

server-side framework 9 種 + ORM 3 種が「1 spec から並列生成」 の輪に入り、 「test stack 散乱」 を解決する範囲が一段広がりました。

https://github.com/cardene777/kiwa

#OSS #testing

---

## [2/8]

v1.2 で増えたもの。

- npm package ... 11 → 20 (+9)
- Claude Code skill ... 15 → 25 (+10)
- 対応 runtime ... Node のみ → Node / Bun / Deno / Edge
- ORM matrix ... 0 → 9 組合せ (Drizzle / Prisma / Kysely × SQLite / Postgres / MySQL)

---

## [3/8]

server-side framework adapter が 9 種に。

Next.js / Nuxt / SvelteKit / Remix / Astro / SolidStart / Qwik City / Cloudflare Workers + Vercel Edge / ORM (Drizzle + Prisma + Kysely)。

全部 `setupXxxEnv` + `mode` + `stop()` 契約を共有しています。

---

## [4/8]

`@kiwa/orm` v0.6.0 で ORM query test の受入 matrix が 9 組合せに到達しました。

mock mode (Docker 不要) で速く回し、 live mode (testcontainers) で実 DB に対する query test を deterministic に書ける、 という基本構成です。

---

## [5/8]

GitHub Issue #525 (5 framework full PoC) も land しました。

`examples/{nuxt|sveltekit|remix|astro|nextjs}-full/` 配下に real dev server + kiwa helper unit test + Playwright e2e の 2 軸構成で 5 例置いてあります。 retrofit 時の reference にどうぞ。

---

## [6/8]

CI runtime を 3 系統に拡張しました。

- Node.js 20+
- Bun 1.3+ (`bunx --bun vitest run`)
- Deno 2.x (`deno run --allow-all npm:vitest run`)

全 19 package が 3 runtime で pass する状態を維持しています。

---

## [7/8]

Claude Code plugin として install すれば dApp 以外の web app でも全 layer 並列生成できます。

```
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
```

25 skill が `kiwa:` namespace で並びます。

---

## [8/8]

v1.3 は scope 検討中です。 候補は ORM matrix 補完 (Prisma + MySQL / Kysely Migrator) / 新 layer 追加 (auth / job queue / cache) / 既存 framework 深堀り の 3 系統。

要望は GitHub Discussions で集めます。 触ってみて感想ください。

https://github.com/cardene777/kiwa/discussions

#testing
