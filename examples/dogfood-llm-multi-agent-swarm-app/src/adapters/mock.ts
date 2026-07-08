/**
 * Mock adapter — drives `@kiwa/ai-llm` v0.5 multi-agent-orchestration
 * + agent-swarm semantics so the same app code exercises a deterministic
 * planning + delegation + consensus ceremony without a real Anthropic /
 * Vercel AI SDK call. Both mock and real adapters satisfy
 * {@link LlmMaoSwarmAdapter}, so the fidelity harness can diff them
 * side-by-side.
 *
 * State model — one multi-agent-orchestration session per sessionId for
 * the mao surface (crew assembly / supervisor delegation / graph
 * transition / round completion advance the same state machine) and one
 * swarm session per sessionId for the swarm surface (role assignment /
 * task allocation / consensus / Byzantine tolerance advance the swarm
 * state machine). The pipeline surface allocates a fresh sub-session per
 * {@link runPipeline} call so multi-stage flows do not interfere with
 * outer sessions.
 *
 * The mock piggy-backs on the same neutral event vocabulary that the
 * v1.40-1 semantics package emits — every op appends the matching neutral
 * event into the trace so the fidelity harness can assert the mock and
 * real adapters produce identical event orderings.
 */

import {
  allocateTasks,
  assembleCrew,
  assignRoles,
  completeRound,
  delegateBySupervisor,
  reachConsensus,
  startMaoSession,
  startSwarmSession,
  tolerateByzantine,
  transitionGraph,
  type MaoDelegation,
  type MaoSession,
  type SwarmSession,
} from '@kiwa/ai-llm';
import type {
  AllocateTasksResult,
  AssembleCrewResult,
  AssignRolesResult,
  ByzantineToleranceResult,
  ConsensusResult,
  DelegateResult,
  GraphTransitionResult,
  LlmMaoSwarmAdapter,
  MaoSwarmPipelineResult,
  PipelineInput,
  RoundCompletionResult,
  TraceEvent,
} from './interface.js';

export interface MakeMockAdapterOptions {
  /** artificial latency injected into every mock op (ms、 default 1). */
  latencyMs?: number;
}

interface MaoRoom {
  session: MaoSession;
  closed: boolean;
}

interface SwarmRoom {
  session: SwarmSession;
  closed: boolean;
}

