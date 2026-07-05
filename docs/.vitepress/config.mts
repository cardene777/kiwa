import { defineConfig } from 'vitepress';

/**
 * VitePress configuration for the kiwa documentation site.
 *
 * v1.11-6 (Issue #686) introduces the site skeleton. VitePress itself is an
 * opt-in devDependency — install with `pnpm add -D vitepress` at the repo
 * root when you want to build locally. The `/docs-publish` skill wires up
 * the full generation → build → gh-pages push chain.
 *
 * Documentation lives under `docs/`:
 * - `docs/index.md` — landing page
 * - `docs/tutorials/*.md` — hands-on tutorials (v1.11-5)
 * - `docs/migrations/*.md` — per-milestone migration guides (v1.11-5)
 * - `docs/quality/release-gate.md` — release-gate SSOT (v1.11-1)
 * - `docs/quality-reports/*` — provider quality reports
 * - `docs/api/{typescript,rust,solidity}/**` — generated API references
 *
 * The theme is the default VitePress theme; brand colour follows the kiwa
 * "gentle green" (#5ba75b) used across the announcement banners.
 */

export default defineConfig({
  title: 'kiwa',
  description:
    'OSS test framework for dApps + web apps + full-stack frameworks — Solidity contract / e2e / a11y / visual / api / ui / data / cli / auth / queue / cache / Next.js / Nuxt / SvelteKit / Remix / Astro / SolidStart / Qwik City / Edge / Rust / Go / Python.',
  lang: 'en-US',
  cleanUrls: true,
  ignoreDeadLinks: true,
  base: '/kiwa/',
  head: [['link', { rel: 'icon', href: '/kiwa/favicon.svg' }]],

  themeConfig: {
    logo: '/kiwa-logo.svg',
    siteTitle: 'kiwa',
    outline: [2, 3],

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Tutorials', link: '/tutorials/' },
      { text: 'Concepts', link: '/concepts/ai-llm-testing' },
      { text: 'Migrations', link: '/migrations/' },
      { text: 'Quality', link: '/quality/release-gate' },
      { text: 'API Reference', link: '/api/' },
      {
        text: 'Roadmap',
        link: 'https://github.com/cardene777/kiwa#roadmap',
      },
    ],

    sidebar: {
      '/tutorials/': [
        {
          text: 'Getting started',
          items: [
            { text: 'Overview', link: '/tutorials/' },
            {
              text: '01 — Your first Supabase Auth test',
              link: '/tutorials/01-supabase-auth-first-test',
            },
            { text: '02 — RabbitMQ DLX test recipe', link: '/tutorials/02-rabbitmq-dlx-recipe' },
            { text: '03 — Rust contract test from zero', link: '/tutorials/03-rust-contract-from-zero' },
            { text: '04 — Next.js Server Actions', link: '/tutorials/04-nextjs-server-actions' },
            { text: '05 — Multi-provider auth', link: '/tutorials/05-multi-provider-auth' },
          ],
        },
        {
          text: 'AI-LLM (v1.12)',
          items: [
            { text: '06 — Anthropic chatbot streaming + tool_use', link: '/tutorials/06-anthropic-chatbot-streaming' },
            { text: '07 — OpenAI tool-use agent', link: '/tutorials/07-openai-tool-agent' },
            { text: '08 — Vercel AI SDK + LangChain RAG', link: '/tutorials/08-vercel-ai-rag' },
          ],
        },
        {
          text: 'Realtime (v1.13)',
          items: [
            { text: '09 — Supabase Realtime chat + presence + typing debounce', link: '/tutorials/09-supabase-realtime-chat' },
            { text: '10 — Ably shared cursor + 60 fps throttle + history rewind', link: '/tutorials/10-ably-collab-cursor' },
            { text: '11 — Socket.io notification + reconnect + backpressure', link: '/tutorials/11-socketio-notification' },
          ],
        },
        {
          text: '横軸拡張 (v1.14)',
          items: [
            { text: '12 — Payment webhook mock (Stripe / Paddle / Lemon Squeezy)', link: '/tutorials/12-payment' },
            { text: '13 — Search mock (Meilisearch / Algolia / Typesense)', link: '/tutorials/13-search' },
            { text: '14 — Telemetry mock (OpenTelemetry / Datadog / Sentry)', link: '/tutorials/14-observability' },
            { text: '15 — kiwa-test-go v0.5 Iris + Chi', link: '/tutorials/15-go-iris-chi' },
          ],
        },
        {
          text: 'AI-LLM 深化 (v1.15)',
          items: [
            { text: '16 — Multimodal chat (image + audio + Whisper)', link: '/tutorials/16-multimodal-chat' },
            { text: '17 — MCP tool-use agent (JSON-RPC 2.0 chain)', link: '/tutorials/17-mcp-tool-agent' },
            { text: '18 — Agent orchestration (LangGraph + Assistants v2)', link: '/tutorials/18-agent-orchestration' },
          ],
        },
        {
          text: 'Component test (v1.16)',
          items: [
            { text: '19 — Storybook 8 design system', link: '/tutorials/19-storybook-design-system' },
            { text: '20 — Playwright CT for 5 form patterns', link: '/tutorials/20-playwright-ct' },
            { text: '21 — Visual regression baseline / diff / accept', link: '/tutorials/21-visual-regression' },
          ],
        },
        {
          text: 'Observability v2 (v1.17)',
          items: [
            { text: '22 — Observability dashboard (panel + refresh + badge)', link: '/tutorials/22-observability-dashboard' },
            { text: '23 — Alert orchestrator (rule + route + silence + escalation)', link: '/tutorials/23-alert-orchestrator' },
            { text: '24 — Trace flame graph (span tree + drill-down + log correlation)', link: '/tutorials/24-trace-flame-graph' },
          ],
        },
        {
          text: 'Blockchain 深化 (v1.18)',
          items: [
            { text: '25 — Reth node test (dev chain + reorg + fidelity matrix)', link: '/tutorials/25-reth-node-test' },
            { text: '26 — Foundry invariant + fuzz runner (10 000 runs + shrink parser)', link: '/tutorials/26-foundry-invariant-fuzz' },
            { text: '27 — dApp e2e reorg (snapshot + revert + refetch across 4 scenarios)', link: '/tutorials/27-dapp-e2e-reorg' },
          ],
        },
        {
          text: 'Framework 深化 (v1.19)',
          items: [
            { text: '28 — SolidJS Signal + Effect + Resource + Suspense (fine-grained reactivity)', link: '/tutorials/28-solidjs-signal-app' },
            { text: '29 — Fresh Islands + Route Handler + Head normalize (Deno partial hydration)', link: '/tutorials/29-fresh-islands' },
            { text: '30 — HonoJS + hc RPC type-safe client + Workers env (KV / D1 / R2)', link: '/tutorials/30-hono-workers-rpc' },
          ],
        },
        {
          text: 'Streaming 深化 (v1.20)',
          items: [
            { text: '31 — Kafka event pipeline (producer + consumer group + exactly-once + DLQ)', link: '/tutorials/31-kafka-event-pipeline' },
            { text: '32 — Redpanda + schema registry (Avro schemas + evolution + compatibility)', link: '/tutorials/32-redpanda-schema-registry' },
            { text: '33 — NATS JetStream (persistent streams + KV + Object store + subject routing)', link: '/tutorials/33-nats-jetstream' },
          ],
        },
        {
          text: 'Auth 深化 (v1.21)',
          items: [
            { text: '34 — WebAuthn L3 + Passkey (virtual authenticator + attestation + sync fabric)', link: '/tutorials/34-webauthn-passkey' },
            { text: '35 — OAuth 2.1 provider (PKCE + DPoP + refresh rotation + revocation)', link: '/tutorials/35-oauth21-provider' },
            { text: '36 — OIDC provider + Federation (Discovery + DCR + id_token + trust chain)', link: '/tutorials/36-oidc-federation' },
          ],
        },
        {
          text: 'Real driver (v1.22)',
          items: [
            { text: '37 — Real driver testing (Keycloak + oauth2-mock-server testcontainers)', link: '/tutorials/37-real-driver-testing' },
            { text: '38 — Passkey caBLE hybrid transport (QR + BLE + WebSocket tunnel)', link: '/tutorials/38-passkey-cable-flow' },
          ],
        },
        {
          text: 'Payment 深化 (v1.23)',
          items: [
            { text: '39 — Stripe advanced billing (subscription + 3DS + dunning)', link: '/tutorials/39-stripe-billing' },
            { text: '40 — Paddle merchant-of-record (inline checkout + tier + VAT/GST auto-calc)', link: '/tutorials/40-paddle-merchant' },
            { text: '41 — Lemon Squeezy refund + chargeback dispute lifecycle', link: '/tutorials/41-lemon-squeezy-license' },
          ],
        },
        {
          text: 'Edge/Serverless 深化 (v1.24)',
          items: [
            { text: '42 — Cloudflare Workers Durable Object (realtime chat + Hibernation + storage)', link: '/tutorials/42-cloudflare-durable-object' },
            { text: '43 — Vercel Edge streaming (Next.js 15 middleware + geo routing + SSE backpressure)', link: '/tutorials/43-vercel-edge-streaming' },
            { text: '44 — Deno Deploy geo (Deno KV + read-your-writes + Cron trigger)', link: '/tutorials/44-deno-deploy-geo' },
          ],
        },
      ],
      '/concepts/': [
        {
          text: 'Concepts',
          items: [
            { text: 'AI-LLM testing (non-determinism SSOT)', link: '/concepts/ai-llm-testing' },
            { text: 'AI-LLM multimodal testing (image + audio + MCP + agent SSOT)', link: '/concepts/ai-llm-multimodal-testing' },
            { text: 'Realtime testing (time-axis mock SSOT)', link: '/concepts/realtime-testing' },
            { text: 'Payment testing (webhook signature SSOT)', link: '/concepts/payment-testing' },
            { text: 'Search testing (ranking + typo tolerance SSOT)', link: '/concepts/search-testing' },
            { text: 'Telemetry testing (span + metric + log aggregation SSOT)', link: '/concepts/telemetry-testing' },
            { text: 'Component testing (story + CT + visual diff SSOT)', link: '/concepts/component-testing' },
            { text: 'Observability v2 testing (dashboard + alert + trace + correlation SSOT)', link: '/concepts/observability-v2-testing' },
            { text: 'Blockchain testing (chain state / EL client / fuzz / reorg SSOT)', link: '/concepts/blockchain-testing' },
            { text: 'Modern web framework testing (Signal reactivity / Islands / edge runtime + RPC type-safety SSOT)', link: '/concepts/modern-web-framework-testing' },
            { text: 'Streaming testing (producer / consumer / exactly-once / DLQ / schema-registry SSOT)', link: '/concepts/streaming-testing' },
            { text: 'Auth protocol testing (virtual authenticator / PKCE+DPoP / id_token / discovery+federation SSOT)', link: '/concepts/auth-protocol-testing' },
            { text: 'Real driver testing (mock only / real-optional / real-required 3 execution modes SSOT)', link: '/concepts/real-driver-testing' },
            { text: 'Advanced billing semantics (9-axis SSOT — dunning / retry / 3DS / SCA / PSD2 / subscription / invoice / tax / chargeback)', link: '/concepts/billing-semantics' },
            { text: 'Edge runtime testing (8-axis SSOT — Durable Object / WebSocket / edge KV / geo-replicated / Cron / subrequest / CPU / streaming)', link: '/concepts/edge-runtime-testing' },
          ],
        },
      ],
      '/migrations/': [
        {
          text: 'Migration guides',
          items: [
            { text: 'Overview', link: '/migrations/' },
            { text: 'v1.9 → v1.10', link: '/migrations/v1.9-to-v1.10' },
            { text: 'v1.10 → v1.11', link: '/migrations/v1.10-to-v1.11' },
            { text: 'v1.11 → v1.12', link: '/migrations/v1.11-to-v1.12' },
            { text: 'v1.12 → v1.13', link: '/migrations/v1.12-to-v1.13' },
            { text: 'v1.13 → v1.14', link: '/migrations/v1.13-to-v1.14' },
            { text: 'v1.14 → v1.15', link: '/migrations/v1.14-to-v1.15' },
            { text: 'v1.15 → v1.16', link: '/migrations/v1.15-to-v1.16' },
            { text: 'v1.16 → v1.17', link: '/migrations/v1.16-to-v1.17' },
            { text: 'v1.17 → v1.18', link: '/migrations/v1.17-to-v1.18' },
            { text: 'v1.18 → v1.19', link: '/migrations/v1.18-to-v1.19' },
            { text: 'v1.19 → v1.20', link: '/migrations/v1.19-to-v1.20' },
            { text: 'v1.20 → v1.21', link: '/migrations/v1.20-to-v1.21' },
            { text: 'v1.21 → v1.22', link: '/migrations/v1.21-to-v1.22' },
            { text: 'v1.22 → v1.23', link: '/migrations/v1.22-to-v1.23' },
            { text: 'v1.23 → v1.24', link: '/migrations/v1.23-to-v1.24' },
          ],
        },
      ],
      '/quality/': [
        {
          text: 'Quality',
          items: [
            { text: 'Release gate SSOT', link: '/quality/release-gate' },
            { text: 'Quality reports', link: '/quality-reports/' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'TypeScript (typedoc)', link: '/api/typescript/' },
            { text: 'Rust (cargo doc)', link: '/api/rust/kiwa/' },
            { text: 'Solidity (forge doc)', link: '/api/solidity/dogfood-foundry-dapp/' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/cardene777/kiwa' },
      { icon: 'x', link: 'https://x.com/cardene777' },
    ],

    editLink: {
      pattern: 'https://github.com/cardene777/kiwa/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: `© ${new Date().getFullYear()} cardene`,
    },

    search: {
      // MiniSearch — bundled with VitePress. Free-tier friendly.
      provider: 'local',
      options: {
        detailedView: true,
        translations: {
          button: { buttonText: 'Search kiwa docs' },
        },
      },
    },
  },
});
