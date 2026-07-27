---
name: kiwa-astro
description: |
  @kiwa-lab/astro を使って Astro endpoint、page signal、View Transition lifecycle の test を作る skill。
  dev server や browser を起動せず、application の入力と結果の契約を Vitest で検証する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-astro Astro test を作る

`@kiwa-lab/astro` は Astro runtime の代替ではない。endpoint の request と response、page function の redirect、not found、rewrite、View Transition listener の順序を、速い単体 test として確認する skill である。実 route 解決、`.astro` compile、Islands hydration、visual transition は生成対象に含めない。

## 入力と出力

`--module` は対象名、`--output` は生成する test file の path、`--mode` は `endpoint`、`page`、`view-transition` のいずれかを指定する。出力先を省略したときは `tests/{module}.astro.test.ts` を使う。既存の source code と requirement から作れるほか、必要なら `/kiwa:kiwa-design --layer astro-endpoint --module {module}` で作った仕様を `--spec-path` から読む。

## endpoint の test

endpoint には `invokeEndpoint` を使う。実 application の handler を `endpoint` に渡し、URL、method、params、headers、cookies、`jsonBody` または `formData`、locals を必要な分だけ与える。`response.status`、body、redirect を assertion する。body ありの既定 method は POST、body なしの既定 method は GET である。

## page signal の test

page function は `renderAstroPage` に渡す。HTML string、Response、redirect、`kiwaAstroNotFound`、rewrite を結果として assertion する。signal ではない exception は `result.error` と 500 response になる。cookie jar は一回の helper 呼び出しだけにあり、response の Set-Cookie は次の request へ自動で渡らない。

## View Transition の test

`setupAstroViewTransitionEnv` に from と to の path を渡し、必要な listener を登録して `dispatchAll()` を呼ぶ。`astro:before-preparation` の `preventDefault()` は navigation を中止する。`supportsViewTransitions` が false でも lifecycle event は dispatch されるが、`before-swap` の `viewTransition` は undefined である。listener が `swap()` を直接呼ぶと通常の swap と合算されるため、`swapCallCount` を assertion して二重実行を検出する。

## 実行と確認

生成後は output file を読み、endpoint、page、navigation のどれを確認している test かを分けて確認する。次に作成した file だけを実行する。

```bash
pnpm exec vitest run {output}
```

実 Astro router、middleware から page への接続、browser の transition は別の integration test と E2E test で確認する。

## 実行例

```text
/kiwa:kiwa-astro --module profile-api --mode endpoint --output tests/profile-api.astro.test.ts
/kiwa:kiwa-astro --module private-page --mode page --output tests/private-page.astro.test.ts
/kiwa:kiwa-astro --module blog-navigation --mode view-transition --output tests/blog-navigation.astro.test.ts
```
