import { providerEventName, type AxisStep, type AiLlmTarget } from './types.js';

/**
 * Code interpreter axis — sandboxed Python REPL + tool use + rollback state
 * machine。
 *
 * Deterministic mock で 4 signal 系統。 sandbox start binds an isolated cell、
 * code execution accumulates history and side-effects、 tool use is external
 * effect record、 rollback pops N most-recent executions and restores state。
 */

export type CiState =
  | 'idle'
  | 'sandbox-started'
  | 'code-executed'
  | 'tool-used'
  | 'rolled-back';

export interface CiExecution {
  index: number;
  code: string;
  stdout: string;
  ok: boolean;
}

export interface CiToolCall {
  name: string;
  args: Record<string, string | number | boolean>;
  ok: boolean;
}

export interface CiSession {
  target: AiLlmTarget;
  sessionId: string;
  state: CiState;
  history: AxisStep<CiState>[];
  sandboxId: string | null;
  executions: CiExecution[];
  toolCalls: CiToolCall[];
  memory: Record<string, string>;
  memorySnapshots: Array<Record<string, string>>;
}

export function startCiSession(input: {
  target: AiLlmTarget;
  sessionId: string;
}): CiSession {
  if (input.sessionId.length === 0) {
    throw new Error('startCiSession: sessionId must not be empty');
  }
  return {
    target: input.target,
    sessionId: input.sessionId,
    state: 'idle',
    history: [],
    sandboxId: null,
    executions: [],
    toolCalls: [],
    memory: {},
    memorySnapshots: [],
  };
}

export function startSandbox(
  session: CiSession,
  input: { sandboxId: string; timeoutMs: number },
): { step: AxisStep<CiState>; sandboxId: string } {
  if (input.sandboxId.length === 0)
    throw new Error('startSandbox: sandboxId must not be empty');
  if (input.timeoutMs <= 0) throw new Error('startSandbox: timeoutMs must be positive');
  session.sandboxId = input.sandboxId;
  session.state = 'sandbox-started';
  const step = emit(session, 'ci.sandbox_started', {
    sandboxId: input.sandboxId,
    timeoutMs: input.timeoutMs,
  });
  return { step, sandboxId: input.sandboxId };
}

export function executeCode(
  session: CiSession,
  input: { code: string; assigns?: Record<string, string> },
): { step: AxisStep<CiState>; execution: CiExecution } {
  if (session.state === 'idle') throw new Error('executeCode: start sandbox first');
  if (input.code.length === 0) throw new Error('executeCode: code must not be empty');
  session.memorySnapshots.push({ ...session.memory });
  const ok = !input.code.includes('raise ') && !input.code.includes('throw ');
  const stdout = ok
    ? `executed: ${input.code.slice(0, 40).replace(/\n/g, ' ')}`
    : 'ExecutionError';
  if (ok && input.assigns) {
    for (const [k, v] of Object.entries(input.assigns)) {
      session.memory[k] = v;
    }
  }
  const execution: CiExecution = {
    index: session.executions.length,
    code: input.code,
    stdout,
    ok,
  };
  session.executions.push(execution);
  session.state = 'code-executed';
  const step = emit(session, 'ci.code_executed', {
    index: execution.index,
    codeLength: input.code.length,
    ok,
    memoryKeys: Object.keys(session.memory).length,
  });
  return { step, execution };
}

export function useTool(
  session: CiSession,
  input: { name: string; args: Record<string, string | number | boolean> },
): { step: AxisStep<CiState>; call: CiToolCall } {
  if (session.state === 'idle') throw new Error('useTool: start sandbox first');
  if (input.name.length === 0) throw new Error('useTool: tool name must not be empty');
  const ok = input.name !== 'unknown';
  const call: CiToolCall = { name: input.name, args: input.args, ok };
  session.toolCalls.push(call);
  session.state = 'tool-used';
  const step = emit(session, 'ci.tool_used', {
    name: input.name,
    argCount: Object.keys(input.args).length,
    ok,
    toolCallCount: session.toolCalls.length,
  });
  return { step, call };
}

export function rollback(
  session: CiSession,
  input: { steps: number },
): { step: AxisStep<CiState>; poppedCount: number; remaining: number } {
  if (session.state === 'idle') throw new Error('rollback: start sandbox first');
  if (input.steps <= 0) throw new Error('rollback: steps must be positive');
  const target = Math.min(input.steps, session.executions.length);
  for (let i = 0; i < target; i += 1) {
    session.executions.pop();
    const snap = session.memorySnapshots.pop();
    if (snap) session.memory = snap;
  }
  session.state = 'rolled-back';
  const step = emit(session, 'ci.rolled_back', {
    requestedSteps: input.steps,
    poppedCount: target,
    remaining: session.executions.length,
  });
  return { step, poppedCount: target, remaining: session.executions.length };
}

function emit(
  session: CiSession,
  neutralEvent: AxisStep<CiState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<CiState> {
  const step: AxisStep<CiState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, sessionId: session.sessionId, ...metadata },
  };
  session.history.push(step);
  return step;
}
