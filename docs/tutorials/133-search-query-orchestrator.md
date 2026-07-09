# @kiwa-lab/search v2.1 query-orchestrator in 15 min

`@kiwa-lab/search` v2.1 query-orchestrator = query DSL + faceted + semantic + geo + relevance の 継続合成 layer。 5 state + 8 event。 **depth-5 pattern 7 例目発生 = systematic law 継続強化** (Mobile + Desktop + quality-metrics + Payment + Realtime + Streaming + Search = 7 pair)、 52 milestone streak、 systematic pattern 49 度目適用 (systematic law 継承 第 1 例)。

## Install

```bash
pnpm add -D @kiwa-lab/search@^2.1
```

## Step-by-step

```ts
import { semantics } from '@kiwa-lab/search';

let s = semantics.startQuery({ timestamp: new Date().toISOString() });
// state = 'parsing'

s = semantics.dispatchQueryEvent({ session: s, event: 'parse-succeeded', timestamp: t1 });
// state = 'searching'
s = semantics.dispatchQueryEvent({ session: s, event: 'search-completed', timestamp: t2 });
// state = 'reranking'
s = semantics.dispatchQueryEvent({ session: s, event: 'rerank-completed', timestamp: t3 });
// state = 'facet-aggregating'
s = semantics.dispatchQueryEvent({ session: s, event: 'facet-computed', timestamp: t4 });
// state = 'completed'

const summary = semantics.summarizeQuery(s);
```

## 5 state SSOT

parsing / searching / reranking / facet-aggregating / completed

## What's next

- v2.7+ = 8 例目 depth-5 or 既存 pair 継続深化
