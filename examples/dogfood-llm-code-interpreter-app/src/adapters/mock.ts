/**
 * Mock adapter — drives `@kiwa/ai-llm` v0.5 code-interpreter
 * semantics so the same app code exercises a deterministic sandbox +
 * execution + tool-use + rollback ceremony without a real Anthropic /
 * Vercel AI SDK call. Both mock and real adapters satisfy
 * {@link LlmCodeInterpreterAdapter}, so the fidelity harness can diff
 * them side-by-side.
 *
 * State model — one code-interpreter session per sessionId (sandbox
 * lifecycle + executions + tool calls + memory snapshots advance the
 * same state machine). The pipeline surface allocates a fresh
 * sub-session per {@link runPipeline} call so multi-stage flows do not
 * interfere with outer sessions.
 *
 * The mock piggy-backs on the same neutral event vocabulary that the
 * v1.40-1 semantics package emits — every op appends the matching
 * neutral event into the trace so the fidelity harness can assert the
 * mock and real adapters produce identical event orderings.
 */

import {
  executeCode,
  rollback,
  startCiSession,
  startSandbox,
  useTool,
  type CiSession,
} from '@kiwa/ai-llm';
import type {
  CodeInterpreterPipelineResult,
  ExecuteCodeResult,
  LlmCodeInterpreterAdapter,
  PipelineInput,
  RecordedExecution,
  RollbackResult,
  StartSandboxResult,
  TraceEvent,
  UseToolResult,
} from './interface.js';

export interface MakeMockAdapterOptions {
  /** artificial latency injected into every mock op (ms、 default 1). */
  latencyMs?: number;
}

interface CiRoom {
  session: CiSession;
  closed: boolean;
}

