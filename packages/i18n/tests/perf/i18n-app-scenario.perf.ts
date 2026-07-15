/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createI18nClient } from '../../src/index.js';

const MODULE = 'i18n-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('i18n app scenario perf (real workload)', () => {
  it('3-layer perf: translation_workflow / locale_switch_batch / missing_key_error_handling', async () => {
    const messages = {
      en: {
        greeting: 'Hello, {{name}}!',
        cart: { one: '1 item in cart', other: '{{count}} items in cart' },
        checkout: 'Total: {{amount}}',
      },
      ja: {
        greeting: 'こんにちは、 {{name}}さん!',
        cart: { other: 'カートに {{count}} 個の商品' },
        checkout: '合計: {{amount}}',
      },
      fr: {
        greeting: 'Bonjour, {{name}} !',
        cart: { one: '1 article dans le panier', other: '{{count}} articles dans le panier' },
        checkout: 'Total : {{amount}}',
      },
      de: {
        greeting: 'Hallo, {{name}}!',
        cart: { one: '1 Artikel im Warenkorb', other: '{{count}} Artikel im Warenkorb' },
        checkout: 'Gesamt: {{amount}}',
      },
    };

    const result = await runPerf3Layer({
      moduleName: MODULE,
      reportPath: REPORT_PATH,
      serialIterations: 20,
      serialWarmup: 3,
      concurrency: 4,
      iterationsPerWorker: 5,
      memoryIterations: 20,
      ops: [
        {
          name: 'translation_workflow (10 translate across 4 providers)',
          fn: async () => {
            const providers = ['next-intl', 'vue-i18n', 'react-i18next', 'lingui'] as const;
            for (let i = 0; i < 10; i++) {
              const client = createI18nClient({
                provider: providers[i % 4],
                locale: 'en',
                messages,
              });
              client.translate('greeting', { values: { name: `user-${i}` } });
              client.translate('cart', { count: i });
              client.translate('checkout', { values: { amount: `$${i * 10}` } });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'locale_switch_batch (5 setLocale + translate)',
          fn: async () => {
            const client = createI18nClient({
              provider: 'next-intl',
              locale: 'en',
              messages,
            });
            const locales = ['en', 'ja', 'fr', 'de', 'en'];
            for (let i = 0; i < 5; i++) {
              client.setLocale(locales[i]!);
              client.translate('greeting', { values: { name: 'kiwa' } });
              client.translate('cart', { count: i + 1 });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'missing_key_error_handling (5 missing translations)',
          fn: async () => {
            const client = createI18nClient({
              provider: 'next-intl',
              locale: 'en',
              messages,
            });
            for (let i = 0; i < 5; i++) {
              const result = client.translate(`unknown.key.${i}`, { defaultMessage: `default-${i}` });
              if (result.used !== 'default') throw new Error(`expected default, got ${result.used}`);
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'retry_recovery (5 flaky async retry to success)',
          fn: async () => {
            const mod = await import('../../src/index.js');
            const wr = mod.withRetry;
            let ctr = 0;
            const wrapped = wr(async () => {
              ctr += 1;
              if (ctr % 3 !== 0) throw new Error('flake');
              return 'ok';
            }, { maxAttempts: 3 });
            for (let i = 0; i < 5; i += 1) {
              await wrapped().catch(() => null);
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'concurrent_batch (5 batches of 4 items with error isolation)',
          fn: async () => {
            const mod = await import('../../src/index.js');
            const bo = mod.batchOperate;
            for (let i = 0; i < 5; i += 1) {
              await bo(
                [{ name: 'a', input: 1 }, { name: 'b', input: 2 }, { name: 'c', input: 3 }, { name: 'd', input: 4 }],
                async (item) => (item.input as number) * 2,
              );
            }
          },
          serialP95CapMs: 100,
        },
      ],
    });
    expect(result).toBeDefined();
  });
});
