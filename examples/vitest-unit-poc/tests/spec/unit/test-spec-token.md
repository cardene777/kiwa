# test-spec-token (unit layer)

`src/token.ts` の純粋 logic を対象にした Layer 1 spec。
`unit` layer は backing package を持たない (`docs/layers.json` の `backing_package: null`) ため、
Vitest の素の helper (`describe` / `it` / `expect` / `vi.useFakeTimers`) だけで表現する。

- module: token
- layer: unit

## テストケース

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Topic |
|---|---|---|---|---|---|---|---|---|
| T-UNIT-001 | 正規化の基本形 | `"Hello World"` | normalizeTag | `"hello-world"` | P0 | yes | pure | normalizeTag |
| T-UNIT-002 | 連続する区切りを 1 つに潰す | `"a  --  b"` | normalizeTag | `"a-b"` | P0 | yes | pure | normalizeTag |
| T-UNIT-003 | 両端の区切りを落とす | `"__abc__"` | normalizeTag | `"abc"` | P0 | yes | pure | normalizeTag |
| T-UNIT-004 | 英数字が 1 文字も無い | `"！？"` | normalizeTag | `""` | P1 | yes | pure | normalizeTag |
| T-UNIT-005 | maxLength で切り詰める | `"abcdefghij"` maxLength=4 | normalizeTag | `"abcd"` | P1 | yes | pure | normalizeTag |
| T-UNIT-006 | 切り口が区切りなら落とす | `"ab cdef"` maxLength=3 | normalizeTag | `"ab"` | P1 | yes | pure | normalizeTag |
| T-UNIT-007 | maxLength=0 は空を返す | `"abc"` maxLength=0 | normalizeTag | `""` | P2 | yes | pure | normalizeTag |
| T-UNIT-008 | TTL 内は有効 | issuedAt=1000 ttl=500、 now=1400 | isExpired | `false` | P0 | yes | fake-timer | isExpired |
| T-UNIT-009 | 境界ちょうどは失効 | issuedAt=1000 ttl=500、 now=1500 | isExpired | `true` | P0 | yes | fake-timer | isExpired |
| T-UNIT-010 | TTL 0 は発行直後から失効 | issuedAt=1000 ttl=0、 now=1000 | isExpired | `true` | P1 | yes | fake-timer | isExpired |
| T-UNIT-011 | 負の TTL は失効扱い | issuedAt=1000 ttl=-1、 now=1000 | isExpired | `true` | P1 | yes | fake-timer | isExpired |
| T-UNIT-012 | 有限でない入力は失効扱い | issuedAt=NaN ttl=500 | isExpired | `true` | P2 | yes | fake-timer | isExpired |
| T-UNIT-013 | backoff が倍々に伸びる | attempt=0,1,2 | nextBackoffMs | `100` / `200` / `400` | P0 | yes | pure | nextBackoffMs |
| T-UNIT-014 | cap で頭打ちになる | attempt=20 | nextBackoffMs | `10000` | P0 | yes | pure | nextBackoffMs |
| T-UNIT-015 | 負の attempt は 0 として扱う | attempt=-3 | nextBackoffMs | `100` | P2 | yes | pure | nextBackoffMs |

## 自動化方針

mode = pure は入力と戻り値だけを見る。 外部依存が無いので前処理も後始末も要らない。

mode = fake-timer は `vi.useFakeTimers()` + `vi.setSystemTime()` で現在時刻を固定してから呼ぶ。
`isExpired` が `Date.now()` を直接読むため、 実時刻のままだと境界 (T-UNIT-009) が
実行タイミングで揺れる。 各 test の後に `vi.useRealTimers()` で戻す。

## 不足している仕様

(なし)
