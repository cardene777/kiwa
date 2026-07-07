/**
 * Advanced AI-LLM semantics — provider-neutral axis SSOT (v0.4 + v0.5).
 *
 * Model 4 canonical LLM SDK targets as pure state machines so kiwa fixture
 * tests can assert on a neutral event name while still observing a
 * provider-specific dialect through providerEventName.
 *
 * Provider targets (SDK 別 4):
 * - anthropic ... Anthropic Messages API (Claude Haiku / Sonnet / Opus)
 * - openai ... OpenAI Chat Completions (gpt-4o / gpt-4o-mini)
 * - vercel-ai ... Vercel AI SDK (streamText + generateText、 provider agnostic)
 * - langchain ... LangChain (BaseChatModel + Runnable)
 *
 * v0.4 Axes (8):
 * - prompt-injection ... direct + indirect + jailbreak + role hijacking + XML injection defense
 * - hallucination ... self-consistency + factuality + citation + confidence + hedging
 * - llm-eval ... LLM-as-judge + rubric + preference + Elo + human-in-the-loop
 * - guardrails ... JSON schema + regex + toxicity + PII + Constitutional AI
 * - rag-advanced ... chunking + hybrid retrieval + reranking + citation + context compression
 * - agent-orchestration ... ReAct + ToT + reflection + self-correction + planning + tool selection
 * - fine-tuning-eval ... SFT/DPO + catastrophic forgetting + benchmark drift
 * - cost-latency-sla ... budget + p50/p99 + model routing + fallback ladder
 *
 * v0.5 Axes (advanced III、 8 new):
 * - multi-agent-orchestration ... CrewAI + AutoGen + LangGraph + supervisor + swarm coordination
 * - agent-swarm ... role-based + task allocation + consensus + Byzantine fault tolerance
 * - code-interpreter ... sandboxed Python REPL + tool use + rollback state machine
 * - fine-tuning-pipeline ... dataset prep + RLHF/DPO + eval loop + drift detection
 * - llm-ops ... model registry + rollout + A/B + canary + shadow
 * - prompt-engineering-advanced ... CoT + few-shot + caching + versioning
 * - rag-iii ... GraphRAG + agentic + self-querying + parent document
 * - cost-optimization ... batch API + prompt compression + model cascade + semantic cache
 */

export type AiLlmTarget = 'anthropic' | 'openai' | 'vercel-ai' | 'langchain';

export type AiLlmAxis =
  | 'prompt-injection'
  | 'hallucination'
  | 'llm-eval'
  | 'guardrails'
  | 'rag-advanced'
  | 'agent-orchestration'
  | 'fine-tuning-eval'
  | 'cost-latency-sla'
  | 'multi-agent-orchestration'
  | 'agent-swarm'
  | 'code-interpreter'
  | 'fine-tuning-pipeline'
  | 'llm-ops'
  | 'prompt-engineering-advanced'
  | 'rag-iii'
  | 'cost-optimization';