export function makeMockAdapter(
  opts: MakeMockAdapterOptions = {},
): LlmCodeInterpreterAdapter {
  const latencyMs = opts.latencyMs ?? 1;
  const ciRooms = new Map<string, CiRoom>();
  const trace: TraceEvent[] = [];

  function record(
    op: TraceEvent['op'],
    ok: boolean,
    extra?: Partial<TraceEvent>,
  ): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  async function sleep(): Promise<void> {
    if (latencyMs <= 0) return;
    await new Promise((r) => setTimeout(r, latencyMs));
  }

  return {
    mode: 'mock',

    async startCi(input) {
      await sleep();
      if (ciRooms.has(input.sessionId)) {
        record('startCi', false, { errorKind: 'DUPLICATE_SESSION' });
        throw new Error(`startCi: duplicate session ${input.sessionId}`);
      }
      const session = startCiSession({
        target: 'vercel-ai',
        sessionId: input.sessionId,
      });
      ciRooms.set(input.sessionId, { session, closed: false });
      record('startCi', true, { detail: { sessionId: input.sessionId } });
    },

    async startSandbox(input): Promise<StartSandboxResult> {
      const t0 = Date.now();
      await sleep();
      const room = ciRooms.get(input.sessionId);
      if (!room) {
        record('startSandbox', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`startSandbox: no session ${input.sessionId}`);
      }
      const { sandboxId } = startSandbox(room.session, {
        sandboxId: input.sandboxId,
        timeoutMs: input.timeoutMs,
      });
      const out: StartSandboxResult = {
        sessionId: input.sessionId,
        sandboxId,
        timeoutMs: input.timeoutMs,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('startSandbox', true, { detail: out });
      return out;
    },

    async executeCode(input): Promise<ExecuteCodeResult> {
      const t0 = Date.now();
      await sleep();
      const room = ciRooms.get(input.sessionId);
      if (!room) {
        record('executeCode', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`executeCode: no session ${input.sessionId}`);
      }
      const executeInput: {
        code: string;
        assigns?: Record<string, string>;
      } = { code: input.execution.code };
      if (input.execution.assigns !== undefined) {
        executeInput.assigns = input.execution.assigns;
      }
      const { execution } = executeCode(room.session, executeInput);
      const out: ExecuteCodeResult = {
        sessionId: input.sessionId,
        executionIndex: execution.index,
        ok: execution.ok,
        stdout: execution.stdout,
        codeLength: input.execution.code.length,
        memoryKeys: Object.keys(room.session.memory).length,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('executeCode', true, { detail: out });
      return out;
    },

    async useTool(input): Promise<UseToolResult> {
      const t0 = Date.now();
      await sleep();
      const room = ciRooms.get(input.sessionId);
      if (!room) {
        record('useTool', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`useTool: no session ${input.sessionId}`);
      }
      const { call } = useTool(room.session, {
        name: input.tool.name,
        args: input.tool.args,
      });
      const out: UseToolResult = {
        sessionId: input.sessionId,
        toolName: call.name,
        ok: call.ok,
        toolCallCount: room.session.toolCalls.length,
        argCount: Object.keys(input.tool.args).length,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('useTool', true, { detail: out });
      return out;
    },

    async rollback(input): Promise<RollbackResult> {
      const t0 = Date.now();
      await sleep();
      const room = ciRooms.get(input.sessionId);
      if (!room) {
        record('rollback', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`rollback: no session ${input.sessionId}`);
      }
      const { poppedCount, remaining } = rollback(room.session, {
        steps: input.steps,
      });
      const out: RollbackResult = {
        sessionId: input.sessionId,
        requestedSteps: input.steps,
        poppedCount,
        remainingExecutions: remaining,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('rollback', true, { detail: out });
      return out;
    },

    async closeCi(input) {
      await sleep();
      const room = ciRooms.get(input.sessionId);
      if (!room) {
        record('closeCi', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`closeCi: no session ${input.sessionId}`);
      }
      room.closed = true;
      record('closeCi', true, {
        detail: {
          sessionId: input.sessionId,
          historyLength: room.session.history.length,
        },
      });
    },

    async runPipeline(
      input: PipelineInput,
    ): Promise<CodeInterpreterPipelineResult> {
      const t0 = Date.now();
      await sleep();

      const subSessionId = `${input.sessionId}:ci`;
      const session = startCiSession({
        target: 'vercel-ai',
        sessionId: subSessionId,
      });

      // Stage 1 — sandbox start.
      startSandbox(session, {
        sandboxId: input.sandboxId,
        timeoutMs: input.timeoutMs,
      });

      // Stage 2 — code executions in order. Track ok / fail counts.
      let okCount = 0;
      let failCount = 0;
      if (input.executions.length === 0) {
        const out: CodeInterpreterPipelineResult = {
          sessionId: input.sessionId,
          stage: 'blocked-no-executions',
          blockedReason: 'executions must not be empty',
          sandbox: {
            sandboxId: input.sandboxId,
            timeoutMs: input.timeoutMs,
          },
          executions: {
            total: 0,
            okCount: 0,
            failCount: 0,
            memoryKeys: 0,
          },
          tools: {
            total: 0,
            okCount: 0,
            failCount: 0,
          },
          rollback: {
            requestedSteps: input.rollbackSteps,
            poppedCount: 0,
            remainingExecutions: 0,
          },
          latencyMs: Math.max(1, Date.now() - t0),
        };
        record('runPipeline', true, { detail: out });
        return out;
      }
      for (const exec of input.executions) {
        const executeInput: {
          code: string;
          assigns?: Record<string, string>;
        } = { code: exec.code };
        if (exec.assigns !== undefined) {
          executeInput.assigns = exec.assigns;
        }
        const { execution } = executeCode(session, executeInput);
        if (execution.ok) okCount += 1;
        else failCount += 1;
      }

      // Stage 3 — tool calls. detect any unknown-tool refusal.
      let toolOk = 0;
      let toolFail = 0;
      let unknownToolSeen = false;
      for (const tool of input.tools) {
        const { call } = useTool(session, {
          name: tool.name,
          args: tool.args,
        });
        if (call.ok) toolOk += 1;
        else {
          toolFail += 1;
          if (tool.name === 'unknown') unknownToolSeen = true;
        }
      }

      // Stage 4 — rollback. clamp steps to session history so we can
      // detect an over-rollback attempt and report it.
      const rollbackExceeds = input.rollbackSteps > session.executions.length;
      const { poppedCount, remaining } = rollback(session, {
        steps: Math.max(1, input.rollbackSteps),
      });

      let stage: CodeInterpreterPipelineResult['stage'] = 'completed';
      let blockedReason: string | null = null;
      if (unknownToolSeen) {
        stage = 'blocked-unknown-tool';
        blockedReason = 'at least one tool call refused with unknown';
      } else if (rollbackExceeds) {
        stage = 'blocked-rollback-exceeds-history';
        blockedReason = `rollback ${input.rollbackSteps} > history ${input.executions.length}`;
      }

      const out: CodeInterpreterPipelineResult = {
        sessionId: input.sessionId,
        stage,
        blockedReason,
        sandbox: {
          sandboxId: input.sandboxId,
          timeoutMs: input.timeoutMs,
        },
        executions: {
          total: input.executions.length,
          okCount,
          failCount,
          memoryKeys: Object.keys(session.memory).length,
        },
        tools: {
          total: input.tools.length,
          okCount: toolOk,
          failCount: toolFail,
        },
        rollback: {
          requestedSteps: input.rollbackSteps,
          poppedCount,
          remainingExecutions: remaining,
        },
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('runPipeline', true, { detail: out });
      return out;
    },

    traces() {
      return trace;
    },

    async reset() {
      ciRooms.clear();
      trace.length = 0;
    },

    executions(sessionId: string): readonly RecordedExecution[] {
      const room = ciRooms.get(sessionId);
      if (!room) return [];
      return room.session.executions.map((e) => ({
        index: e.index,
        code: e.code,
        stdout: e.stdout,
        ok: e.ok,
      }));
    },
  };
}
