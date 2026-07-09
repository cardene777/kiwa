/**
 * `/sandbox` HTTP handler — code interpreter ceremony (sandbox start +
 * code execution + tool use + rollback). The route is intentionally
 * shape-neutral — the fidelity harness feeds plain objects in and
 * asserts on plain objects out, so the same test can exercise mock and
 * real without spinning up a real Vercel AI SDK client or sandbox
 * binary.
 *
 * The sandbox surface pairs the v1.40-1 `code-interpreter` axis
 * (sandboxed Python REPL + tool use + rollback state machine) with
 * `@kiwa-lab/ai-llm` v0.5 — every op has a neutral event counterpart
 * the fidelity harness can compare across mock vs real.
 */

import type {
  ExecuteCodeResult,
  ExecuteInput,
  LlmCodeInterpreterAdapter,
  RollbackResult,
  StartSandboxResult,
  ToolInput,
  UseToolResult,
} from '../../adapters/interface.js';

export interface SandboxStartRequest {
  sessionId: string;
  sandboxId: string;
  timeoutMs: number;
}

export interface SandboxExecuteRequest {
  sessionId: string;
  execution: ExecuteInput;
}

export interface SandboxToolRequest {
  sessionId: string;
  tool: ToolInput;
}

export interface SandboxRollbackRequest {
  sessionId: string;
  steps: number;
}

export interface SandboxResponse<T> {
  ok: boolean;
  sessionId: string;
  result?: T;
  errorKind?: string;
}

export function validateStartRequest(
  body: unknown,
):
  | { ok: true; value: SandboxStartRequest }
  | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  if (typeof b['sandboxId'] !== 'string' || !b['sandboxId']) {
    return { ok: false, errorKind: 'sandboxId_required' };
  }
  if (typeof b['timeoutMs'] !== 'number' || b['timeoutMs'] <= 0) {
    return { ok: false, errorKind: 'timeoutMs_required' };
  }
  return {
    ok: true,
    value: {
      sessionId: b['sessionId'],
      sandboxId: b['sandboxId'],
      timeoutMs: b['timeoutMs'],
    },
  };
}

export function validateExecuteRequest(
  body: unknown,
):
  | { ok: true; value: SandboxExecuteRequest }
  | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  const e = b['execution'];
  if (!e || typeof e !== 'object') {
    return { ok: false, errorKind: 'execution_required' };
  }
  const eo = e as Record<string, unknown>;
  if (typeof eo['code'] !== 'string' || !eo['code']) {
    return { ok: false, errorKind: 'execution.code_required' };
  }
  const execution: ExecuteInput = { code: eo['code'] };
  if (eo['assigns'] !== undefined) {
    if (typeof eo['assigns'] !== 'object' || eo['assigns'] === null) {
      return { ok: false, errorKind: 'execution.assigns_shape' };
    }
    execution.assigns = eo['assigns'] as Record<string, string>;
  }
  return {
    ok: true,
    value: {
      sessionId: b['sessionId'],
      execution,
    },
  };
}

export function validateToolRequest(
  body: unknown,
):
  | { ok: true; value: SandboxToolRequest }
  | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  const t = b['tool'];
  if (!t || typeof t !== 'object') {
    return { ok: false, errorKind: 'tool_required' };
  }
  const to = t as Record<string, unknown>;
  if (typeof to['name'] !== 'string' || !to['name']) {
    return { ok: false, errorKind: 'tool.name_required' };
  }
  if (!to['args'] || typeof to['args'] !== 'object') {
    return { ok: false, errorKind: 'tool.args_required' };
  }
  return {
    ok: true,
    value: {
      sessionId: b['sessionId'],
      tool: {
        name: to['name'],
        args: to['args'] as Record<string, string | number | boolean>,
      },
    },
  };
}

export function validateRollbackRequest(
  body: unknown,
):
  | { ok: true; value: SandboxRollbackRequest }
  | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  if (typeof b['steps'] !== 'number' || b['steps'] <= 0) {
    return { ok: false, errorKind: 'steps_required' };
  }
  return {
    ok: true,
    value: {
      sessionId: b['sessionId'],
      steps: b['steps'],
    },
  };
}

export async function handleStartRequest(
  adapter: LlmCodeInterpreterAdapter,
  request: SandboxStartRequest,
): Promise<SandboxResponse<StartSandboxResult>> {
  try {
    const result = await adapter.startSandbox(request);
    return { ok: true, sessionId: request.sessionId, result };
  } catch (err) {
    return {
      ok: false,
      sessionId: request.sessionId,
      errorKind: err instanceof Error ? err.message : 'unknown',
    };
  }
}

export async function handleExecuteRequest(
  adapter: LlmCodeInterpreterAdapter,
  request: SandboxExecuteRequest,
): Promise<SandboxResponse<ExecuteCodeResult>> {
  try {
    const result = await adapter.executeCode(request);
    return { ok: true, sessionId: request.sessionId, result };
  } catch (err) {
    return {
      ok: false,
      sessionId: request.sessionId,
      errorKind: err instanceof Error ? err.message : 'unknown',
    };
  }
}

export async function handleToolRequest(
  adapter: LlmCodeInterpreterAdapter,
  request: SandboxToolRequest,
): Promise<SandboxResponse<UseToolResult>> {
  try {
    const result = await adapter.useTool(request);
    return { ok: true, sessionId: request.sessionId, result };
  } catch (err) {
    return {
      ok: false,
      sessionId: request.sessionId,
      errorKind: err instanceof Error ? err.message : 'unknown',
    };
  }
}

export async function handleRollbackRequest(
  adapter: LlmCodeInterpreterAdapter,
  request: SandboxRollbackRequest,
): Promise<SandboxResponse<RollbackResult>> {
  try {
    const result = await adapter.rollback(request);
    return { ok: true, sessionId: request.sessionId, result };
  } catch (err) {
    return {
      ok: false,
      sessionId: request.sessionId,
      errorKind: err instanceof Error ? err.message : 'unknown',
    };
  }
}