export type NeutralEventName =
  // prompt-injection
  | 'injection.direct_detected'
  | 'injection.indirect_detected'
  | 'injection.jailbreak_blocked'
  | 'injection.role_hijacking_blocked'
  | 'injection.xml_detected'
  // hallucination
  | 'hallucination.self_consistency_scored'
  | 'hallucination.factuality_checked'
  | 'hallucination.citation_verified'
  | 'hallucination.confidence_scored'
  // llm-eval
  | 'eval.judge_scored'
  | 'eval.rubric_applied'
  | 'eval.preference_ranked'
  | 'eval.elo_updated'
  // guardrails
  | 'guardrail.schema_validated'
  | 'guardrail.regex_matched'
  | 'guardrail.toxicity_blocked'
  | 'guardrail.pii_redacted'
  | 'guardrail.constitutional_checked'
  // rag-advanced
  | 'rag.chunked'
  | 'rag.hybrid_retrieved'
  | 'rag.reranked'
  | 'rag.compressed'
  // agent-orchestration
  | 'agent.react_stepped'
  | 'agent.tot_expanded'
  | 'agent.reflected'
  | 'agent.tool_selected'
  // fine-tuning-eval
  | 'ft.sft_evaluated'
  | 'ft.dpo_evaluated'
  | 'ft.catastrophic_forgetting_detected'
  | 'ft.benchmark_drift_detected'
  // cost-latency-sla
  | 'sla.budget_checked'
  | 'sla.latency_measured'
  | 'sla.model_routed'
  | 'sla.fallback_engaged'
  // multi-agent-orchestration (v0.5)
  | 'mao.crew_assembled'
  | 'mao.supervisor_delegated'
  | 'mao.graph_transitioned'
  | 'mao.round_completed'
  // agent-swarm (v0.5)
  | 'swarm.roles_assigned'
  | 'swarm.tasks_allocated'
  | 'swarm.consensus_reached'
  | 'swarm.byzantine_tolerated'
  // code-interpreter (v0.5)
  | 'ci.sandbox_started'
  | 'ci.code_executed'
  | 'ci.tool_used'
  | 'ci.rolled_back'
  // fine-tuning-pipeline (v0.5)
  | 'ftp.dataset_prepared'
  | 'ftp.rlhf_stepped'
  | 'ftp.eval_loop_ran'
  | 'ftp.drift_detected'
  // llm-ops (v0.5)
  | 'ops.registry_updated'
  | 'ops.rollout_advanced'
  | 'ops.ab_evaluated'
  | 'ops.canary_promoted'
  | 'ops.shadow_compared'
  // prompt-engineering-advanced (v0.5)
  | 'pea.chain_of_thought_expanded'
  | 'pea.few_shot_selected'
  | 'pea.cached'
  | 'pea.version_pinned'
  // rag-iii (v0.5)
  | 'rag3.graph_traversed'
  | 'rag3.agentic_stepped'
  | 'rag3.self_queried'
  | 'rag3.parent_expanded'
  // cost-optimization (v0.5)
  | 'co.batch_submitted'
  | 'co.prompt_compressed'
  | 'co.cascade_stepped'
  | 'co.semantic_cached';

export interface AxisStep<TState extends string> {
  neutralEvent: NeutralEventName;
  providerEvent: string;
  state: TState;
  timestampMs: number;
  metadata: Record<string, string | number | boolean>;
}

