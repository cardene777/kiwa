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
        {
          text: 'Perf-harness sweep (v1.25)',
          items: [
            { text: '45 — Perf-harness baseline (p95 baseline + regression detection walkthrough)', link: '/tutorials/45-perf-harness-baseline' },
            { text: '46 — Perf baseline migration (3 package → 33 package transfer methodology)', link: '/tutorials/46-perf-baseline-migration' },
          ],
        },
        {
          text: 'Database 深化 (v1.26)',
          items: [
            { text: '47 — Postgres CDC + outbox pattern (change data capture walkthrough)', link: '/tutorials/47-postgres-cdc-outbox' },
            { text: '48 — MySQL RLS + multi-tenant (row-level security walkthrough)', link: '/tutorials/48-mysql-rls-tenant' },
            { text: '49 — pgvector + hybrid search (semantic + keyword retrieval walkthrough)', link: '/tutorials/49-vector-search-pgvector' },
          ],
        },
        {
          text: 'Mutation testing sweep (v1.27)',
          items: [
            { text: '50 — Mutation testing baseline (Stryker + kill-rate baseline + tier gate walkthrough)', link: '/tutorials/50-mutation-testing-baseline' },
            { text: '51 — Mutation baseline migration (22 → 33 package sweep methodology)', link: '/tutorials/51-mutation-baseline-migration' },
          ],
        },
        {
          text: 'Advanced realtime transport (v1.28)',
          items: [
            { text: '52 — WebRTC video call (signaling + ICE + simulcast + ICE restart walkthrough)', link: '/tutorials/52-webrtc-video-signaling' },
            { text: '53 — WebTransport stream (uni / bi / Datagram / migration walkthrough)', link: '/tutorials/53-webtransport-stream' },
            { text: '54 — HTTP/3 multiplex (stream priority + HPACK + 0-RTT walkthrough)', link: '/tutorials/54-http3-multiplex' },
          ],
        },
        {
          text: 'Release invariants (v1.29)',
          items: [
            { text: '55 — Release script filter SSOT (systematic root cause pattern walkthrough)', link: '/tutorials/55-release-script-filter-ssot' },
          ],
        },
        {
          text: 'A11y sweep (v1.30)',
          items: [
            { text: '56 — A11y baseline (axe-core + WCAG 2.1 AA gate + 3-layer harness walkthrough)', link: '/tutorials/56-a11y-baseline' },
            { text: '57 — A11y baseline migration (0 → 34 package sweep methodology)', link: '/tutorials/57-a11y-baseline-migration' },
          ],
        },
        {
          text: 'Streaming 深化 II (v1.31)',
          items: [
            { text: '58 — Kafka raw protocol (KIP-98 idempotent + txn coordinator + fetch session + ISR walkthrough)', link: '/tutorials/58-kafka-raw-protocol' },
            { text: '59 — Redpanda schema evolution (BACKWARD / FORWARD / FULL + subject naming + references walkthrough)', link: '/tutorials/59-redpanda-schema-evolution' },
            { text: '60 — NATS JetStream durable consumer (ack_wait + max_deliver + backoff + quarantine walkthrough)', link: '/tutorials/60-nats-jetstream-durable' },
          ],
        },
        {
          text: 'Database 深化 II (v1.32)',
          items: [
            { text: '61 — Postgres logical replication advanced (streaming + origin + two-safe + cascade walkthrough)', link: '/tutorials/61-postgres-logical-replication-advanced' },
            { text: '62 — MySQL group replication (member join + primary election + conflict detection + member leave walkthrough)', link: '/tutorials/62-mysql-group-replication' },
            { text: '63 — SQLite WAL + FTS5 (journal_mode + checkpoint + virtual table + tokenizer + BM25 rank walkthrough)', link: '/tutorials/63-sqlite-wal-fts5' },
          ],
        },
        {
          text: 'Payment 深化 II (v1.33)',
          items: [
            { text: '64 — Payment orchestration (multi-provider routing + failover + retry ladder + circuit breaker walkthrough)', link: '/tutorials/64-payment-orchestration' },
            { text: '65 — Stripe Connect marketplace (dispute + refund + webhook idempotency + DAC7 walkthrough)', link: '/tutorials/65-stripe-connect-marketplace' },
            { text: '66 — Paddle Billing v2 (grace period + proration + coupon stacking + recovery + vault migration walkthrough)', link: '/tutorials/66-paddle-billing-v2' },
          ],
        },
        {
          text: 'Frontend 深化 (v1.34)',
          items: [
            { text: '67 — RSC streaming SSR (Server Components + Suspense + selective hydration + view transitions walkthrough)', link: '/tutorials/67-rsc-streaming-ssr' },
            { text: '68 — Server Action + optimistic UI (form action + useFormStatus + useOptimistic + revalidatePath + revalidateTag + redirect walkthrough)', link: '/tutorials/68-server-action-optimistic' },
            { text: '69 — Storybook 8 MDX (CSF3 + MDX doc + interaction runner + coverage report walkthrough)', link: '/tutorials/69-storybook-8-mdx' },
          ],
        },
        {
          text: 'Observability 深化 (v1.35)',
          items: [
            { text: '70 — SLO burn rate (error budget + multi-window multi-burn-rate alert walkthrough)', link: '/tutorials/70-slo-burn-rate' },
            { text: '71 — OpenTelemetry exemplar (trace-to-metric + metric-to-trace + baggage + W3C context walkthrough)', link: '/tutorials/71-otel-exemplar' },
            { text: '72 — Continuous profiling (CPU + memory + off-CPU flame graph + depth-first flatten walkthrough)', link: '/tutorials/72-continuous-profiling' },
          ],
        },
        {
          text: 'Search 深化 (v1.36)',
          items: [
            { text: '73 — Vector search (kNN + HNSW + hybrid fusion + recall@k walkthrough)', link: '/tutorials/73-vector-search-hybrid' },
            { text: '74 — Faceted geo search (nested facet + bounding box + radius + polygon + isochrone walkthrough)', link: '/tutorials/74-faceted-geo-search' },
            { text: '75 — OpenSearch relevance tuning (BM25 + TF-IDF + custom ranking + A/B + synonym advanced + rolling reindex walkthrough)', link: '/tutorials/75-opensearch-relevance-tuning' },
          ],
        },
        {
          text: 'Security 深化 (v1.37)',
          items: [
            { text: '76 — CSP strict-dynamic (nonce + hash + strict-dynamic + trusted-types + report-only walkthrough)', link: '/tutorials/76-csp-strict-dynamic' },
            { text: '77 — RBAC + ABAC policy (role hierarchy + combining algorithms + combined RBAC + ABAC walkthrough)', link: '/tutorials/77-rbac-abac-policy' },
            { text: '78 — SBOM + license + secrets scanning (CycloneDX + SPDX + OSV advisory + Gitleaks entropy gate walkthrough)', link: '/tutorials/78-sbom-license-scanning' },
          ],
        },
        {
          text: 'AI-LLM 深化 (v1.38)',
          items: [
            { text: '79 — Prompt injection defense (direct + indirect + jailbreak + role-hijack + Constitutional AI + PII redaction walkthrough)', link: '/tutorials/79-prompt-injection-defense' },
            { text: '80 — LLM eval + hallucination (self-consistency + factuality + citation + LLM-as-judge + rubric + preference + Elo walkthrough)', link: '/tutorials/80-llm-eval-hallucination' },
            { text: '81 — Agent orchestration (ReAct + ToT + reflection + tool selection + budget + latency + routing + fallback walkthrough)', link: '/tutorials/81-agent-orchestration' },
          ],
        },
        {
          text: 'Security 深化 II (v1.39)',
          items: [
            { text: '82 — mTLS + Zero-trust (handshake + SPKI pin + OCSP + CT + device posture + risk score + JIT + micro-segmentation walkthrough)', link: '/tutorials/82-mtls-zero-trust' },
            { text: '83 — SIEM audit + Incident response (structured logging + tamper-evident seal + retention + correlation + playbook + severity + escalation + forensics + post-mortem walkthrough)', link: '/tutorials/83-siem-incident-response' },
            { text: '84 — Supply chain SLSA (SLSA level verification + reproducible build + signed provenance + attestation walkthrough)', link: '/tutorials/84-supply-chain-slsa' },
          ],
        },
        {
          text: 'AI-LLM 深化 III (v1.40)',
          items: [
            { text: '85 — Multi-agent orchestration + Agent swarm (CrewAI + LangGraph supervisor + role-based swarm + PBFT-lite Byzantine consensus walkthrough)', link: '/tutorials/85-multi-agent-swarm' },
            { text: '86 — Code interpreter + Fine-tuning pipeline (sandboxed REPL + tool use + rollback + RLHF/DPO + drift detection walkthrough)', link: '/tutorials/86-code-interpreter-fine-tuning' },
            { text: '87 — LLM ops + Prompt engineering + RAG III + Cost optimization (model registry + rollout + A/B + canary + shadow + CoT + few-shot + caching + versioning + GraphRAG + agentic + self-query + parent doc + batch + cascade + semantic cache walkthrough)', link: '/tutorials/87-llm-ops-rag-iii-cost' },
          ],
        },
        {
          text: 'Payment 深化 III (v1.41)',
          items: [
            { text: '88 — Embedded finance + BNPL (BaaS + card + KYC/KYB + installment + risk + late fee walkthrough)', link: '/tutorials/88-embedded-finance-bnpl' },
            { text: '89 — Crypto payment + FX cross-border (stablecoin + on-chain + gas abstraction + rate lock + SWIFT/SEPA walkthrough)', link: '/tutorials/89-crypto-payment-fx' },
            { text: '90 — Recurring revenue + Orchestration II + Fraud detection + Regulatory reporting (MRR/NRR + smart route + ML fraud + PCI/PSD2/DORA/SAR walkthrough)', link: '/tutorials/90-recurring-orchestration-fraud-regulatory' },
          ],
        },
        {
          text: 'Observability 深化 III (v1.42)',
          items: [
            { text: '91 — IaC + Service mesh + eBPF profiling III (Terraform drift + OPA policy + Istio/Linkerd mTLS + sidecar + circuit breaker + user-space + kernel + LSM + syscall + network flow walkthrough)', link: '/tutorials/91-iac-servicemesh-ebpf' },
            { text: '92 — LLM observability + FinOps (token counting + prompt log + hallucination detection + budget check + cost per request + team attribution + rightsizing + spot optimization walkthrough)', link: '/tutorials/92-llm-observability-finops' },
            { text: '93 — Chaos engineering + Data pipeline + AIOps (fault injection + blast radius + auto-rollback + game day + lineage capture + freshness + schema drift + data quality + anomaly + auto-remediation + RCA + alert correlation walkthrough)', link: '/tutorials/93-chaos-datapipeline-aiops' },
          ],
        },
        {
          text: 'Edge / Serverless 深化 (v1.43)',
          items: [
            { text: '94 — Serverless cold-start (cold path + warm pool + provisioned concurrency + latency observability walkthrough)', link: '/tutorials/94-serverless-cold-start' },
            { text: '95 — DurableObject state migration (schema versioning + data migrate + zero-downtime rollout + rollback walkthrough)', link: '/tutorials/95-durable-object-migration' },
            { text: '96 — Global routing (Anycast + geo matching + latency-based failover + D1 read replica affinity walkthrough)', link: '/tutorials/96-global-routing' },
          ],
        },
        {
          text: 'Auth Passwordless UX III 深化 (v1.44)',
          items: [
            { text: '97 — Passwordless UX (device-bound passkey + conditional UI + cross-device flow walkthrough)', link: '/tutorials/97-passwordless-ux' },
            { text: '98 — Step-up MFA (AAL escalation + trust cache + auth continuity walkthrough)', link: '/tutorials/98-step-up-mfa' },
            { text: '99 — Risk-based auth (score aggregation + policy + telemetry + hijack detection walkthrough)', link: '/tutorials/99-risk-based-auth' },
          ],
        },
        {
          text: 'Realtime III 深化 (v1.45)',
          items: [
            { text: '100 — MoQ + WebCodecs (Media over QUIC track delivery + hardware encode + Simulcast/SVC walkthrough)', link: '/tutorials/100-moq-webcodecs' },
            { text: '101 — Voice streaming (LLM voice + Whisper ASR + realtime AI inference walkthrough)', link: '/tutorials/101-voice-streaming' },
            { text: '102 — SVC adaptive (SVC layer selection + WebCodecs decoder + MoQ datagram FEC walkthrough)', link: '/tutorials/102-svc-adaptive' },
          ],
        },
        {
          text: 'Quality gate integrity + DevSecOps library (v1.46)',
          items: [
            { text: '103 — DevSecOps 6 axis (SAST + SCA + Secret + IaC + DAST + Container walkthrough)', link: '/tutorials/103-security-devsecops' },
            { text: '104 — Perf strict mode (iter 400 + Welch |t|>3 + delta 10% + fail-fast release gate walkthrough)', link: '/tutorials/104-perf-strict' },
          ],
        },
        {
          text: 'DevSecOps adapter integration Phase 2 (v1.47)',
          items: [
            { text: '105 — DevSecOps adapter (6 axis × mock/real pair + env-gate + fidelity harness walkthrough)', link: '/tutorials/105-security-adapter' },
          ],
        },
        {
          text: 'DevSecOps orchestrator Phase 3 (v1.48)',
          items: [
            { text: '106 — DevSecOps single entry (runSecurityAudit + 4 preset + summary walkthrough)', link: '/tutorials/106-security-orchestrator' },
          ],
        },
        {
          text: 'Frontend 深化 III (v1.49、 pair 3 段拡張 4 例目)',
          items: [
            { text: '107 — RSC + Server Actions v2 (React 19 Actions + server-action-advanced walkthrough)', link: '/tutorials/107-rsc-server-actions-v2' },
            { text: '108 — View Transitions + Concurrent React (interrupt-and-restart walkthrough)', link: '/tutorials/108-view-transitions-concurrent' },
            { text: '109 — Islands + Turbopack HMR + PE (Islands architecture + fast refresh walkthrough)', link: '/tutorials/109-islands-turbopack-hmr' },
          ],
        },
        {
          text: 'Mobile new-base pair 第 13 (v1.50、 41 package 到達)',
          items: [
            { text: '110 — Mobile testing baseline (React Native + Expo + Metro walkthrough)', link: '/tutorials/110-mobile-testing' },
          ],
        },
        {
          text: 'Mobile 深化 II (v1.51、 pair 第 13 の 2 段目 Phase 2)',
          items: [
            { text: '111 — Mobile advanced II (navigation + reanimated + async-storage + secure-storage walkthrough + real driver env-gate)', link: '/tutorials/111-mobile-advanced' },
          ],
        },
        {
          text: 'Mobile 深化 III (v1.52、 pair 第 13 の 3 段目 Phase 3、 3 段拡張達成 5 例目 pair 深度 3 段記録、 30 milestone streak 突入)',
          items: [
            { text: '112 — Mobile New Architecture (fabric + turbo-modules + codegen + new-architecture walkthrough)', link: '/tutorials/112-mobile-new-architecture' },
          ],
        },
        {
          text: 'Mobile 深化 IV (v1.53、 pair 第 13 の 4 段目 Phase 4、 pair 深度 4 段拡張達成 4 例目 depth-4 record、 31 milestone streak)',
          items: [
            { text: '113 — Mobile real driver adapter (11 axis × mock/real + fidelity harness walkthrough)', link: '/tutorials/113-mobile-real-driver' },
          ],
        },
        {
          text: 'Mobile 深化 V (v1.54、 pair 第 13 の 5 段目 Phase 5、 pair 深度 5 段拡張 1 例目 candidate depth-5 pattern 新設、 32 milestone streak)',
          items: [
            { text: '114 — Mobile v0.5 spawn stub (child_process.spawn 契約層 + 6 CLI stub + env-gate + fail-closed walkthrough)', link: '/tutorials/114-mobile-real-cli' },
          ],
        },
        {
          text: 'Mobile 深化 VI (v1.55、 pair 第 13 の 6 段目 Phase 6、 depth-5 pattern 実装完成 kiwa milestone 史上初 6 段拡張、 33 milestone streak)',
          items: [
            { text: '115 — Mobile v0.6 real child_process.spawn (dry-run + DI + sanitize + safety guards walkthrough)', link: '/tutorials/115-mobile-v06-spawn' },
          ],
        },
        {
          text: 'Desktop new-base pair 第 14 (v1.56、 42 package 到達、 v2.0 milestone desktop adapter goal 達成、 34 milestone streak)',
          items: [
            { text: '116 — Desktop testing baseline (Electron + Tauri + Webview walkthrough)', link: '/tutorials/116-desktop-testing' },
          ],
        },
        {
          text: 'Desktop 深化 I (v1.57、 v0.2 advanced 5 axis、 systematic pattern 32 度目、 35 milestone streak)',
          items: [
            { text: '117 — Desktop advanced axis (Auto-updater + FS permissions + Notification + Menu-bar + Tray-icon walkthrough)', link: '/tutorials/117-desktop-advanced-axis' },
          ],
        },
        {
          text: 'Desktop 深化 II (v1.58、 v0.3 advanced III 4 axis、 systematic pattern 33 度目、 36 milestone streak、 Mobile v1.50-v1.52 rhythm 再現)',
          items: [
            { text: '118 — Desktop advanced III (Screen recording + Global shortcut + Clipboard + Dark-mode walkthrough)', link: '/tutorials/118-desktop-advanced-iii' },
          ],
        },
        {
          text: 'Desktop 深化 III (v1.59、 v0.4 adapter layer + fidelity harness、 systematic pattern 34 度目、 37 milestone streak、 depth-4 record 5 例目、 Mobile v1.53 rhythm 再現)',
          items: [
            { text: '119 — Desktop adapter layer (AdapterInvocation + AdapterResult + MOCK/REAL_ADAPTERS + fidelity harness walkthrough)', link: '/tutorials/119-desktop-adapter-layer' },
          ],
        },
        {
          text: 'Desktop 深化 IV (v1.60、 v0.5 spawn stub 契約層、 systematic pattern 35 度目、 38 milestone streak、 depth-5 pattern 2 例目 candidate、 Mobile v1.54 rhythm 再現)',
          items: [
            { text: '120 — Desktop spawn stub (invokeDesktopCli + cliForAxis + buildSpawnInvocation + env-gate + fail-closed walkthrough)', link: '/tutorials/120-desktop-spawn-stub' },
          ],
        },
        {
          text: 'Desktop 深化 V (v1.61、 v0.6 実 spawn 実装完成、 systematic pattern 36 度目、 39 milestone streak、 depth-5 pattern 2 例目確定 + depth-6 pattern 新設 kiwa milestone 史上初、 Mobile v1.55 rhythm 再現)',
          items: [
            { text: '121 — Desktop v0.6 実 spawn (spawn-executor + per-command env allowlist + timeout + buffer 上限 + DI + dry-run walkthrough)', link: '/tutorials/121-desktop-v06-spawn' },
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
            { text: 'Perf-testing SSOT (p50 / p95 / p99 + baseline persistence + regression detection + 3-layer harness + 33 package coverage)', link: '/concepts/perf-testing-ssot' },
            { text: 'Db advanced testing SSOT (8 axis — replication / CDC / logical replication / MVCC / RLS / connection pool / partitioning / vector store)', link: '/concepts/db-advanced-testing' },
            { text: 'Mutation testing SSOT (kill rate + 4-tier threshold + baseline persistence + 12-axis release gate)', link: '/concepts/mutation-testing-ssot' },
            { text: 'WebRTC / WebTransport / HTTP/3 testing (8-axis SSOT + P2P vs SFU + ICE trickle vs half-trickle + WebTransport vs WebSocket)', link: '/concepts/webrtc-webtransport-testing' },
            { text: 'Release invariants (3-invariant SSOT — release script filter symmetry + provenance flag absence + gate script package coverage)', link: '/concepts/release-invariants' },
            { text: 'A11y testing SSOT (WCAG 2.1 AA + 4-tier threshold + baseline persistence + 3-layer harness + 13-axis release gate)', link: '/concepts/a11y-testing-ssot' },
            { text: 'Streaming real-driver testing (8 axis SSOT + 3 provider × 8 axis = 24 cell grid + testcontainers pattern + KIWA_MODE=real env-gate)', link: '/concepts/streaming-real-driver-testing' },
            { text: 'Database real-driver testing (16 axis SSOT + 3 provider × 3 backend × 16 axis = 144 cell grid + testcontainers pattern + KIWA_MODE=real env-gate)', link: '/concepts/database-real-driver-testing' },
            { text: 'Payment real-driver testing (8 axis SSOT + 3 provider × 8 axis = 24 cell grid + testcontainers-shaped env-gate pattern + KIWA_MODE=real env-gate)', link: '/concepts/payment-real-driver-testing' },
            { text: 'Frontend real-driver testing (8 axis SSOT + 3 target × 8 axis = 24 cell grid + browser-shaped env-gate pattern + KIWA_MODE=real env-gate)', link: '/concepts/frontend-real-driver-testing' },
            { text: 'Observability real-driver testing (8 axis SSOT + 4 provider × 8 axis = 32 cell grid + provider _URL env-gate pattern + KIWA_MODE=real env-gate)', link: '/concepts/observability-real-driver-testing' },
            { text: 'Search real-driver testing (8 axis SSOT + 4 provider × 8 axis = 32 cell grid + provider _URL / _KEY env-gate pattern + KIWA_MODE=real env-gate)', link: '/concepts/search-real-driver-testing' },
            { text: 'Security real-driver testing (8 axis SSOT + 4 provider × 8 axis = 32 cell grid + provider _URL / _PATH env-gate pattern + KIWA_MODE=real env-gate)', link: '/concepts/security-real-driver-testing' },
            { text: 'AI-LLM real-driver testing (8 axis SSOT + 4 provider × 8 axis = 32 cell grid + provider _API_KEY + KIWA_LLM_BUDGET_USD budget guard + KIWA_MODE=real env-gate)', link: '/concepts/ai-llm-real-driver-testing' },
            { text: 'Security advanced II testing (v0.2 8 axis SSOT + 4 provider × 8 axis = 32 advanced cell grid + provider _URL / _TOKEN env-gate pattern + KIWA_MODE=real env-gate)', link: '/concepts/security-advanced-II-testing' },
            { text: 'AI-LLM advanced III testing (v0.5 8 axis SSOT + 4 provider × 8 axis = 32 advanced III cell grid + 16-axis combined harness + pair 深度 4 段 record + KIWA_MODE=real env-gate)', link: '/concepts/ai-llm-advanced-III-testing' },
            { text: 'Payment advanced III testing (v0.5 8 axis SSOT + 3 provider × 8 axis = 24 advanced III cell grid + 25-axis combined harness + pair 深度 4 段 2 例目 record + KIWA_MODE=real env-gate)', link: '/concepts/payment-advanced-III-testing' },
            { text: 'Observability advanced III testing (v2.2 8 axis SSOT + 4 provider × 8 axis = 32 advanced III cell grid + 16-axis combined harness + pair 深度 4 段 3 例目 record + KIWA_MODE=real env-gate)', link: '/concepts/observability-advanced-III-testing' },
            { text: 'Edge / Serverless advanced testing (v1.2 8 axis SSOT + 3 platform × 8 axis = 24 advanced cell grid + 16-axis combined harness + pair 第 12 新規 base pair 導入 + KIWA_MODE=real env-gate)', link: '/concepts/edge-serverless-advanced-testing' },
            { text: 'Auth advanced III testing (v0.6 8 axis SSOT + 3 platform × 8 axis = 24 advanced cell grid + pair 第 1 pair 3 段拡張達成 record + KIWA_MODE=real env-gate)', link: '/concepts/auth-advanced-III-testing' },
            { text: 'Realtime advanced III testing (v0.3 8 axis SSOT + 3 protocol MoQ / WebCodecs / AI-media × 8 axis + pair 第 2 pair 3 段拡張達成 record + KIWA_MODE=real env-gate)', link: '/concepts/realtime-advanced-III-testing' },
            { text: 'DevSecOps library integration (v0.1 6 axis SAST + SCA + Secret + IaC + DAST + Container + 4 skill 置換 pattern SSOT + 段階的移行 Phase 1-3)', link: '/concepts/security-devsecops-library-integration' },
            { text: 'Frontend advanced III testing (v1.49 6 axis SSOT + pair 深度 3 段 4 例目)', link: '/concepts/frontend-advanced-III-testing' },
            { text: 'Mobile testing baseline (v1.50 3 axis SSOT + new-base pair 第 13 + 41 package 到達)', link: '/concepts/mobile-testing-baseline' },
            { text: 'Mobile testing advanced II (v1.51 7 axis SSOT + real driver env-gate + pair 第 13 2 段目)', link: '/concepts/mobile-testing-advanced' },
            { text: 'Mobile testing advanced III (v1.52 11 axis SSOT + pair 深度 3 段記録 5 例目 + 30 milestone streak 突入)', link: '/concepts/mobile-testing-advanced-III' },
            { text: 'Mobile real driver adapter (v1.53 adapter interface SSOT + 66 combination + pair 深度 4 段記録 4 例目 depth-4)', link: '/concepts/mobile-testing-real-driver' },
            { text: 'Mobile spawn stub 契約層 (v1.54 spawn-driver SSOT + 6 CLI stub + pair 深度 5 段拡張 1 例目 candidate depth-5 pattern 新設)', link: '/concepts/mobile-testing-real-cli' },
            { text: 'Mobile v0.6 実 child_process.spawn (v1.55 spawn-executor SSOT + per-command allowlist + dry-run + DI + safety guards + depth-5 pattern 実装完成 kiwa milestone 史上初 6 段拡張)', link: '/concepts/mobile-testing-v06-spawn' },
            { text: 'Desktop testing baseline (v1.56 3 axis SSOT + new-base pair 第 14 + 42 package 到達 + v2.0 milestone desktop adapter goal 達成)', link: '/concepts/desktop-testing-baseline' },
            { text: 'Desktop advanced axis (v1.57 v0.2 5 axis SSOT + auto-updater + fs-permissions + notification + menu-bar + tray-icon + 24 spec fidelity grid + systematic pattern 32 度目)', link: '/concepts/desktop-advanced-axis' },
            { text: 'Desktop advanced III (v1.58 v0.3 4 axis SSOT + screen-recording + global-shortcut + clipboard + dark-mode + 36 spec fidelity grid + systematic pattern 33 度目 + Mobile v1.50-v1.52 rhythm 再現)', link: '/concepts/desktop-advanced-iii' },
            { text: 'Desktop adapter layer (v1.59 v0.4 adapter interface + fidelity harness SSOT + 24 adapter pair + 72 combination + 36 fidelity pair + systematic pattern 34 度目 + Mobile v1.53 rhythm 再現 + depth-4 record 5 例目)', link: '/concepts/desktop-adapter-layer' },
            { text: 'Desktop spawn stub 契約層 (v1.60 v0.5 8 CLI stub SSOT + 12 axis → 8 CLI + 4 non-CLI mapping + KIWA_DESKTOP_MODE env-gate + args 上限 32 + fail-closed + systematic pattern 35 度目 + Mobile v1.54 rhythm 再現 + depth-5 pattern 2 例目 candidate)', link: '/concepts/desktop-spawn-stub' },
            { text: 'Desktop v0.6 実 spawn (v1.61 spawn-executor 3 type SSOT + per-command env allowlist 8 CLI × env + safety layer 4 段 + invokeDesktopCli 3 経路分岐 + DI 経路 + KIWA_DESKTOP_SPAWN=dry-run + shape 契約 preserving + systematic pattern 36 度目 + Mobile v1.55 rhythm 再現 + depth-5 2 例目確定 + depth-6 新設 kiwa milestone 史上初)', link: '/concepts/desktop-v06-spawn' },
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
            { text: 'v1.24 → v1.25', link: '/migrations/v1.24-to-v1.25' },
            { text: 'v1.25 → v1.26', link: '/migrations/v1.25-to-v1.26' },
            { text: 'v1.26 → v1.27', link: '/migrations/v1.26-to-v1.27' },
            { text: 'v1.27 → v1.28', link: '/migrations/v1.27-to-v1.28' },
            { text: 'v1.28 → v1.29', link: '/migrations/v1.28-to-v1.29' },
            { text: 'v1.29 → v1.30', link: '/migrations/v1.29-to-v1.30' },
            { text: 'v1.30 → v1.31', link: '/migrations/v1.30-to-v1.31' },
            { text: 'v1.31 → v1.32', link: '/migrations/v1.31-to-v1.32' },
            { text: 'v1.32 → v1.33', link: '/migrations/v1.32-to-v1.33' },
            { text: 'v1.33 → v1.34', link: '/migrations/v1.33-to-v1.34' },
            { text: 'v1.34 → v1.35', link: '/migrations/v1.34-to-v1.35' },
            { text: 'v1.35 → v1.36', link: '/migrations/v1.35-to-v1.36' },
            { text: 'v1.36 → v1.37', link: '/migrations/v1.36-to-v1.37' },
            { text: 'v1.37 → v1.38', link: '/migrations/v1.37-to-v1.38' },
            { text: 'v1.38 → v1.39', link: '/migrations/v1.38-to-v1.39' },
            { text: 'v1.39 → v1.40', link: '/migrations/v1.39-to-v1.40' },
            { text: 'v1.40 → v1.41', link: '/migrations/v1.40-to-v1.41' },
            { text: 'v1.41 → v1.42', link: '/migrations/v1.41-to-v1.42' },
            { text: 'v1.42 → v1.43', link: '/migrations/v1.42-to-v1.43' },
            { text: 'v1.43 → v1.44', link: '/migrations/v1.43-to-v1.44' },
            { text: 'v1.44 → v1.45', link: '/migrations/v1.44-to-v1.45' },
            { text: 'v1.45 → v1.46', link: '/migrations/v1.45-to-v1.46' },
            { text: 'v1.46 → v1.47', link: '/migrations/v1.46-to-v1.47' },
            { text: 'v1.47 → v1.48', link: '/migrations/v1.47-to-v1.48' },
            { text: 'v1.48 → v1.49', link: '/migrations/v1.48-to-v1.49' },
            { text: 'v1.49 → v1.50', link: '/migrations/v1.49-to-v1.50' },
            { text: 'v1.50 → v1.51', link: '/migrations/v1.50-to-v1.51' },
            { text: 'v1.51 → v1.52', link: '/migrations/v1.51-to-v1.52' },
            { text: 'v1.52 → v1.53', link: '/migrations/v1.52-to-v1.53' },
            { text: 'v1.53 → v1.54', link: '/migrations/v1.53-to-v1.54' },
            { text: 'v1.54 → v1.55', link: '/migrations/v1.54-to-v1.55' },
            { text: 'v1.55 → v1.56', link: '/migrations/v1.55-to-v1.56' },
            { text: 'v1.56 → v1.57', link: '/migrations/v1.56-to-v1.57' },
            { text: 'v1.57 → v1.58', link: '/migrations/v1.57-to-v1.58' },
            { text: 'v1.58 → v1.59', link: '/migrations/v1.58-to-v1.59' },
            { text: 'v1.59 → v1.60', link: '/migrations/v1.59-to-v1.60' },
            { text: 'v1.60 → v1.61', link: '/migrations/v1.60-to-v1.61' },
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
