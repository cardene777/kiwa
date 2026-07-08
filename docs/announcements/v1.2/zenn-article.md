---
title: "kiwa v1.2 — 20 package + 9 framework + 9 ORM matrix で polyglot test toolchain が一段完成した"
emoji: "🌱"
type: "tech"
topics: ["testing", "oss", "playwright", "vitest", "drizzle"]
published: false
---

# 概要

polyglot test toolchain `kiwa` の v1.2 milestone (11/11 Issue resolved) が land しました。

contract / API / component / e2e / a11y / visual に加えて、 **server-side framework 9 種** と **ORM query 3 種** が「1 つの Layer 1 spec から並列生成」 の輪に入り、 「test stack 散乱問題」 を解決する範囲が一段広がりました。

```bash
# 全 20 package が npm 公開済
npm install @kiwa/orm @kiwa/edge @kiwa/sveltekit
# Python pytest adapter も継続
pip install kiwa-test-py
```

## v1.2 で land した 3 つの軸

直近 22 PR で v1.2 を出荷しました。 目玉は 3 点です。

### 1. server-side framework adapter が 9 種に拡張

| Framework | Helper | release |
|---|---|---|
| Next.js (App Router / Server Actions / RSC) | `@kiwa/nextjs` | v1.0 (v1.1) |
| Nuxt 3 (Nitro) | `@kiwa/nuxt` | v1.0 (v1.1) |
| SvelteKit 2 (load + actions + hooks) | `@kiwa/sveltekit` | v1.0.1 (v1.2) |
| Remix v2 (loader + action + Resource Routes) | `@kiwa/remix` | v1.0 (v1.1) |
| Astro v5 (Server endpoints + `.astro` SSR) | `@kiwa/astro` | v1.0 (v1.1) |
| SolidStart | `@kiwa/solidstart` | v1.0 (v1.2) |
| Qwik City | `@kiwa/qwikcity` | v1.0 (v1.2) |
| Cloudflare Workers / Vercel Edge | `@kiwa/edge` | v1.0 (v1.2) |
| ORM (Drizzle / Prisma / Kysely) | `@kiwa/orm` | v0.6.0 (v1.2) |

全 adapter が `mode + stop()` 契約を共有し、 同じ `setupXxxEnv` パターンで使えます。 dynamic import + optional peer dep なので、 利用者は使う framework だけ install すれば動きます。

### 2. ORM query test を 9 組合せ matrix で網羅

`@kiwa/orm` v0.6.0 で受入 matrix が 9 組合せに到達しました。

| ORM | dialect | mode | container |
|---|---|---|---|
| Drizzle | SQLite | mock (in-memory) | (Docker 不要) |
| Drizzle | Postgres | live | testcontainers |
| Drizzle | MySQL | live | testcontainers |
| Drizzle | SQLite | file migration | `drizzle-orm/migrator` |
| Prisma | SQLite | tempdir | `prisma db push` |
| Prisma | Postgres | live | testcontainers |
| Kysely | SQLite | mock | (Docker 不要) |
| Kysely | Postgres | live | testcontainers |
| Kysely | MySQL | live | testcontainers |

`setupOrmEnv({ orm, dialect, mode, schema })` で `env.db` + `env.connectionUri` + `env.stop()` の同じ契約に落ちます。 mock mode で速く回し、 live mode で実 DB に対する query test を deterministic に書ける構成です。

### 3. Bun / Deno runtime + Edge runtime も pass

CI workflow を 3 系統に拡張しました。

| Runtime | 動作確認 |
|---|---|
| Node.js 20+ | `.github/workflows/test.yml` (主) |
| Bun 1.3+ | `.github/workflows/test-bun.yml` (`bunx --bun vitest run`) |
| Deno 2.x | `.github/workflows/test-deno.yml` (`deno run --allow-all npm:vitest run`) |
| Cloudflare Workers / Vercel Edge | `@kiwa/edge` (KV mock + `invokeEdgeHandler`、 Miniflare 不要) |

全 19 package が Node / Bun / Deno の 3 runtime で pass する状態を維持しています。

## 何が新しいか — full PoC 5 framework 完遂

v1.2 の最後の山が GitHub Issue #525 (5 framework full PoC) でした。 `examples/{framework}-full/` 配下に real dev server + kiwa helper unit test + Playwright e2e の 2 軸構成で **Nuxt / SvelteKit / Remix / Astro / Next.js** の 5 例を完遂しました。

```
examples/
├── nuxt-server-routes-full/      # Nuxt 3 + @kiwa/nuxt v1.0.4 全 3 helper
├── sveltekit-full/                # SvelteKit 2 + @kiwa/sveltekit 全 3 helper
├── remix-full/                    # Remix v2 + @kiwa/remix loader/action/Resource Route
├── astro-server-endpoints-full/   # Astro v5 SSR + @kiwa/astro invokeEndpoint
└── nextjs-app-router-full/        # Next.js v15 + @kiwa/nextjs 全 4 layer 統合
```

retrofit したい場合の「ここから始める」 reference として使えます。

## skill chain も 9 framework 対応

`/kiwa-design --layer {layer}` が 9 layer に増えました。 contract / unit / integration / e2e / a11y / visual / api / orm-query + framework 別 sub-feature。

`/kiwa-{forge,hardhat,vitest,api,play,orm,review}` の Layer 2 skill 群も全部 9 framework + ORM 対応。 Claude Code plugin として install すれば dApp 以外の web app でも全 layer が並列生成できます。

```bash
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
```

## 統計

| 軸 | v0.5 | v1.2 | 差分 |
|---|---|---|---|
| npm package | 11 | 20 | +9 (framework + edge + orm) |
| PyPI package | 1 | 1 | (継続) |
| Claude Code skill | 15 | 25 | +10 |
| 対応 runtime | Node | Node / Bun / Deno / Edge | +3 |
| ORM matrix | (n/a) | 9 組合せ | 新規 |
| full PoC example | 1 | 6 | +5 (5 framework) |

## v1.3 は scope 検討中

v1.2 が一段完成したので、 次の v1.3 は user feedback を集めながら scope を決めます。 候補は ORM matrix 補完 (Prisma + MySQL / Kysely Migrator) / 新 layer 追加 (auth / job queue / cache) / 既存 framework 深堀り の 3 系統です。

「こういう test layer も自動生成したい」 という要望は [GitHub Discussions](https://github.com/cardene777/kiwa/discussions) で集めます。

## 試す

```bash
# Claude Code plugin (推奨)
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace

# 単体 fixture だけ使う
pnpm add -D @kiwa/dapp @kiwa/orm

# Python service の test も同じ spec で
pip install kiwa-test-py
```

repo は https://github.com/cardene777/kiwa です。 v0.5 announcement で書いた「test stack 散乱を 1 spec で解決」 の射程が、 v1.2 で **dApp + 9 framework + 3 ORM + 3 runtime** まで広がりました。

contract / API / component / e2e / a11y / visual / framework / ORM を 1 spec で扱える toolchain として、 そろそろ「自分の app の test 設計の hub」 として置ける状態です。
