import { providerEventName, type AxisStep, type AiLlmTarget } from './types.js';

/**
 * RAG III axis — GraphRAG + agentic + self-querying + parent document state
 * machine。
 *
 * Deterministic mock で 4 signal 系統。 graph traversal follows entity edges
 * with BFS、 agentic RAG step decides fetch vs answer via score gate、
 * self-querying converts NL to filter predicate deterministically、 parent
 * document expansion returns full doc from chunk id lookup。
 */

export type Rag3State =
  | 'idle'
  | 'graph-traversed'
  | 'agentic-stepped'
  | 'self-queried'
  | 'parent-expanded';

export interface RagGraphNode {
  id: string;
  label: string;
}

export interface RagGraphEdge {
  from: string;
  to: string;
  weight: number;
}

export interface RagAgenticStep {
  index: number;
  action: 'fetch' | 'answer';
  reason: string;
}

export interface RagParentDoc {
  id: string;
  content: string;
  chunkIds: string[];
}

export interface Rag3Session {
  target: AiLlmTarget;
  sessionId: string;
  state: Rag3State;
  history: AxisStep<Rag3State>[];
  graphNodes: RagGraphNode[];
  graphEdges: RagGraphEdge[];
  agenticTrace: RagAgenticStep[];
  parents: RagParentDoc[];
}

export function startRag3Session(input: {
  target: AiLlmTarget;
  sessionId: string;
}): Rag3Session {
  if (input.sessionId.length === 0) {
    throw new Error('startRag3Session: sessionId must not be empty');
  }
  return {
    target: input.target,
    sessionId: input.sessionId,
    state: 'idle',
    history: [],
    graphNodes: [],
    graphEdges: [],
    agenticTrace: [],
    parents: [],
  };
}

export function traverseGraph(
  session: Rag3Session,
  input: {
    nodes: RagGraphNode[];
    edges: RagGraphEdge[];
    startNodeId: string;
    maxHops: number;
  },
): { step: AxisStep<Rag3State>; visited: string[]; totalWeight: number } {
  if (input.nodes.length === 0) throw new Error('traverseGraph: nodes must not be empty');
  if (input.maxHops <= 0) throw new Error('traverseGraph: maxHops must be positive');
  if (!input.nodes.some((n) => n.id === input.startNodeId))
    throw new Error(`traverseGraph: startNode ${input.startNodeId} not in nodes`);
  session.graphNodes = [...input.nodes];
  session.graphEdges = [...input.edges];
  const visited: string[] = [input.startNodeId];
  const seen = new Set<string>([input.startNodeId]);
  let totalWeight = 0;
  const queue: Array<{ id: string; hops: number }> = [
    { id: input.startNodeId, hops: 0 },
  ];
  while (queue.length > 0) {
    const cur = queue.shift();
    if (!cur) break;
    if (cur.hops >= input.maxHops) continue;
    const outgoing = input.edges
      .filter((e) => e.from === cur.id && !seen.has(e.to))
      .sort((a, b) => b.weight - a.weight);
    for (const e of outgoing) {
      visited.push(e.to);
      seen.add(e.to);
      totalWeight += e.weight;
      queue.push({ id: e.to, hops: cur.hops + 1 });
    }
  }
  session.state = 'graph-traversed';
  const step = emit(session, 'rag3.graph_traversed', {
    nodeCount: input.nodes.length,
    edgeCount: input.edges.length,
    visitedCount: visited.length,
    totalWeight,
    maxHops: input.maxHops,
  });
  return { step, visited, totalWeight };
}

export function stepAgentic(
  session: Rag3Session,
  input: { confidence: number; threshold: number; reason: string },
): { step: AxisStep<Rag3State>; action: 'fetch' | 'answer'; index: number } {
  if (session.state === 'idle') throw new Error('stepAgentic: traverse graph first');
  if (input.confidence < 0 || input.confidence > 1)
    throw new Error('stepAgentic: confidence must be in [0, 1]');
  if (input.threshold < 0 || input.threshold > 1)
    throw new Error('stepAgentic: threshold must be in [0, 1]');
  if (input.reason.length === 0)
    throw new Error('stepAgentic: reason must not be empty');
  const action: 'fetch' | 'answer' =
    input.confidence >= input.threshold ? 'answer' : 'fetch';
  const index = session.agenticTrace.length;
  session.agenticTrace.push({ index, action, reason: input.reason });
  session.state = 'agentic-stepped';
  const step = emit(session, 'rag3.agentic_stepped', {
    index,
    action,
    confidence: input.confidence,
    threshold: input.threshold,
  });
  return { step, action, index };
}

export function selfQuery(
  session: Rag3Session,
  input: { question: string; schemaFields: string[] },
): { step: AxisStep<Rag3State>; predicate: string; matchedFields: string[] } {
  if (session.state === 'idle') throw new Error('selfQuery: traverse graph first');
  if (input.question.length === 0)
    throw new Error('selfQuery: question must not be empty');
  if (input.schemaFields.length === 0)
    throw new Error('selfQuery: schemaFields must not be empty');
  const lower = input.question.toLowerCase();
  const matchedFields: string[] = [];
  for (const f of input.schemaFields) {
    if (lower.includes(f.toLowerCase())) matchedFields.push(f);
  }
  const predicate = matchedFields.length > 0
    ? matchedFields.map((f) => `${f} MATCHES`).join(' AND ')
    : 'NO_FILTER';
  session.state = 'self-queried';
  const step = emit(session, 'rag3.self_queried', {
    question: input.question.slice(0, 40),
    matchedCount: matchedFields.length,
    schemaFieldCount: input.schemaFields.length,
    hasFilter: matchedFields.length > 0,
  });
  return { step, predicate, matchedFields };
}

export function expandParent(
  session: Rag3Session,
  input: { chunkId: string; parents: RagParentDoc[] },
): { step: AxisStep<Rag3State>; parent: RagParentDoc | null } {
  if (session.state === 'idle') throw new Error('expandParent: traverse graph first');
  if (input.parents.length === 0)
    throw new Error('expandParent: parents must not be empty');
  if (input.chunkId.length === 0)
    throw new Error('expandParent: chunkId must not be empty');
  session.parents = [...input.parents];
  const parent = input.parents.find((p) => p.chunkIds.includes(input.chunkId)) ?? null;
  session.state = 'parent-expanded';
  const step = emit(session, 'rag3.parent_expanded', {
    chunkId: input.chunkId,
    parentCount: input.parents.length,
    parentId: parent?.id ?? '',
    contentLength: parent?.content.length ?? 0,
    hit: parent !== null,
  });
  return { step, parent };
}

function emit(
  session: Rag3Session,
  neutralEvent: AxisStep<Rag3State>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<Rag3State> {
  const step: AxisStep<Rag3State> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, sessionId: session.sessionId, ...metadata },
  };
  session.history.push(step);
  return step;
}
