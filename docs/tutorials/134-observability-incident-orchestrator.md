# @kiwa-lab/observability v2.1 incident-orchestrator in 15 min

Observability pair v2.1 incident-orchestrator = alert + escalation + AIOps + FinOps + chaos の 継続合成 layer。 5 state + 8 event。 **depth-5 pattern 8 例目発生 = systematic law 継続強化 第 2 例**、 **systematic pattern 50 度到達 milestone**、 53 milestone streak。

```bash
pnpm add -D @kiwa-lab/observability@^2.1
```

```ts
import { semantics } from '@kiwa-lab/observability';
let s = semantics.startIncident({ timestamp: new Date().toISOString() });
s = semantics.dispatchIncidentEvent({ session: s, event: 'anomaly-detected', timestamp: t1 });
// state = 'triaging'
```

## 5 state

detecting / triaging / escalating / mitigating / resolved
