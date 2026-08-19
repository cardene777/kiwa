# vitest-unit-poc

`unit` layer の最小 example。 `/kiwa-design --layer unit` が書いた spec を `/kiwa-vitest` が
Vitest の test に変換する経路を、 実際に解決できる形で置いている。

`unit` は **backing package を持たない** layer (`docs/layers.json` の `backing_package: null`) で、
kiwa の adapter を使わない。 依存は `typescript` / `vitest` / `@types/node` だけ。

## 構成

```
vitest-unit-poc/
├── src/
│   └── token.ts                        # 対象の純粋 logic (import を持たない)
├── tests/spec/unit/
│   └── test-spec-token.md              # Layer 1 spec (15 TC)
└── test/unit/
    └── token.test.ts                   # 15 test (正規化 / 失効判定 / backoff)
```

spec が `tests/spec/unit/` に、 test が `test/unit/` に置かれる。 dir が分かれるのは
`docs/layers.json` の宣言 (`spec_path` は `tests/spec/{spec_dir}/`、 `test_outputs` は
`{example}/test/unit/`) がそう定めているためで、 `nextjs-api-poc` も同じ形になっている。

## 実行

```bash
pnpm -F examples-vitest-unit-poc test
```

## 何を demo しているか

| mode | 対象 | 使う helper |
|---|---|---|
| pure | `normalizeTag` / `nextBackoffMs` | `describe` / `it` / `expect` だけ |
| fake-timer | `isExpired` | `vi.useFakeTimers` + `vi.setSystemTime` |

`isExpired` は `Date.now()` を直接読む。 現在時刻を引数で受け回さない代わりに、 test 側で
固定する形にしてある = 実時刻のままだと境界 (`issuedAt + ttlMs` ちょうど) の判定が実行
タイミングで揺れる。