const dialect: Record<AiLlmTarget, Partial<Record<NeutralEventName, string>>> = {
  anthropic: {
    'injection.direct_detected': 'anthropic.injection.direct',
    'injection.indirect_detected': 'anthropic.injection.indirect',
    'injection.jailbreak_blocked': 'anthropic.injection.jailbreak',
    'injection.role_hijacking_blocked': 'anthropic.injection.role_hijack',
    'injection.xml_detected': 'anthropic.injection.xml',
    'hallucination.self_consistency_scored': 'anthropic.hallucination.self_consistency',
    'hallucination.factuality_checked': 'anthropic.hallucination.factuality',
    'hallucination.citation_verified': 'anthropic.hallucination.citation',
    'hallucination.confidence_scored': 'anthropic.hallucination.confidence',
    'eval.judge_scored': 'anthropic.eval.judge',
    'eval.rubric_applied': 'anthropic.eval.rubric',
    'eval.preference_ranked': 'anthropic.eval.preference',
    'eval.elo_updated': 'anthropic.eval.elo',
    'guardrail.schema_validated': 'anthropic.guardrail.schema',
    'guardrail.regex_matched': 'anthropic.guardrail.regex',
    'guardrail.toxicity_blocked': 'anthropic.guardrail.toxicity',
    'guardrail.pii_redacted': 'anthropic.guardrail.pii',
    'guardrail.constitutional_checked': 'anthropic.guardrail.constitutional',
    'rag.chunked': 'anthropic.rag.chunk',
    'rag.hybrid_retrieved': 'anthropic.rag.hybrid',
    'rag.reranked': 'anthropic.rag.rerank',
    'rag.compressed': 'anthropic.rag.compress',
    'agent.react_stepped': 'anthropic.agent.react',
    'agent.tot_expanded': 'anthropic.agent.tot',
    'agent.reflected': 'anthropic.agent.reflect',
    'agent.tool_selected': 'anthropic.agent.tool_select',
    'ft.sft_evaluated': 'anthropic.ft.sft',
    'ft.dpo_evaluated': 'anthropic.ft.dpo',
    'ft.catastrophic_forgetting_detected': 'anthropic.ft.forgetting',
    'ft.benchmark_drift_detected': 'anthropic.ft.drift',
    'sla.budget_checked': 'anthropic.sla.budget',
    'sla.latency_measured': 'anthropic.sla.latency',
    'sla.model_routed': 'anthropic.sla.route',
    'sla.fallback_engaged': 'anthropic.sla.fallback',
    'mao.crew_assembled': 'anthropic.mao.crew',
    'mao.supervisor_delegated': 'anthropic.mao.supervisor',
    'mao.graph_transitioned': 'anthropic.mao.graph',
    'mao.round_completed': 'anthropic.mao.round',
    'swarm.roles_assigned': 'anthropic.swarm.roles',
    'swarm.tasks_allocated': 'anthropic.swarm.tasks',
    'swarm.consensus_reached': 'anthropic.swarm.consensus',
    'swarm.byzantine_tolerated': 'anthropic.swarm.byzantine',
    'ci.sandbox_started': 'anthropic.ci.sandbox',
    'ci.code_executed': 'anthropic.ci.exec',
    'ci.tool_used': 'anthropic.ci.tool',
    'ci.rolled_back': 'anthropic.ci.rollback',
    'ftp.dataset_prepared': 'anthropic.ftp.dataset',
    'ftp.rlhf_stepped': 'anthropic.ftp.rlhf',
    'ftp.eval_loop_ran': 'anthropic.ftp.eval',
    'ftp.drift_detected': 'anthropic.ftp.drift',
    'ops.registry_updated': 'anthropic.ops.registry',
    'ops.rollout_advanced': 'anthropic.ops.rollout',
    'ops.ab_evaluated': 'anthropic.ops.ab',
    'ops.canary_promoted': 'anthropic.ops.canary',
    'ops.shadow_compared': 'anthropic.ops.shadow',
    'pea.chain_of_thought_expanded': 'anthropic.pea.cot',
    'pea.few_shot_selected': 'anthropic.pea.fewshot',
    'pea.cached': 'anthropic.pea.cache',
    'pea.version_pinned': 'anthropic.pea.version',
    'rag3.graph_traversed': 'anthropic.rag3.graph',
    'rag3.agentic_stepped': 'anthropic.rag3.agentic',
    'rag3.self_queried': 'anthropic.rag3.selfquery',
    'rag3.parent_expanded': 'anthropic.rag3.parent',
    'co.batch_submitted': 'anthropic.co.batch',
    'co.prompt_compressed': 'anthropic.co.compress',
    'co.cascade_stepped': 'anthropic.co.cascade',
    'co.semantic_cached': 'anthropic.co.semcache',
  },
  openai: {
    'injection.direct_detected': 'openai.injection.direct',
    'injection.indirect_detected': 'openai.injection.indirect',
    'injection.jailbreak_blocked': 'openai.injection.jailbreak',
    'injection.role_hijacking_blocked': 'openai.injection.role_hijack',
    'injection.xml_detected': 'openai.injection.xml',
    'hallucination.self_consistency_scored': 'openai.hallucination.self_consistency',
    'hallucination.factuality_checked': 'openai.hallucination.factuality',
    'hallucination.citation_verified': 'openai.hallucination.citation',
    'hallucination.confidence_scored': 'openai.hallucination.confidence',
    'eval.judge_scored': 'openai.eval.judge',
    'eval.rubric_applied': 'openai.eval.rubric',
    'eval.preference_ranked': 'openai.eval.preference',
    'eval.elo_updated': 'openai.eval.elo',
    'guardrail.schema_validated': 'openai.guardrail.schema',
    'guardrail.regex_matched': 'openai.guardrail.regex',
    'guardrail.toxicity_blocked': 'openai.guardrail.toxicity',
    'guardrail.pii_redacted': 'openai.guardrail.pii',
    'guardrail.constitutional_checked': 'openai.guardrail.constitutional',
    'rag.chunked': 'openai.rag.chunk',
    'rag.hybrid_retrieved': 'openai.rag.hybrid',
    'rag.reranked': 'openai.rag.rerank',
    'rag.compressed': 'openai.rag.compress',
    'agent.react_stepped': 'openai.agent.react',
    'agent.tot_expanded': 'openai.agent.tot',
    'agent.reflected': 'openai.agent.reflect',
    'agent.tool_selected': 'openai.agent.tool_select',
    'ft.sft_evaluated': 'openai.ft.sft',
    'ft.dpo_evaluated': 'openai.ft.dpo',
    'ft.catastrophic_forgetting_detected': 'openai.ft.forgetting',
    'ft.benchmark_drift_detected': 'openai.ft.drift',
    'sla.budget_checked': 'openai.sla.budget',
    'sla.latency_measured': 'openai.sla.latency',
    'sla.model_routed': 'openai.sla.route',
    'sla.fallback_engaged': 'openai.sla.fallback',
    'mao.crew_assembled': 'openai.mao.crew',
    'mao.supervisor_delegated': 'openai.mao.supervisor',
    'mao.graph_transitioned': 'openai.mao.graph',
    'mao.round_completed': 'openai.mao.round',
    'swarm.roles_assigned': 'openai.swarm.roles',
    'swarm.tasks_allocated': 'openai.swarm.tasks',
    'swarm.consensus_reached': 'openai.swarm.consensus',
    'swarm.byzantine_tolerated': 'openai.swarm.byzantine',
    'ci.sandbox_started': 'openai.ci.sandbox',
    'ci.code_executed': 'openai.ci.exec',
    'ci.tool_used': 'openai.ci.tool',
    'ci.rolled_back': 'openai.ci.rollback',
    'ftp.dataset_prepared': 'openai.ftp.dataset',
    'ftp.rlhf_stepped': 'openai.ftp.rlhf',
    'ftp.eval_loop_ran': 'openai.ftp.eval',
    'ftp.drift_detected': 'openai.ftp.drift',
    'ops.registry_updated': 'openai.ops.registry',
    'ops.rollout_advanced': 'openai.ops.rollout',
    'ops.ab_evaluated': 'openai.ops.ab',
    'ops.canary_promoted': 'openai.ops.canary',
    'ops.shadow_compared': 'openai.ops.shadow',
    'pea.chain_of_thought_expanded': 'openai.pea.cot',
    'pea.few_shot_selected': 'openai.pea.fewshot',
    'pea.cached': 'openai.pea.cache',
    'pea.version_pinned': 'openai.pea.version',
    'rag3.graph_traversed': 'openai.rag3.graph',
    'rag3.agentic_stepped': 'openai.rag3.agentic',
    'rag3.self_queried': 'openai.rag3.selfquery',
    'rag3.parent_expanded': 'openai.rag3.parent',
    'co.batch_submitted': 'openai.co.batch',
    'co.prompt_compressed': 'openai.co.compress',
    'co.cascade_stepped': 'openai.co.cascade',
    'co.semantic_cached': 'openai.co.semcache',
  },
  'vercel-ai': {
    'injection.direct_detected': 'vercel.injection.direct',
    'injection.indirect_detected': 'vercel.injection.indirect',
    'injection.jailbreak_blocked': 'vercel.injection.jailbreak',
    'injection.role_hijacking_blocked': 'vercel.injection.role_hijack',
    'injection.xml_detected': 'vercel.injection.xml',
    'hallucination.self_consistency_scored': 'vercel.hallucination.self_consistency',
    'hallucination.factuality_checked': 'vercel.hallucination.factuality',
    'hallucination.citation_verified': 'vercel.hallucination.citation',
    'hallucination.confidence_scored': 'vercel.hallucination.confidence',
    'eval.judge_scored': 'vercel.eval.judge',
    'eval.rubric_applied': 'vercel.eval.rubric',
    'eval.preference_ranked': 'vercel.eval.preference',
    'eval.elo_updated': 'vercel.eval.elo',
    'guardrail.schema_validated': 'vercel.guardrail.schema',
    'guardrail.regex_matched': 'vercel.guardrail.regex',
    'guardrail.toxicity_blocked': 'vercel.guardrail.toxicity',
    'guardrail.pii_redacted': 'vercel.guardrail.pii',
    'guardrail.constitutional_checked': 'vercel.guardrail.constitutional',
    'rag.chunked': 'vercel.rag.chunk',
    'rag.hybrid_retrieved': 'vercel.rag.hybrid',
    'rag.reranked': 'vercel.rag.rerank',
    'rag.compressed': 'vercel.rag.compress',
    'agent.react_stepped': 'vercel.agent.react',
    'agent.tot_expanded': 'vercel.agent.tot',
    'agent.reflected': 'vercel.agent.reflect',
    'agent.tool_selected': 'vercel.agent.tool_select',
    'ft.sft_evaluated': 'vercel.ft.sft',
    'ft.dpo_evaluated': 'vercel.ft.dpo',
    'ft.catastrophic_forgetting_detected': 'vercel.ft.forgetting',
    'ft.benchmark_drift_detected': 'vercel.ft.drift',
    'sla.budget_checked': 'vercel.sla.budget',
    'sla.latency_measured': 'vercel.sla.latency',
    'sla.model_routed': 'vercel.sla.route',
    'sla.fallback_engaged': 'vercel.sla.fallback',
    'mao.crew_assembled': 'vercel.mao.crew',
    'mao.supervisor_delegated': 'vercel.mao.supervisor',
    'mao.graph_transitioned': 'vercel.mao.graph',
    'mao.round_completed': 'vercel.mao.round',
    'swarm.roles_assigned': 'vercel.swarm.roles',
    'swarm.tasks_allocated': 'vercel.swarm.tasks',
    'swarm.consensus_reached': 'vercel.swarm.consensus',
    'swarm.byzantine_tolerated': 'vercel.swarm.byzantine',
    'ci.sandbox_started': 'vercel.ci.sandbox',
    'ci.code_executed': 'vercel.ci.exec',
    'ci.tool_used': 'vercel.ci.tool',
    'ci.rolled_back': 'vercel.ci.rollback',
    'ftp.dataset_prepared': 'vercel.ftp.dataset',
    'ftp.rlhf_stepped': 'vercel.ftp.rlhf',
    'ftp.eval_loop_ran': 'vercel.ftp.eval',
    'ftp.drift_detected': 'vercel.ftp.drift',
    'ops.registry_updated': 'vercel.ops.registry',
    'ops.rollout_advanced': 'vercel.ops.rollout',
    'ops.ab_evaluated': 'vercel.ops.ab',
    'ops.canary_promoted': 'vercel.ops.canary',
    'ops.shadow_compared': 'vercel.ops.shadow',
    'pea.chain_of_thought_expanded': 'vercel.pea.cot',
    'pea.few_shot_selected': 'vercel.pea.fewshot',
    'pea.cached': 'vercel.pea.cache',
    'pea.version_pinned': 'vercel.pea.version',
    'rag3.graph_traversed': 'vercel.rag3.graph',
    'rag3.agentic_stepped': 'vercel.rag3.agentic',
    'rag3.self_queried': 'vercel.rag3.selfquery',
    'rag3.parent_expanded': 'vercel.rag3.parent',
    'co.batch_submitted': 'vercel.co.batch',
    'co.prompt_compressed': 'vercel.co.compress',
    'co.cascade_stepped': 'vercel.co.cascade',
    'co.semantic_cached': 'vercel.co.semcache',
  },
  langchain: {
    'injection.direct_detected': 'langchain.injection.direct',
    'injection.indirect_detected': 'langchain.injection.indirect',
    'injection.jailbreak_blocked': 'langchain.injection.jailbreak',
    'injection.role_hijacking_blocked': 'langchain.injection.role_hijack',
    'injection.xml_detected': 'langchain.injection.xml',
    'hallucination.self_consistency_scored': 'langchain.hallucination.self_consistency',
    'hallucination.factuality_checked': 'langchain.hallucination.factuality',
    'hallucination.citation_verified': 'langchain.hallucination.citation',
    'hallucination.confidence_scored': 'langchain.hallucination.confidence',
    'eval.judge_scored': 'langchain.eval.judge',
    'eval.rubric_applied': 'langchain.eval.rubric',
    'eval.preference_ranked': 'langchain.eval.preference',
    'eval.elo_updated': 'langchain.eval.elo',
    'guardrail.schema_validated': 'langchain.guardrail.schema',
    'guardrail.regex_matched': 'langchain.guardrail.regex',
    'guardrail.toxicity_blocked': 'langchain.guardrail.toxicity',
    'guardrail.pii_redacted': 'langchain.guardrail.pii',
    'guardrail.constitutional_checked': 'langchain.guardrail.constitutional',
    'rag.chunked': 'langchain.rag.chunk',
    'rag.hybrid_retrieved': 'langchain.rag.hybrid',
    'rag.reranked': 'langchain.rag.rerank',
    'rag.compressed': 'langchain.rag.compress',
    'agent.react_stepped': 'langchain.agent.react',
    'agent.tot_expanded': 'langchain.agent.tot',
    'agent.reflected': 'langchain.agent.reflect',
    'agent.tool_selected': 'langchain.agent.tool_select',
    'ft.sft_evaluated': 'langchain.ft.sft',
    'ft.dpo_evaluated': 'langchain.ft.dpo',
    'ft.catastrophic_forgetting_detected': 'langchain.ft.forgetting',
    'ft.benchmark_drift_detected': 'langchain.ft.drift',
    'sla.budget_checked': 'langchain.sla.budget',
    'sla.latency_measured': 'langchain.sla.latency',
    'sla.model_routed': 'langchain.sla.route',
    'sla.fallback_engaged': 'langchain.sla.fallback',
    'mao.crew_assembled': 'langchain.mao.crew',
    'mao.supervisor_delegated': 'langchain.mao.supervisor',
    'mao.graph_transitioned': 'langchain.mao.graph',
    'mao.round_completed': 'langchain.mao.round',
    'swarm.roles_assigned': 'langchain.swarm.roles',
    'swarm.tasks_allocated': 'langchain.swarm.tasks',
    'swarm.consensus_reached': 'langchain.swarm.consensus',
    'swarm.byzantine_tolerated': 'langchain.swarm.byzantine',
    'ci.sandbox_started': 'langchain.ci.sandbox',
    'ci.code_executed': 'langchain.ci.exec',
    'ci.tool_used': 'langchain.ci.tool',
    'ci.rolled_back': 'langchain.ci.rollback',
    'ftp.dataset_prepared': 'langchain.ftp.dataset',
    'ftp.rlhf_stepped': 'langchain.ftp.rlhf',
    'ftp.eval_loop_ran': 'langchain.ftp.eval',
    'ftp.drift_detected': 'langchain.ftp.drift',
    'ops.registry_updated': 'langchain.ops.registry',
    'ops.rollout_advanced': 'langchain.ops.rollout',
    'ops.ab_evaluated': 'langchain.ops.ab',
    'ops.canary_promoted': 'langchain.ops.canary',
    'ops.shadow_compared': 'langchain.ops.shadow',
    'pea.chain_of_thought_expanded': 'langchain.pea.cot',
    'pea.few_shot_selected': 'langchain.pea.fewshot',
    'pea.cached': 'langchain.pea.cache',
    'pea.version_pinned': 'langchain.pea.version',
    'rag3.graph_traversed': 'langchain.rag3.graph',
    'rag3.agentic_stepped': 'langchain.rag3.agentic',
    'rag3.self_queried': 'langchain.rag3.selfquery',
    'rag3.parent_expanded': 'langchain.rag3.parent',
    'co.batch_submitted': 'langchain.co.batch',
    'co.prompt_compressed': 'langchain.co.compress',
    'co.cascade_stepped': 'langchain.co.cascade',
    'co.semantic_cached': 'langchain.co.semcache',
  },
};

export function providerEventName(target: AiLlmTarget, neutral: NeutralEventName): string {
  return dialect[target][neutral] ?? neutral;
}
