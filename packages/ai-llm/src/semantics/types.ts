/**
 * Advanced AI-LLM semantics — provider-neutral axis SSOT (v0.4).
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
 * Axes (8):
 * - prompt-injection ... direct + indirect + jailbreak + role hijacking + XML injection defense
 * - hallucination ... self-consistency + factuality + citation + confidence + hedging
 * - llm-eval ... LLM-as-judge + rubric + preference + Elo + human-in-the-loop
 * - guardrails ... JSON schema + regex + toxicity + PII + Constitutional AI
 * - rag-advanced ... chunking + hybrid retrieval + reranking + citation + context compression
 * - agent-orchestration ... ReAct + ToT + reflection + self-correction + planning + tool selection
 * - fine-tuning-eval ... SFT/DPO + catastrophic forgetting + benchmark drift
 * - cost-latency-sla ... budget + p50/p99 + model routing + fallback ladder
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
  | 'cost-latency-sla';

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
  | 'sla.fallback_engaged';

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
  },
};

export function providerEventName(target: AiLlmTarget, neutral: NeutralEventName): string {
  return dialect[target][neutral] ?? neutral;
}
