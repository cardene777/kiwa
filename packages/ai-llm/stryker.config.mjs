/**
 * Mutation testing config for @kiwa-lab/ai-llm.
 * Threshold: SaaS tier (high 65 / low 55 / break 50) — LLM adapter wraps
 * OpenAI / Anthropic / LangChain with fidelity report + multimodal mocks;
 * provider API surfaces evolve rapidly.
 * SSOT: docs/quality/mutation-thresholds.md § SaaS tier.
 *
 * Every implementation file (#1980). The narrow scope scored 64.45 — below the
 * SaaS bar — and the widened one scores 75.83 over 4,375 mutants. **The six
 * files it used to mutate were its worst-tested ones**; the semantics layer
 * that sat outside pulled the package eleven points up.
 *
 * Its baseline JSON was a `killRate: null` stub from 2026-07-05 until #1980,
 * so nothing had ever recorded a number for this package either way.
 */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.stryker.config.mjs' },
  mutate: [
    '.vitest-dist/src/anthropic.js',
    '.vitest-dist/src/engine.js',
    '.vitest-dist/src/fidelity.js',
    '.vitest-dist/src/langchain.js',
    '.vitest-dist/src/multimodal.js',
    '.vitest-dist/src/openai.js',
    '.vitest-dist/src/pricing.js',
    '.vitest-dist/src/report.js',
    '.vitest-dist/src/sampling.js',
    '.vitest-dist/src/semantics/agent-orchestration.js',
    '.vitest-dist/src/semantics/agent-swarm.js',
    '.vitest-dist/src/semantics/code-interpreter.js',
    '.vitest-dist/src/semantics/cost-latency-sla.js',
    '.vitest-dist/src/semantics/cost-optimization.js',
    '.vitest-dist/src/semantics/fidelity.js',
    '.vitest-dist/src/semantics/fine-tuning-eval.js',
    '.vitest-dist/src/semantics/fine-tuning-pipeline.js',
    '.vitest-dist/src/semantics/guardrails.js',
    '.vitest-dist/src/semantics/hallucination.js',
    '.vitest-dist/src/semantics/llm-eval.js',
    '.vitest-dist/src/semantics/llm-ops.js',
    '.vitest-dist/src/semantics/multi-agent-orchestration.js',
    '.vitest-dist/src/semantics/prompt-engineering-advanced.js',
    '.vitest-dist/src/semantics/prompt-injection.js',
    '.vitest-dist/src/semantics/rag-advanced.js',
    '.vitest-dist/src/semantics/rag-iii.js',
    '.vitest-dist/src/semantics/real-driver.js',
    '.vitest-dist/src/semantics/types.js',
    '.vitest-dist/src/types.js',
    '.vitest-dist/src/vercel-ai.js',
  ],
  thresholds: { high: 65, low: 55, break: 50 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 4,
};
