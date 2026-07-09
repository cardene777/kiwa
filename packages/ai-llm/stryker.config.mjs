/**
 * Mutation testing config for @kiwa-lab/ai-llm.
 * Threshold: SaaS tier (high 65 / low 55 / break 50) — LLM adapter wraps
 * OpenAI / Anthropic / LangChain with fidelity report + multimodal mocks;
 * provider API surfaces evolve rapidly.
 * SSOT: docs/quality/mutation-thresholds.md § SaaS tier.
 */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.stryker.config.mjs' },
  mutate: [
    '.vitest-dist/src/engine.js',
    '.vitest-dist/src/fidelity.js',
    '.vitest-dist/src/openai.js',
    '.vitest-dist/src/anthropic.js',
    '.vitest-dist/src/langchain.js',
    '.vitest-dist/src/multimodal.js',
  ],
  thresholds: { high: 65, low: 55, break: 50 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 4,
};
