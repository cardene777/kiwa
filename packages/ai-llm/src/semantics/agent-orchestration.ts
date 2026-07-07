import { providerEventName, type AxisStep, type AiLlmTarget } from './types.js';

/**
 * Agent orchestration axis — ReAct + Tree-of-Thought + reflection +
 * self-correction + planning + tool selection state machine。
 */

export type AgentState =
  | 'idle'
  | 'react-stepped'
  | 'tot-expanded'
  | 'reflected'
  | 'tool-selected';

export interface AgentSession {
  target: AiLlmTarget;
  sessionId: string;
  state: AgentState;
  history: AxisStep<AgentState>[];
  reactTrace: ReactStep[];
  totTree: ToTNode | null;
}

export interface ReactStep {
  index: number;
  thought: string;
  action: { tool: string; input: string };
  observation: string;
}

export interface ToTNode {
  id: string;
  thought: string;
  score: number;
  children: ToTNode[];
}

export interface Reflection {
  cycle: number;
  critique: string;
  revised: string;
}

export interface ToolCandidate {
  name: string;
  description: string;
  score: number;
}

export function startAgentSession(input: {
  target: AiLlmTarget;
  sessionId: string;
}): AgentSession {
  if (input.sessionId.length === 0) {
    throw new Error('startAgentSession: sessionId must not be empty');
  }
  return {
    target: input.target,
    sessionId: input.sessionId,
    state: 'idle',
    history: [],
    reactTrace: [],
    totTree: null,
  };
}

export function reactStep(
  session: AgentSession,
  input: { thought: string; action: { tool: string; input: string }; observation: string },
): { step: AxisStep<AgentState>; trace: ReactStep[] } {
  if (session.state !== 'idle' && session.state !== 'react-stepped' && session.state !== 'reflected') {
    throw new Error(`reactStep: session is ${session.state}`);
  }
  if (input.action.tool.length === 0) throw new Error('reactStep: tool must not be empty');
  const index = session.reactTrace.length;
  session.reactTrace.push({ index, ...input });
  session.state = 'react-stepped';
  const step = emit(session, 'agent.react_stepped', {
    index,
    tool: input.action.tool,
    traceLength: session.reactTrace.length,
  });
  return { step, trace: [...session.reactTrace] };
}

export function expandToT(
  session: AgentSession,
  input: { root: { thought: string }; branches: Array<{ thought: string; score: number }>; depth: number },
): { step: AxisStep<AgentState>; nodeCount: number } {
  if (session.state !== 'react-stepped' && session.state !== 'idle') {
    throw new Error(`expandToT: session is ${session.state}`);
  }
  if (input.depth <= 0) throw new Error('expandToT: depth must be positive');
  if (input.branches.length === 0) throw new Error('expandToT: branches must not be empty');
  let counter = 0;
  const build = (thought: string, score: number, depth: number): ToTNode => {
    const id = `n${counter++}`;
    const children: ToTNode[] = [];
    if (depth > 1) {
      for (const b of input.branches) {
        children.push(build(b.thought, b.score * 0.9, depth - 1));
      }
    }
    return { id, thought, score, children };
  };
  const root = build(input.root.thought, 1.0, input.depth);
  session.totTree = root;
  const nodeCount = countNodes(root);
  session.state = 'tot-expanded';
  const step = emit(session, 'agent.tot_expanded', {
    depth: input.depth,
    branchFactor: input.branches.length,
    nodeCount,
  });
  return { step, nodeCount };
}

export function reflectAndCorrect(
  session: AgentSession,
  input: { output: string; critiqueRules: string[] },
): { step: AxisStep<AgentState>; reflection: Reflection } {
  if (session.state === 'idle') {
    throw new Error('reflectAndCorrect: run react or tot first');
  }
  const cycle = session.history.filter((h) => h.neutralEvent === 'agent.reflected').length + 1;
  const violated: string[] = [];
  const lower = input.output.toLowerCase();
  for (const rule of input.critiqueRules) {
    if (lower.includes(rule.toLowerCase())) violated.push(rule);
  }
  const critique = violated.length > 0
    ? `violated ${violated.length} rule(s): ${violated.join(', ')}`
    : 'no rule violations';
  const revised = violated.reduce((acc, rule) => {
    const re = new RegExp(rule, 'gi');
    return acc.replace(re, '[revised]');
  }, input.output);
  const reflection: Reflection = { cycle, critique, revised };
  session.state = 'reflected';
  const step = emit(session, 'agent.reflected', {
    cycle,
    violationCount: violated.length,
    revisedLength: revised.length,
  });
  return { step, reflection };
}

export function selectTool(
  session: AgentSession,
  input: { intent: string; candidates: Array<{ name: string; description: string }> },
): { step: AxisStep<AgentState>; selected: ToolCandidate | null; ranking: ToolCandidate[] } {
  if (session.state === 'idle') {
    throw new Error('selectTool: run react or tot first');
  }
  if (input.candidates.length === 0) throw new Error('selectTool: candidates must not be empty');
  const intentTokens = tokenize(input.intent);
  const ranking: ToolCandidate[] = input.candidates.map((c) => {
    const descTokens = tokenize(c.description);
    const nameTokens = tokenize(c.name);
    const overlap =
      intersectRate(intentTokens, descTokens) * 0.5 +
      intersectRate(intentTokens, nameTokens) * 0.5;
    return { name: c.name, description: c.description, score: overlap };
  });
  ranking.sort((a, b) => b.score - a.score);
  const top = ranking[0] ?? null;
  const selected = top && top.score > 0 ? top : null;
  session.state = 'tool-selected';
  const step = emit(session, 'agent.tool_selected', {
    candidateCount: input.candidates.length,
    selected: selected?.name ?? '',
    topScore: top?.score ?? 0,
  });
  return { step, selected, ranking };
}

function countNodes(n: ToTNode): number {
  let c = 1;
  for (const child of n.children) c += countNodes(child);
  return c;
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

function intersectRate(a: string[], b: string[]): number {
  const sa = new Set(a);
  const sb = new Set(b);
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter += 1;
  return sa.size === 0 ? 0 : inter / sa.size;
}

function emit(
  session: AgentSession,
  neutralEvent: AxisStep<AgentState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<AgentState> {
  const step: AxisStep<AgentState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, sessionId: session.sessionId, ...metadata },
  };
  session.history.push(step);
  return step;
}
