/**
 * Provider-neutral LLM multi-agent + swarm orchestration adapter surface
 * for the multi-agent-swarm dogfood (v1.40-2).
 *
 * The app talks to the multi-agent + swarm surface only through this
 * interface. Two implementations exist —
 *  - {@link makeRealAdapter} — drives the Vercel AI SDK + Anthropic
 *    Messages API when `KIWA_MODE=real` + `ANTHROPIC_API_KEY` +
 *    `KIWA_LLM_BUDGET_USD` are set; otherwise every op reports
 *    `KIWA_LLM_ENV_MISSING`.
 *  - {@link makeMockAdapter} — backed by `@kiwa-lab/ai-llm` v0.5
 *    multi-agent-orchestration + agent-swarm semantics (startMaoSession
 *    / assembleCrew / delegateBySupervisor / transitionGraph /
 *    completeRound / startSwarmSession / assignRoles / allocateTasks /
 *    reachConsensus / tolerateByzantine).
 *
 * Both must satisfy the same 13-op contract so behavioural fidelity
 * between real vs mock can be measured side-by-side across the 2 axes
 * v1.40-2 dogfoods —
 *  - Multi-agent orchestration (crew → supervisor delegation → graph
 *    transition → round completion; CrewAI + AutoGen + LangGraph)
 *  - Agent swarm coordination (role assignment → task allocation →
 *    majority-vote consensus → Byzantine tolerance)
 *
 * The AC anchors this contract on the 3 domain surfaces the harness runs
 * against both adapters —
 *  - mao-e2e (crew assembly / supervisor delegation / graph transition /
 *    round completion)
 *  - swarm-e2e (role assignment / task allocation / consensus / Byzantine
 *    tolerance)
 *  - pipeline-e2e (multi-stage crew → delegation → swarm-consensus →
 *    Byzantine gate)
 * Each spec exercises a distinct subset of the ops below so the fidelity
 * report can point at the ops that diverged.
 */

import type {
  MaoAgent,
  MaoDelegation,
  MaoGraphEdge,
  MaoGraphNode,
  SwarmTask,
  SwarmVote,
} from '@kiwa-lab/ai-llm';

/** Result of assembling a crew for the multi-agent surface. */
export interface AssembleCrewResult {
  sessionId: string;
  agentCount: number;
  roles: string[];
  latencyMs: number;
}

/** Result of one supervisor delegation round. */
export interface DelegateResult {
  sessionId: string;
  round: number;
  supervisor: string;
  worker: string;
  latencyMs: number;
}

/** Result of walking a state graph. */
export interface GraphTransitionResult {
  sessionId: string;
  nodeCount: number;
  edgeCount: number;
  visitedCount: number;
  terminalNode: string;
  latencyMs: number;
}

/** Result of completing one delegation round. */
export interface RoundCompletionResult {
  sessionId: string;
  round: number;
  totalDelegations: number;
  sufficient: boolean;
  latencyMs: number;
}

/** Result of assigning roles to a set of swarm agents. */
export interface AssignRolesResult {
  sessionId: string;
  agentCount: number;
  roleCount: number;
  averageReliability: number;
  latencyMs: number;
}

/** Result of allocating a task backlog to swarm agents. */
export interface AllocateTasksResult {
  sessionId: string;
  taskCount: number;
  topPriority: number;
  allocations: SwarmTask[];
  latencyMs: number;
}

/** Result of running a majority-vote consensus round. */
export interface ConsensusResult {
  sessionId: string;
  voteCount: number;
  winner: string | null;
  agreementRatio: number;
  majority: boolean;
  latencyMs: number;
}

/** Result of running the Byzantine-fault-tolerance gate. */
export interface ByzantineToleranceResult {
  sessionId: string;
  totalAgents: number;
  faultyCount: number;
  honestRatio: number;
  tolerated: boolean;
  threshold: number;
  latencyMs: number;
}

