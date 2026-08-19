# test-spec-token (unit layer)

`src/token.ts` の純粋 logic を対象にした Layer 1 spec。
`unit` layer は backing package を持たない (`docs/layers.json` の `backing_package: null`) ため、
Vitest の素の helper (`describe` / `it` / `expect` / `vi.useFakeTimers`) だけで表現する。

- module: token
- layer: unit

## テストケース一覧

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| T-UNIT-001 | 単体 | 正規化の基本形 | 副作用なし (`normalizeTag` は純関数) | `"Hello World"` | `normalizeTag` を呼ぶ | `"hello-world"` | 高 | 推奨 |
| T-UNIT-002 | 単体 | 連続する区切りを 1 つに潰す | 副作用なし (`normalizeTag` は純関数) | `"a  --  b"` | `normalizeTag` を呼ぶ | `"a-b"` | 高 | 推奨 |
| T-UNIT-003 | 単体 | 両端の区切りを落とす | 副作用なし (`normalizeTag` は純関数) | `"__abc__"` | `normalizeTag` を呼ぶ | `"abc"` | 高 | 推奨 |
| T-UNIT-004 | 単体 | 英数字が 1 文字も無い | 副作用なし (`normalizeTag` は純関数) | `"！？"` | `normalizeTag` を呼ぶ | `""` | 中 | 推奨 |
| T-UNIT-005 | 単体 | maxLength で切り詰める | 副作用なし (`normalizeTag` は純関数) | `"abcdefghij"` maxLength=4 | `normalizeTag` を呼ぶ | `"abcd"` | 中 | 推奨 |
| T-UNIT-006 | 単体 | 切り口が区切りなら落とす | 副作用なし (`normalizeTag` は純関数) | `"ab cdef"` maxLength=3 | `normalizeTag` を呼ぶ | `"ab"` | 中 | 推奨 |
| T-UNIT-007 | 単体 | maxLength=0 は空を返す | 副作用なし (`normalizeTag` は純関数) | `"abc"` maxLength=0 | `normalizeTag` を呼ぶ | `""` | 低 | 推奨 |
| T-UNIT-008 | 単体 | TTL 内は有効 | fake-timer な純関数 (`isExpired`) | issuedAt=1000 ttl=500、 now=1400 | `isExpired` を呼ぶ | `false` | 高 | 推奨 |
| T-UNIT-009 | 単体 | 境界ちょうどは失効 | fake-timer な純関数 (`isExpired`) | issuedAt=1000 ttl=500、 now=1500 | `isExpired` を呼ぶ | `true` | 高 | 推奨 |
| T-UNIT-010 | 単体 | TTL 0 は発行直後から失効 | fake-timer な純関数 (`isExpired`) | issuedAt=1000 ttl=0、 now=1000 | `isExpired` を呼ぶ | `true` | 中 | 推奨 |
| T-UNIT-011 | 単体 | 負の TTL は失効扱い | fake-timer な純関数 (`isExpired`) | issuedAt=1000 ttl=-1、 now=1000 | `isExpired` を呼ぶ | `true` | 中 | 推奨 |
| T-UNIT-012 | 単体 | 有限でない入力は失効扱い | fake-timer な純関数 (`isExpired`) | issuedAt=NaN ttl=500 | `isExpired` を呼ぶ | `true` | 低 | 推奨 |
| T-UNIT-013 | 単体 | backoff が倍々に伸びる | pure な純関数 (`nextBackoffMs`) | attempt=0,1,2 | `nextBackoffMs` を呼ぶ | `100` / `200` / `400` | 高 | 推奨 |
| T-UNIT-014 | 単体 | cap で頭打ちになる | pure な純関数 (`nextBackoffMs`) | attempt=20 | `nextBackoffMs` を呼ぶ | `10000` | 高 | 推奨 |
| T-UNIT-015 | 単体 | 負の attempt は 0 として扱う | pure な純関数 (`nextBackoffMs`) | attempt=-3 | `nextBackoffMs` を呼ぶ | `100` | 低 | 推奨 |

## 自動化方針

mode = pure は入力と戻り値だけを見る。 外部依存が無いので前処理も後始末も要らない。

mode = fake-timer は `vi.useFakeTimers()` + `vi.setSystemTime()` で現在時刻を固定してから呼ぶ。
`isExpired` が `Date.now()` を直接読むため、 実時刻のままだと境界 (T-UNIT-009) が
実行タイミングで揺れる。 各 test の後に `vi.useRealTimers()` で戻す。

## 不足している仕様

(なし)