export function makeMockAdapter(
  opts: MakeMockAdapterOptions = {},
): LlmMaoSwarmAdapter {
  const latencyMs = opts.latencyMs ?? 1;
  const maoRooms = new Map<string, MaoRoom>();
  const swarmRooms = new Map<string, SwarmRoom>();
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

    async startMao(input) {
      await sleep();
      if (maoRooms.has(input.sessionId)) {
        record('startMao', false, { errorKind: 'DUPLICATE_SESSION' });
        throw new Error(`startMao: duplicate session ${input.sessionId}`);
      }
      const session = startMaoSession({
        target: 'vercel-ai',
        sessionId: input.sessionId,
      });
      maoRooms.set(input.sessionId, { session, closed: false });
      record('startMao', true, { detail: { sessionId: input.sessionId } });
    },

    async assembleCrew(input): Promise<AssembleCrewResult> {
      const t0 = Date.now();
      await sleep();
      const room = maoRooms.get(input.sessionId);
      if (!room) {
        record('assembleCrew', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`assembleCrew: no session ${input.sessionId}`);
      }
      const { agentCount } = assembleCrew(room.session, { agents: input.agents });
      const out: AssembleCrewResult = {
        sessionId: input.sessionId,
        agentCount,
        roles: input.agents.map((a) => a.role),
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('assembleCrew', true, { detail: out });
      return out;
    },

    async delegateBySupervisor(input): Promise<DelegateResult> {
      const t0 = Date.now();
      await sleep();
      const room = maoRooms.get(input.sessionId);
      if (!room) {
        record('delegateBySupervisor', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`delegateBySupervisor: no session ${input.sessionId}`);
      }
      const { delegation } = delegateBySupervisor(room.session, {
        supervisorId: input.delegation.supervisorId,
        task: input.delegation.task,
        workerIds: input.delegation.workerIds,
      });
      const out: DelegateResult = {
        sessionId: input.sessionId,
        round: delegation.round,
        supervisor: delegation.supervisor,
        worker: delegation.worker,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('delegateBySupervisor', true, { detail: out });
      return out;
    },

    async transitionGraph(input): Promise<GraphTransitionResult> {
      const t0 = Date.now();
      await sleep();
      const room = maoRooms.get(input.sessionId);
      if (!room) {
        record('transitionGraph', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`transitionGraph: no session ${input.sessionId}`);
      }
      const { visited } = transitionGraph(room.session, {
        nodes: input.graph.nodes,
        edges: input.graph.edges,
        entryNodeId: input.graph.entryNodeId,
      });
      const terminalNode = visited[visited.length - 1] ?? input.graph.entryNodeId;
      const out: GraphTransitionResult = {
        sessionId: input.sessionId,
        nodeCount: input.graph.nodes.length,
        edgeCount: input.graph.edges.length,
        visitedCount: visited.length,
        terminalNode,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('transitionGraph', true, { detail: out });
      return out;
    },

    async completeRound(input): Promise<RoundCompletionResult> {
      const t0 = Date.now();
      await sleep();
      const room = maoRooms.get(input.sessionId);
      if (!room) {
        record('completeRound', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`completeRound: no session ${input.sessionId}`);
      }
      const { roundsCompleted, sufficient } = completeRound(room.session, {
        minDelegations: input.minDelegations,
      });
      const out: RoundCompletionResult = {
        sessionId: input.sessionId,
        round: roundsCompleted,
        totalDelegations: room.session.delegations.length,
        sufficient,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('completeRound', true, { detail: out });
      return out;
    },

    async closeMao(input) {
      await sleep();
      const room = maoRooms.get(input.sessionId);
      if (!room) {
        record('closeMao', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`closeMao: no session ${input.sessionId}`);
      }
      room.closed = true;
      record('closeMao', true, {
        detail: {
          sessionId: input.sessionId,
          historyLength: room.session.history.length,
        },
      });
    },

    async startSwarm(input) {
      await sleep();
      if (swarmRooms.has(input.sessionId)) {
        record('startSwarm', false, { errorKind: 'DUPLICATE_SESSION' });
        throw new Error(`startSwarm: duplicate session ${input.sessionId}`);
      }
      const args: {
        target: 'vercel-ai';
        sessionId: string;
        faultThreshold?: number;
      } = {
        target: 'vercel-ai',
        sessionId: input.sessionId,
      };
      if (input.faultThreshold !== undefined) {
        args.faultThreshold = input.faultThreshold;
      }
      const session = startSwarmSession(args);
      swarmRooms.set(input.sessionId, { session, closed: false });
      record('startSwarm', true, {
        detail: {
          sessionId: input.sessionId,
          faultThreshold: session.faultThreshold,
        },
      });
    },

    async assignRoles(input): Promise<AssignRolesResult> {
      const t0 = Date.now();
      await sleep();
      const room = swarmRooms.get(input.sessionId);
      if (!room) {
        record('assignRoles', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`assignRoles: no session ${input.sessionId}`);
      }
      const { assignments } = assignRoles(room.session, {
        agents: input.agents,
        roles: input.roles,
      });
      const avgReliability =
        assignments.reduce((s, a) => s + a.reliability, 0) /
        Math.max(1, assignments.length);
      const out: AssignRolesResult = {
        sessionId: input.sessionId,
        agentCount: assignments.length,
        roleCount: input.roles.length,
        averageReliability: avgReliability,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('assignRoles', true, { detail: out });
      return out;
    },

    async allocateTasks(input): Promise<AllocateTasksResult> {
      const t0 = Date.now();
      await sleep();
      const room = swarmRooms.get(input.sessionId);
      if (!room) {
        record('allocateTasks', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`allocateTasks: no session ${input.sessionId}`);
      }
      const { allocations } = allocateTasks(room.session, {
        tasks: input.tasks,
      });
      const topPriority = allocations.reduce(
        (max, t) => (t.priority > max ? t.priority : max),
        0,
      );
      const out: AllocateTasksResult = {
        sessionId: input.sessionId,
        taskCount: allocations.length,
        topPriority,
        allocations,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('allocateTasks', true, { detail: out });
      return out;
    },

    async reachConsensus(input): Promise<ConsensusResult> {
      const t0 = Date.now();
      await sleep();
      const room = swarmRooms.get(input.sessionId);
      if (!room) {
        record('reachConsensus', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`reachConsensus: no session ${input.sessionId}`);
      }
      const { winner, agreementRatio } = reachConsensus(room.session, {
        votes: input.votes,
      });
      const out: ConsensusResult = {
        sessionId: input.sessionId,
        voteCount: input.votes.length,
        winner,
        agreementRatio,
        majority: agreementRatio > 0.5,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('reachConsensus', true, { detail: out });
      return out;
    },

    async tolerateByzantine(input): Promise<ByzantineToleranceResult> {
      const t0 = Date.now();
      await sleep();
      const room = swarmRooms.get(input.sessionId);
      if (!room) {
        record('tolerateByzantine', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`tolerateByzantine: no session ${input.sessionId}`);
      }
      const { tolerated, honestRatio } = tolerateByzantine(room.session, {
        faultyAgentIds: input.faultyAgentIds,
      });
      const faultySet = new Set(input.faultyAgentIds);
      const faultyCount = room.session.agents.filter((a) =>
        faultySet.has(a.id),
      ).length;
      const out: ByzantineToleranceResult = {
        sessionId: input.sessionId,
        totalAgents: room.session.agents.length,
        faultyCount,
        honestRatio,
        tolerated,
        threshold: room.session.faultThreshold,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('tolerateByzantine', true, { detail: out });
      return out;
    },

    async closeSwarm(input) {
      await sleep();
      const room = swarmRooms.get(input.sessionId);
      if (!room) {
        record('closeSwarm', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`closeSwarm: no session ${input.sessionId}`);
      }
      room.closed = true;
      record('closeSwarm', true, {
        detail: {
          sessionId: input.sessionId,
          historyLength: room.session.history.length,
        },
      });
    },

    async runPipeline(input: PipelineInput): Promise<MaoSwarmPipelineResult> {
      const t0 = Date.now();
      await sleep();

      const maoSubId = `${input.sessionId}:mao`;
      const swarmSubId = `${input.sessionId}:swarm`;

      // Stage 1 — mao ceremony. crew assembly → 1 supervisor delegation
      // → graph transition → completeRound.
      const maoSession = startMaoSession({
        target: 'vercel-ai',
        sessionId: maoSubId,
      });
      const { agentCount } = assembleCrew(maoSession, { agents: input.crew });
      const workers: string[] = [];
      for (let round = 0; round < Math.max(1, input.minDelegations); round += 1) {
        const { delegation } = delegateBySupervisor(maoSession, {
          supervisorId: input.supervisorId,
          task: `${input.task}:${round + 1}`,
          workerIds: input.workerIds,
        });
        workers.push(delegation.worker);
      }

      if (input.graph.nodes.length === 0) {
        const out: MaoSwarmPipelineResult = {
          sessionId: input.sessionId,
          stage: 'blocked-graph-empty',
          blockedReason: 'graph.nodes must not be empty',
          crew: {
            agentCount,
            roles: input.crew.map((a) => a.role),
          },
          delegation: {
            rounds: workers.length,
            supervisor: input.supervisorId,
            workers,
          },
          graph: {
            visitedCount: 0,
            terminalNode: '',
          },
          swarm: {
            taskCount: 0,
            consensusWinner: null,
            agreementRatio: 0,
            byzantineTolerated: false,
          },
          latencyMs: Math.max(1, Date.now() - t0),
        };
        record('runPipeline', true, { detail: out });
        return out;
      }

      const { visited } = transitionGraph(maoSession, {
        nodes: input.graph.nodes,
        edges: input.graph.edges,
        entryNodeId: input.graph.entryNodeId,
      });
      const terminalNode = visited[visited.length - 1] ?? input.graph.entryNodeId;
      completeRound(maoSession, { minDelegations: input.minDelegations });

      // Stage 2 — swarm ceremony. role assignment → task allocation →
      // consensus → Byzantine tolerance gate.
      const swarmArgs: {
        target: 'vercel-ai';
        sessionId: string;
        faultThreshold?: number;
      } = {
        target: 'vercel-ai',
        sessionId: swarmSubId,
      };
      if (Number.isFinite(input.faultThreshold)) {
        swarmArgs.faultThreshold = input.faultThreshold;
      }
      const swarmSession = startSwarmSession(swarmArgs);
      assignRoles(swarmSession, {
        agents: input.swarmAgents,
        roles: input.swarmRoles,
      });
      const { allocations } = allocateTasks(swarmSession, {
        tasks: input.tasks,
      });
      const { winner, agreementRatio } = reachConsensus(swarmSession, {
        votes: input.votes,
      });
      const { tolerated } = tolerateByzantine(swarmSession, {
        faultyAgentIds: input.faultyAgentIds,
      });

      const majority = agreementRatio > 0.5;
      let stage: MaoSwarmPipelineResult['stage'] = 'completed';
      let blockedReason: string | null = null;
      if (!majority) {
        stage = 'blocked-no-consensus';
        blockedReason = `agreement ratio ${agreementRatio.toFixed(2)} <= 0.5 (no majority)`;
      } else if (!tolerated) {
        stage = 'blocked-byzantine';
        blockedReason = `honest ratio below (1 - faultThreshold ${swarmSession.faultThreshold})`;
      }

      const out: MaoSwarmPipelineResult = {
        sessionId: input.sessionId,
        stage,
        blockedReason,
        crew: {
          agentCount,
          roles: input.crew.map((a) => a.role),
        },
        delegation: {
          rounds: workers.length,
          supervisor: input.supervisorId,
          workers,
        },
        graph: {
          visitedCount: visited.length,
          terminalNode,
        },
        swarm: {
          taskCount: allocations.length,
          consensusWinner: majority ? winner : null,
          agreementRatio,
          byzantineTolerated: tolerated,
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
      maoRooms.clear();
      swarmRooms.clear();
      trace.length = 0;
    },

    delegations(sessionId: string): readonly MaoDelegation[] {
      const room = maoRooms.get(sessionId);
      return room ? room.session.delegations : [];
    },
  };
}