/** Result of running the full multi-agent + swarm pipeline. */
export interface MaoSwarmPipelineResult {
  sessionId: string;
  stage:
    | 'completed'
    | 'blocked-no-consensus'
    | 'blocked-byzantine'
    | 'blocked-graph-empty';
  blockedReason: string | null;
  crew: {
    agentCount: number;
    roles: string[];
  };
  delegation: {
    rounds: number;
    supervisor: string;
    workers: string[];
  };
  graph: {
    visitedCount: number;
    terminalNode: string;
  };
  swarm: {
    taskCount: number;
    consensusWinner: string | null;
    agreementRatio: number;
    byzantineTolerated: boolean;
  };
  latencyMs: number;
}

/** Neutral trace event — mock and real adapters emit the same shape. */
export interface TraceEvent {
  op:
    | 'startMao'
    | 'assembleCrew'
    | 'delegateBySupervisor'
    | 'transitionGraph'
    | 'completeRound'
    | 'closeMao'
    | 'startSwarm'
    | 'assignRoles'
    | 'allocateTasks'
    | 'reachConsensus'
    | 'tolerateByzantine'
    | 'closeSwarm'
    | 'runPipeline';
  ok: boolean;
  errorKind?: string;
  detail?: unknown;
}

/** Delegation input passed through the multi-agent surface. */
export interface DelegateInput {
  supervisorId: string;
  task: string;
  workerIds: string[];
}

/** Graph transition input passed through the multi-agent surface. */
export interface GraphInput {
  nodes: MaoGraphNode[];
  edges: MaoGraphEdge[];
  entryNodeId: string;
}

/** Task allocation input passed through the swarm surface. */
export interface TaskInput {
  id: string;
  priority: number;
}

/** Role assignment input passed through the swarm surface. */
export interface SwarmAgentInput {
  id: string;
  reliability: number;
}

/** Pipeline input drives the full crew → delegation → swarm → consensus ceremony. */
export interface PipelineInput {
  sessionId: string;
  crew: MaoAgent[];
  supervisorId: string;
  workerIds: string[];
  task: string;
  graph: GraphInput;
  swarmAgents: SwarmAgentInput[];
  swarmRoles: string[];
  tasks: TaskInput[];
  votes: SwarmVote[];
  faultyAgentIds: string[];
  minDelegations: number;
  faultThreshold: number;
}

/** The LLM multi-agent + swarm adapter — 13 ops across 2 axes + pipeline. */
export interface LlmMaoSwarmAdapter {
  readonly mode: 'real' | 'mock';

  // multi-agent orchestration surface (mao-e2e axis: CrewAI + AutoGen +
  // LangGraph state machine).
  startMao(input: { sessionId: string }): Promise<void>;
  assembleCrew(input: {
    sessionId: string;
    agents: MaoAgent[];
  }): Promise<AssembleCrewResult>;
  delegateBySupervisor(input: {
    sessionId: string;
    delegation: DelegateInput;
  }): Promise<DelegateResult>;
  transitionGraph(input: {
    sessionId: string;
    graph: GraphInput;
  }): Promise<GraphTransitionResult>;
  completeRound(input: {
    sessionId: string;
    minDelegations: number;
  }): Promise<RoundCompletionResult>;
  closeMao(input: { sessionId: string }): Promise<void>;

  // swarm surface (swarm-e2e axis: role-based + consensus + Byzantine).
  startSwarm(input: {
    sessionId: string;
    faultThreshold?: number;
  }): Promise<void>;
  assignRoles(input: {
    sessionId: string;
    agents: SwarmAgentInput[];
    roles: string[];
  }): Promise<AssignRolesResult>;
  allocateTasks(input: {
    sessionId: string;
    tasks: TaskInput[];
  }): Promise<AllocateTasksResult>;
  reachConsensus(input: {
    sessionId: string;
    votes: SwarmVote[];
  }): Promise<ConsensusResult>;
  tolerateByzantine(input: {
    sessionId: string;
    faultyAgentIds: string[];
  }): Promise<ByzantineToleranceResult>;
  closeSwarm(input: { sessionId: string }): Promise<void>;

  // pipeline surface (pipeline-e2e axis).
  runPipeline(input: PipelineInput): Promise<MaoSwarmPipelineResult>;

  /** trace snapshot — used by the fidelity harness. */
  traces(): readonly TraceEvent[];

  /** clear all state — invoked between test cases. */
  reset(): Promise<void>;

  /** delegation history — used by pipeline tests to introspect worker rotation. */
  delegations(sessionId: string): readonly MaoDelegation[];
}
