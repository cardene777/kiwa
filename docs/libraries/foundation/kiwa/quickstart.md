# kiwa をはじめる

ここでは Claude Code plugin を導入し、unit test の仕様を作って test を生成します。これは kiwa 全体の入口であり、実際の project では次に対象の library の Quickstart を実行します。

## plugin を導入する

Claude Code で対象 project を開き、次を順に実行します。marketplace を追加して plugin を導入し、現在の session に skill を反映します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

導入後は plugin の skill を `kiwa:` namespace で実行します。project-local skill の `/kiwa-vitest` ではなく、plugin を導入した project では `/kiwa:kiwa-vitest` と指定します。

## 最初の仕様と test を作る

次の例では、signup という unit を対象にします。最初の command が `tests/spec/` に仕様を作り、二つ目の command がその仕様を読み取って Vitest test を作ります。

```text
/kiwa:kiwa-design --layer unit --module signup
/kiwa:kiwa-vitest --module signup
```

既定の出力先を使った場合、生成された file は `test/unit/signup.test.ts` です。まずはその file だけを実行します。

```bash
pnpm exec vitest run test/unit/signup.test.ts
```

生成後に pass しても、期待する挙動が網羅されているとは限りません。作られた test の input、expectation、failure case を読み、実装の acceptance criteria と比べてください。spec と test を確認する review は次の command で実行します。

```text
/kiwa:kiwa-review --mode test-review --module signup --layer unit
```

## runtime を追加する

skill が生成する test で library を import する場合は、対象 package を project に追加します。共通の spec parser を使うなら `@kiwa-lab/core`、フォームなら `@kiwa-lab/form` のように、対象の library ページにある install command を使います。

```bash
pnpm add -D @kiwa-lab/core
```

この command だけで全 library が入るわけではありません。次はテスト対象の境界に対応する library を選び、その Quickstart の code を動かしてください。
