import {
  providerEventName,
  type AiLlmAxis,
  type AiLlmTarget,
  type NeutralEventName,
} from './types.js';

export interface FidelityRow {
  provider: AiLlmTarget;
  axis: AiLlmAxis;
  neutralEvents: NeutralEventName[];
  providerEvents: string[];
}

export interface FidelityCoverage {
  providers: AiLlmTarget[];
  axes: AiLlmAxis[];
  rows: FidelityRow[];
}

export const AI_LLM_AXIS_TO_EVENTS: Record<AiLlmAxis, NeutralEventName[]> = {
  'prompt-injection': [
    'injection.direct_detected',
    'injection.indirect_detected',
    'injection.jailbreak_blocked',
    'injection.role_hijacking_blocked',
    'injection.xml_detected',
  ],
  hallucination: [
    'hallucination.self_consistency_scored',
    'hallucination.factuality_checked',
    'hallucination.citation_verified',
    'hallucination.confidence_scored',
  ],
  'llm-eval': [
    'eval.judge_scored',
    'eval.rubric_applied',
    'eval.preference_ranked',
    'eval.elo_updated',
  ],
  guardrails: [
    'guardrail.schema_validated',
    'guardrail.regex_matched',
    'guardrail.toxicity_blocked',
    'guardrail.pii_redacted',
    'guardrail.constitutional_checked',
  ],
  'rag-advanced': ['rag.chunked', 'rag.hybrid_retrieved', 'rag.reranked', 'rag.compressed'],
  'agent-orchestration': [
    'agent.react_stepped',
    'agent.tot_expanded',
    'agent.reflected',
    'agent.tool_selected',
  ],
  'fine-tuning-eval': [
    'ft.sft_evaluated',
    'ft.dpo_evaluated',
    'ft.catastrophic_forgetting_detected',
    'ft.benchmark_drift_detected',
  ],
  'cost-latency-sla': [
    'sla.budget_checked',
    'sla.latency_measured',
    'sla.model_routed',
    'sla.fallback_engaged',
  ],
  'multi-agent-orchestration': [
    'mao.crew_assembled',
    'mao.supervisor_delegated',
    'mao.graph_transitioned',
    'mao.round_completed',
  ],
  'agent-swarm': [
    'swarm.roles_assigned',
    'swarm.tasks_allocated',
    'swarm.consensus_reached',
    'swarm.byzantine_tolerated',
  ],
  'code-interpreter': [
    'ci.sandbox_started',
    'ci.code_executed',
    'ci.tool_used',
    'ci.rolled_back',
  ],
  'fine-tuning-pipeline': [
    'ftp.dataset_prepared',
    'ftp.rlhf_stepped',
    'ftp.eval_loop_ran',
    'ftp.drift_detected',
  ],
  'llm-ops': [
    'ops.registry_updated',
    'ops.rollout_advanced',
    'ops.ab_evaluated',
    'ops.canary_promoted',
    'ops.shadow_compared',
  ],
  'prompt-engineering-advanced': [
    'pea.chain_of_thought_expanded',
    'pea.few_shot_selected',
    'pea.cached',
    'pea.version_pinned',
  ],
  'rag-iii': [
    'rag3.graph_traversed',
    'rag3.agentic_stepped',
    'rag3.self_queried',
    'rag3.parent_expanded',
  ],
  'cost-optimization': [
    'co.batch_submitted',
    'co.prompt_compressed',
    'co.cascade_stepped',
    'co.semantic_cached',
  ],
};

export function collectFidelityCoverage(
  providers: AiLlmTarget[] = ['anthropic', 'openai', 'vercel-ai', 'langchain'],
): FidelityCoverage {
  const axes = Object.keys(AI_LLM_AXIS_TO_EVENTS) as AiLlmAxis[];
  const rows: FidelityRow[] = [];
  for (const provider of providers) {
    for (const axis of axes) {
      const neutralEvents = AI_LLM_AXIS_TO_EVENTS[axis];
      const providerEvents = neutralEvents.map((event) => providerEventName(provider, event));
      rows.push({ provider, axis, neutralEvents, providerEvents });
    }
  }
  return { providers, axes, rows };
}
