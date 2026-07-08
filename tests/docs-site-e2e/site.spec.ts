import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { expect, test } from '@playwright/test';

/**
 * Playwright docs-site E2E. Runs against the local VitePress build output
 * (`docs/.vitepress/dist/`) so it stays independent of GitHub Pages
 * provisioning. When the dist directory is missing, every test is skipped
 * so the suite passes on a fresh clone without a full docs build.
 */

const here = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(here, '..', '..', 'docs', '.vitepress', 'dist');

/**
 * Resolve a VitePress URL-shaped path to its emitted `dist/` HTML file.
 *
 * VitePress `cleanUrls: true` builds:
 * - `/` → `dist/index.html`
 * - `/tutorials/` → `dist/tutorials/index.html`
 * - `/tutorials/01-supabase-auth-first-test` → `dist/tutorials/01-supabase-auth-first-test.html`
 * - `/concepts/ai-llm-testing` → `dist/concepts/ai-llm-testing.html`
 */
function pageUrl(pagePath: string): string {
  const rel = pagePath === '/' ? 'index.html' : pagePath.endsWith('/')
    ? `${pagePath.replace(/\/$/, '')}/index.html`
    : `${pagePath}.html`;
  return `file://${join(distDir, rel)}`;
}

const CANONICAL_PAGES = [
  { path: '/', title: 'kiwa' },
  { path: '/tutorials/', title: 'kiwa tutorials' },
  { path: '/tutorials/01-supabase-auth-first-test', title: 'Your first Supabase Auth' },
  { path: '/migrations/v1.10-to-v1.11', title: 'v1.10 → v1.11' },
  { path: '/quality/release-gate', title: 'kiwa release gate' },
];

// v1.12 pages — new tutorials + concept doc + migration guide added under the
// AI-LLM 縦軸 milestone (Issue #700). Same skip-if-dist-missing pattern as the
// canonical suite above so the tests pass on a fresh clone without a full docs
// build. Each page asserts an anchor phrase that a rendered VitePress build
// will always include in <main>.
const V1_12_PAGES = [
  { path: '/tutorials/06-anthropic-chatbot-streaming', title: 'Anthropic chatbot streaming' },
  { path: '/tutorials/07-openai-tool-agent', title: 'OpenAI tool-use agent' },
  { path: '/tutorials/08-vercel-ai-rag', title: 'Vercel AI SDK' },
  { path: '/concepts/ai-llm-testing', title: 'non-determinism' },
  { path: '/migrations/v1.11-to-v1.12', title: 'v1.11 → v1.12' },
];

// v1.13 pages — new tutorials + concept doc + migration guide added under the
// Realtime 縦軸 milestone (Issue #715). Mirrors the v1.12 anchor-phrase pattern.
// Each phrase is a substring the rendered VitePress <main> will always include.
const V1_13_PAGES = [
  { path: '/tutorials/09-supabase-realtime-chat', title: 'Supabase Realtime chat' },
  { path: '/tutorials/10-ably-collab-cursor', title: 'Ably shared cursor' },
  { path: '/tutorials/11-socketio-notification', title: 'Socket.io notification' },
  { path: '/concepts/realtime-testing', title: 'time axis mocks' },
  { path: '/migrations/v1.12-to-v1.13', title: 'v1.12 → v1.13' },
];

// v1.16 pages — new tutorials + concept doc + migration guide added under the
// Component test 縦軸 milestone (Issue #767). Mirrors the v1.12 / v1.13 anchor
// phrase pattern. Each phrase is a substring the rendered VitePress <main>
// will always include.
const V1_16_PAGES = [
  { path: '/tutorials/19-storybook-design-system', title: 'Storybook 8 design system' },
  { path: '/tutorials/20-playwright-ct', title: 'Playwright CT for 5 form patterns' },
  { path: '/tutorials/21-visual-regression', title: 'Visual regression baseline / diff / accept' },
  { path: '/concepts/component-testing', title: 'story registration, CT mount, visual diff' },
  { path: '/migrations/v1.15-to-v1.16', title: 'v1.15 → v1.16' },
];

// v1.17 pages — new tutorials + concept doc + migration guide added under the
// Observability v2 milestone (Issue #782 land + this publish PR). Mirrors the
// v1.12 / v1.13 / v1.16 anchor phrase pattern. Each phrase is a substring the
// rendered VitePress <main> will always include (checked against the actual
// page headings + body text — not frontmatter titles).
const V1_17_PAGES = [
  { path: '/tutorials/22-observability-dashboard', title: 'Observability dashboard' },
  { path: '/tutorials/23-alert-orchestrator', title: 'Alert orchestrator' },
  { path: '/tutorials/24-trace-flame-graph', title: 'Trace flame graph' },
  { path: '/concepts/observability-v2-testing', title: 'Observability v2 testing' },
  { path: '/migrations/v1.16-to-v1.17', title: 'v1.16 → v1.17' },
];

// v1.18 pages — new tutorials + concept doc + migration guide added under the
// Blockchain 深化 milestone (Issue #797 land + this publish PR). Mirrors the
// v1.12 / v1.13 / v1.16 / v1.17 anchor phrase pattern. Each phrase is a
// substring the rendered VitePress <main> will always include (checked
// against the actual page headings + body text — not frontmatter titles).
const V1_18_PAGES = [
  { path: '/tutorials/25-reth-node-test', title: 'Reth node test' },
  { path: '/tutorials/26-foundry-invariant-fuzz', title: 'Foundry invariant + fuzz runner' },
  { path: '/tutorials/27-dapp-e2e-reorg', title: 'dApp e2e reorg' },
  { path: '/concepts/blockchain-testing', title: 'Blockchain testing' },
  { path: '/migrations/v1.17-to-v1.18', title: 'v1.17 → v1.18' },
];

// v1.19 pages — new tutorials + concept doc + migration guide added under the
// Framework 深化 milestone (Issue #811 land + this publish PR). Mirrors the
// v1.12 / v1.13 / v1.16 / v1.17 / v1.18 anchor phrase pattern. Each phrase is
// a substring the rendered VitePress <main> will always include (checked
// against the actual page headings + body text — not frontmatter titles).
// Coverage adds SolidJS Signal + Fresh Islands + HonoJS Cloudflare Workers
// as 3 new modern web framework tutorials.
const V1_19_PAGES = [
  { path: '/tutorials/28-solidjs-signal-app', title: 'SolidJS Signal + Effect + Resource + Suspense' },
  { path: '/tutorials/29-fresh-islands', title: 'Fresh Islands + Route Handler + Head normalize' },
  { path: '/tutorials/30-hono-workers-rpc', title: 'HonoJS + hc RPC type-safe client + Workers env' },
  { path: '/concepts/modern-web-framework-testing', title: 'Modern web framework testing' },
  { path: '/migrations/v1.18-to-v1.19', title: 'v1.18 → v1.19' },
];

// v1.20 pages — new tutorials + concept doc + migration guide added under the
// Streaming 深化 milestone (Issue #831 land + this publish PR). Mirrors the
// v1.12 / v1.13 / v1.16 / v1.17 / v1.18 / v1.19 anchor phrase pattern. Each
// phrase is a substring the rendered VitePress <main> will always include
// (checked against the actual page headings + body text — not frontmatter
// titles). Coverage adds Kafka event pipeline + Redpanda schema registry +
// NATS JetStream as 3 new streaming provider tutorials.
const V1_20_PAGES = [
  { path: '/tutorials/31-kafka-event-pipeline', title: 'Kafka event pipeline' },
  { path: '/tutorials/32-redpanda-schema-registry', title: 'Redpanda + schema registry' },
  { path: '/tutorials/33-nats-jetstream', title: 'NATS JetStream' },
  { path: '/concepts/streaming-testing', title: 'Streaming testing' },
  { path: '/migrations/v1.19-to-v1.20', title: 'v1.19 → v1.20' },
];

// v1.21 pages — new tutorials + concept doc + migration guide added under the
// Auth 深化 milestone (Issue #846 land + this publish PR). Mirrors the
// v1.12 / v1.13 / v1.16 / v1.17 / v1.18 / v1.19 / v1.20 anchor phrase pattern.
// Each phrase is a substring the rendered VitePress <main> will always include
// (checked against the actual page headings + body text — not frontmatter
// titles). Coverage adds WebAuthn L3 + Passkey + OAuth 2.1 + OIDC + Federation
// as 3 new web-auth protocol tutorials.
const V1_21_PAGES = [
  { path: '/tutorials/34-webauthn-passkey', title: 'WebAuthn L3 + Passkey' },
  { path: '/tutorials/35-oauth21-provider', title: 'OAuth 2.1 provider' },
  { path: '/tutorials/36-oidc-federation', title: 'OIDC provider + Federation' },
  { path: '/concepts/auth-protocol-testing', title: 'Auth protocol testing' },
  { path: '/migrations/v1.20-to-v1.21', title: 'v1.20 → v1.21' },
];

// v1.22 pages — new tutorials + concept doc + migration guide added under the
// Auth 深化 II milestone (Issue #892 publish PR). Mirrors the v1.21 anchor
// phrase pattern. Each phrase is a substring the rendered VitePress <main>
// will always include (checked against the actual page headings + body text —
// not frontmatter titles).
const V1_22_PAGES = [
  { path: '/tutorials/37-real-driver-testing', title: 'Real driver testing' },
  { path: '/tutorials/38-passkey-cable-flow', title: 'Passkey caBLE hybrid transport' },
  { path: '/concepts/real-driver-testing', title: 'Real driver testing' },
  { path: '/migrations/v1.21-to-v1.22', title: 'v1.21 → v1.22' },
];

// v1.23 pages — new tutorials + concept doc + migration guide added under the
// Payment 深化 milestone (Issue #905 publish PR). Mirrors the v1.21 / v1.22
// anchor phrase pattern. Each phrase is a substring the rendered VitePress
// <main> will always include (checked against the actual page headings + body
// text — not frontmatter titles). Coverage adds 9-axis billing semantics via
// Stripe advanced billing / Paddle merchant-of-record / Lemon Squeezy license
// flow as 3 new payment provider tutorials.
const V1_23_PAGES = [
  { path: '/tutorials/39-stripe-billing', title: 'Stripe advanced billing' },
  { path: '/tutorials/40-paddle-merchant', title: 'Paddle merchant-of-record' },
  { path: '/tutorials/41-lemon-squeezy-license', title: 'Lemon Squeezy' },
  { path: '/concepts/billing-semantics', title: 'Advanced billing semantics' },
  { path: '/migrations/v1.22-to-v1.23', title: 'v1.22 → v1.23' },
];

// v1.24 pages — new tutorials + concept doc + migration guide added under the
// Edge / Serverless 深化 milestone (Issue #919 publish PR). Mirrors the v1.21 /
// v1.22 / v1.23 anchor phrase pattern. Each phrase is a substring the rendered
// VitePress <main> will always include (checked against the actual page
// headings + body text — not frontmatter titles). Coverage adds 8-axis
// advanced edge semantics via Cloudflare Durable Object / Vercel Edge
// streaming / Deno Deploy geo as 3 new edge platform tutorials.
const V1_24_PAGES = [
  { path: '/tutorials/42-cloudflare-durable-object', title: 'Cloudflare Workers Durable Object' },
  { path: '/tutorials/43-vercel-edge-streaming', title: 'Vercel Edge streaming' },
  { path: '/tutorials/44-deno-deploy-geo', title: 'Deno Deploy geo' },
  { path: '/concepts/edge-runtime-testing', title: 'Edge runtime testing' },
  { path: '/migrations/v1.23-to-v1.24', title: 'v1.23 → v1.24' },
];

// v1.25 pages — new tutorials + concept doc + migration guide added under the
// Perf-harness sweep milestone (Issue #932 publish PR). Mirrors the v1.21 /
// v1.22 / v1.23 / v1.24 anchor phrase pattern. Each phrase is a substring the
// rendered VitePress <main> will always include (checked against the actual
// page headings + body text — not frontmatter titles). Coverage adds
// 33 package perf-harness rollout — p95 baseline walkthrough (tutorial 45) +
// 3 → 33 package migration methodology (tutorial 46) + SSOT concept doc + the
// v1.24 → v1.25 migration guide.
const V1_25_PAGES = [
  { path: '/tutorials/45-perf-harness-baseline', title: 'Perf-harness baseline' },
  { path: '/tutorials/46-perf-baseline-migration', title: 'Perf baseline migration' },
  { path: '/concepts/perf-testing-ssot', title: 'Perf testing SSOT' },
  { path: '/migrations/v1.24-to-v1.25', title: 'v1.24 → v1.25' },
];

// v1.26 pages — new tutorials + concept doc + migration guide added under the
// Database 深化 milestone (Issue #945 publish PR). Mirrors the v1.21 /
// v1.22 / v1.23 / v1.24 / v1.25 anchor phrase pattern. Each phrase is a
// substring the rendered VitePress <main> will always include (checked
// against the actual page headings + body text — not frontmatter titles).
// Coverage adds 8-axis advanced production db semantics via Postgres CDC +
// outbox (tutorial 47) + MySQL RLS + tenant (tutorial 48) + pgvector +
// hybrid search (tutorial 49) + SSOT concept doc + v1.25 → v1.26 migration.
const V1_26_PAGES = [
  { path: '/tutorials/47-postgres-cdc-outbox', title: 'Postgres CDC + outbox pattern' },
  { path: '/tutorials/48-mysql-rls-tenant', title: 'MySQL RLS + multi-tenant' },
  { path: '/tutorials/49-vector-search-pgvector', title: 'pgvector + hybrid search' },
  { path: '/concepts/db-advanced-testing', title: 'Db advanced testing SSOT' },
  { path: '/migrations/v1.25-to-v1.26', title: 'v1.25 → v1.26' },
];

// v1.27 pages — new tutorials + concept doc + migration guide added under the
// Mutation testing sweep milestone (Issue #961 publish PR). Mirrors the v1.21 /
// v1.22 / v1.23 / v1.24 / v1.25 / v1.26 anchor phrase pattern. Each phrase is
// a substring the rendered VitePress <main> will always include (checked
// against the actual page headings + body text — not frontmatter titles).
// Coverage adds Stryker rollout across 33 packages via kill-rate baseline
// walkthrough (tutorial 50) + 22 → 33 sweep methodology (tutorial 51) + SSOT
// concept doc + v1.26 → v1.27 migration.
const V1_27_PAGES = [
  { path: '/tutorials/50-mutation-testing-baseline', title: 'Mutation testing baseline' },
  { path: '/tutorials/51-mutation-baseline-migration', title: 'Mutation baseline migration' },
  { path: '/concepts/mutation-testing-ssot', title: 'Mutation testing SSOT' },
  { path: '/migrations/v1.26-to-v1.27', title: 'v1.26 → v1.27' },
];

// v1.28 pages — new tutorials + concept doc + migration guide added under the
// Realtime depth II milestone (Issue #976 publish PR). Mirrors the v1.21 /
// v1.22 / v1.23 / v1.24 / v1.25 / v1.26 / v1.27 anchor phrase pattern. Each
// phrase is a substring the rendered VitePress <main> will always include
// (checked against the actual page headings + body text — not frontmatter
// titles). Coverage adds WebRTC video call signaling walkthrough (tutorial 52)
// + WebTransport stream walkthrough (tutorial 53) + HTTP/3 multiplex + HPACK +
// 0-RTT walkthrough (tutorial 54) + 8-axis SSOT concept doc + v1.27 → v1.28
// migration.
const V1_28_PAGES = [
  { path: '/tutorials/52-webrtc-video-signaling', title: 'WebRTC video call' },
  { path: '/tutorials/53-webtransport-stream', title: 'WebTransport stream' },
  { path: '/tutorials/54-http3-multiplex', title: 'HTTP/3 multiplex' },
  { path: '/concepts/webrtc-webtransport-testing', title: 'WebRTC / WebTransport / HTTP/3 testing SSOT' },
  { path: '/migrations/v1.27-to-v1.28', title: 'v1.27 → v1.28' },
];

// v1.29 pages — new tutorial 55 + concept doc + migration guide added under
// the release script filter systematic root cause SSOT milestone (Issue
// #988). Same skip-if-dist-missing pattern as the canonical suite above so
// the tests pass on a fresh clone without a full docs build. Each page
// asserts an anchor phrase that a rendered VitePress build will always
// include in <main>.
const V1_29_PAGES = [
  { path: '/tutorials/55-release-script-filter-ssot', title: 'Release script filter SSOT' },
  { path: '/concepts/release-invariants', title: 'Release invariants SSOT' },
  { path: '/migrations/v1.28-to-v1.29', title: 'v1.28 → v1.29' },
];

// v1.30 pages — new tutorials 56-57 + concept doc + migration guide added
// under the a11y horizontal sweep milestone (Issue #991). Same
// skip-if-dist-missing pattern as the canonical suite above so the tests pass
// on a fresh clone without a full docs build. Each page asserts an anchor
// phrase that a rendered VitePress build will always include in <main>.
// Coverage adds axe-core + WCAG 2.1 AA gate + 3-layer harness walkthrough
// (tutorial 56) + 0 → 34 package migration methodology (tutorial 57) +
// WCAG 2.1 AA SSOT + 4-tier threshold + 3-layer harness concept doc
// (a11y-testing-ssot) + v1.29 → v1.30 additive-only migration guide.
const V1_30_PAGES = [
  { path: '/tutorials/56-a11y-baseline', title: 'A11y baseline' },
  { path: '/tutorials/57-a11y-baseline-migration', title: 'A11y baseline migration' },
  { path: '/concepts/a11y-testing-ssot', title: 'A11y testing SSOT' },
  { path: '/migrations/v1.29-to-v1.30', title: 'v1.29 → v1.30' },
];

// v1.31 pages — new tutorials 58-60 + concept doc + migration guide added
// under the streaming deepening II milestone (Issue #1008). Same
// skip-if-dist-missing pattern as the canonical suite above so the tests pass
// on a fresh clone without a full docs build. Each page asserts an anchor
// phrase that a rendered VitePress build will always include in <main>.
// Coverage adds Kafka raw protocol (KIP-98 idempotent + txn coordinator +
// fetch session + ISR walkthrough) tutorial 58 + Redpanda schema evolution
// (BACKWARD / FORWARD / FULL + subject naming + references walkthrough)
// tutorial 59 + NATS JetStream durable consumer (ack_wait + max_deliver +
// backoff + quarantine walkthrough) tutorial 60 + Streaming real-driver
// testing SSOT (8 axis × 3 provider = 24 cell grid + testcontainers pattern)
// concept doc + v1.30 → v1.31 additive-only migration guide.
const V1_31_PAGES = [
  { path: '/tutorials/58-kafka-raw-protocol', title: 'Kafka raw-protocol' },
  { path: '/tutorials/59-redpanda-schema-evolution', title: 'Redpanda schema evolution' },
  { path: '/tutorials/60-nats-jetstream-durable', title: 'NATS JetStream durable consumer' },
  { path: '/concepts/streaming-real-driver-testing', title: 'Streaming real-driver testing' },
  { path: '/migrations/v1.30-to-v1.31', title: 'v1.30 → v1.31' },
];

// v1.32 pages — new tutorials 61-63 + concept doc + migration guide added
// under the database deepening II milestone (Issue #1021). Same
// skip-if-dist-missing pattern as the canonical suite above so the tests pass
// on a fresh clone without a full docs build. Each page asserts an anchor
// phrase that a rendered VitePress build will always include in <main>.
// Coverage adds Postgres logical replication advanced (streaming start +
// replication origin + two-safe commit + cascaded subscription walkthrough)
// tutorial 61 + MySQL group replication (member join + primary election +
// conflict detection + member leave walkthrough) tutorial 62 + SQLite WAL +
// FTS5 (journal_mode switch + wal_checkpoint + virtual table + tokenizer +
// BM25 rank walkthrough) tutorial 63 + Database real-driver testing SSOT
// (16 axis × 3 provider × 3 backend = 144 cell grid + testcontainers
// pattern) concept doc + v1.31 → v1.32 additive-only migration guide.
const V1_32_PAGES = [
  { path: '/tutorials/61-postgres-logical-replication-advanced', title: 'Postgres logical replication advanced' },
  { path: '/tutorials/62-mysql-group-replication', title: 'MySQL group replication' },
  { path: '/tutorials/63-sqlite-wal-fts5', title: 'SQLite WAL + FTS5' },
  { path: '/concepts/database-real-driver-testing', title: 'Database real-driver testing' },
  { path: '/migrations/v1.31-to-v1.32', title: 'v1.31 → v1.32' },
];

// v1.33 pages — new tutorials 64-66 + concept doc + migration guide added
// under the payment deepening II milestone (Issue #1041). Same
// skip-if-dist-missing pattern as the canonical suite above so the tests pass
// on a fresh clone without a full docs build. Each page asserts an anchor
// phrase that a rendered VitePress build will always include in <main>.
// Coverage adds payment orchestration (multi-provider routing + failover +
// retry ladder + circuit breaker walkthrough) tutorial 64 + Stripe Connect
// marketplace (dispute + refund + webhook idempotency + DAC7 walkthrough)
// tutorial 65 + Paddle Billing v2 (grace period + proration + coupon
// stacking + recovery + vault migration walkthrough) tutorial 66 + Payment
// real-driver testing SSOT (8 axis × 3 provider = 24 cell grid +
// testcontainers-shaped env-gate pattern) concept doc + v1.32 → v1.33
// additive-only migration guide.
const V1_33_PAGES = [
  { path: '/tutorials/64-payment-orchestration', title: 'Payment orchestration' },
  { path: '/tutorials/65-stripe-connect-marketplace', title: 'Stripe Connect marketplace' },
  { path: '/tutorials/66-paddle-billing-v2', title: 'Paddle Billing v2' },
  { path: '/concepts/payment-real-driver-testing', title: 'Payment real-driver testing' },
  { path: '/migrations/v1.32-to-v1.33', title: 'v1.32 → v1.33' },
];

// v1.34 pages — new tutorials 67-69 + concept doc + migration guide added
// under the frontend deepening milestone (Issue #1052). Same skip-if-dist-missing
// pattern as the canonical suite above so the tests pass on a fresh clone
// without a full docs build. Coverage adds RSC streaming SSR (Server
// Components + Suspense + selective hydration + view transitions walkthrough)
// tutorial 67 + Server Action + optimistic UI (form action + useFormStatus +
// useOptimistic + revalidatePath + revalidateTag + redirect walkthrough)
// tutorial 68 + Storybook 8 MDX (CSF3 + MDX doc + interaction runner +
// coverage report walkthrough) tutorial 69 + Frontend real-driver testing SSOT
// (8 axis × 3 target = 24 cell grid + browser-shaped env-gate pattern) concept
// doc + v1.33 → v1.34 additive-only migration guide.
const V1_34_PAGES = [
  { path: '/tutorials/67-rsc-streaming-ssr', title: 'RSC streaming SSR' },
  { path: '/tutorials/68-server-action-optimistic', title: 'Server Action + optimistic UI' },
  { path: '/tutorials/69-storybook-8-mdx', title: 'Storybook 8 MDX' },
  { path: '/concepts/frontend-real-driver-testing', title: 'Frontend real-driver testing' },
  { path: '/migrations/v1.33-to-v1.34', title: 'v1.33 → v1.34' },
];

// v1.35 pages — new tutorials 70-72 + concept doc + migration guide added
// under the observability deepening II milestone (Issue #1066). Same skip-if-
// dist-missing pattern as the canonical suite above so the tests pass on a
// fresh clone without a full docs build. Coverage adds SLO burn rate (error
// budget + multi-window multi-burn-rate alert walkthrough) tutorial 70 +
// OpenTelemetry exemplar (trace-to-metric + metric-to-trace + baggage + W3C
// context walkthrough) tutorial 71 + Continuous profiling (CPU + memory +
// off-CPU flame graph + depth-first flatten walkthrough) tutorial 72 +
// Observability real-driver testing SSOT (8 axis × 4 provider = 32 cell grid +
// provider _URL env-gate pattern) concept doc + v1.34 → v1.35 additive-only
// migration guide.
const V1_35_PAGES = [
  { path: '/tutorials/70-slo-burn-rate', title: 'SLO burn rate' },
  { path: '/tutorials/71-otel-exemplar', title: 'OpenTelemetry exemplar' },
  { path: '/tutorials/72-continuous-profiling', title: 'Continuous profiling' },
  { path: '/concepts/observability-real-driver-testing', title: 'Observability real-driver testing' },
  { path: '/migrations/v1.34-to-v1.35', title: 'v1.34 → v1.35' },
];

// v1.36 pages — new tutorials 73-75 + concept doc + migration guide added
// under the search deepening milestone (Issue #1079). Same skip-if-dist-missing
// pattern as the canonical suite above so the tests pass on a fresh clone
// without a full docs build. Coverage adds Vector search (kNN + HNSW + hybrid
// fusion + recall@k walkthrough) tutorial 73 + Faceted geo search (nested
// facet + bounding box + radius + polygon + isochrone walkthrough) tutorial 74
// + OpenSearch relevance tuning (BM25 + TF-IDF + custom ranking + A/B +
// synonym advanced + rolling reindex walkthrough) tutorial 75 + Search real-
// driver testing SSOT (8 axis × 4 provider = 32 cell grid + provider _URL /
// _KEY env-gate pattern) concept doc + v1.35 → v1.36 additive-only migration
// guide.
const V1_36_PAGES = [
  { path: '/tutorials/73-vector-search-hybrid', title: 'Vector search' },
  { path: '/tutorials/74-faceted-geo-search', title: 'Faceted geo search' },
  { path: '/tutorials/75-opensearch-relevance-tuning', title: 'OpenSearch relevance tuning' },
  { path: '/concepts/search-real-driver-testing', title: 'Search real-driver testing' },
  { path: '/migrations/v1.35-to-v1.36', title: 'v1.35 → v1.36' },
];

// v1.38 pages — new tutorials 79-81 + concept doc + migration guide added
// under the AI/LLM deepening II milestone (Issue #1099). Same skip-if-dist-missing
// pattern as the canonical suite above so the tests pass on a fresh clone
// without a full docs build. Coverage adds Prompt injection defense (direct +
// indirect + jailbreak + role-hijack + Constitutional AI + PII redaction
// walkthrough) tutorial 79 + LLM eval + hallucination (self-consistency +
// factuality + citation + LLM-as-judge + rubric + preference + Elo
// walkthrough) tutorial 80 + Agent orchestration (ReAct + ToT + reflection +
// tool selection + budget + latency + routing + fallback walkthrough)
// tutorial 81 + AI-LLM real-driver testing SSOT (8 axis × 4 provider = 32
// cell grid + provider _API_KEY env-gate pattern) concept doc + v1.37 →
// v1.38 additive-only migration guide.
const V1_38_PAGES = [
  { path: '/tutorials/79-prompt-injection-defense', title: 'Prompt injection defense' },
  { path: '/tutorials/80-llm-eval-hallucination', title: 'LLM eval' },
  { path: '/tutorials/81-agent-orchestration', title: 'Agent orchestration' },
  { path: '/concepts/ai-llm-real-driver-testing', title: 'AI-LLM real-driver testing' },
  { path: '/migrations/v1.37-to-v1.38', title: 'v1.37 → v1.38' },
];

// V1.39-5 (Issue #1121 / CAR-867) — docs 補強 for the Security 深化 II milestone
// pair 2 段拡張 (v1.37 v0.1 base → v1.39 v0.2 advanced II). Same
// skip-if-dist-missing pattern so the tests pass on a fresh clone without a
// full docs build. Coverage adds mTLS + Zero-trust (handshake + SPKI pin + OCSP
// + CT + device posture + risk score + JIT + micro-segmentation walkthrough)
// tutorial 82 + SIEM audit + Incident response (structured logging +
// tamper-evident seal + retention + correlation + playbook + severity +
// escalation + forensics + post-mortem walkthrough) tutorial 83 + Supply chain
// SLSA (SLSA level verification + reproducible build + signed provenance +
// attestation walkthrough) tutorial 84 + Security advanced II testing SSOT
// (v0.2 8 axis × 4 provider = 32 advanced cell grid + provider _URL / _TOKEN
// env-gate pattern) concept doc + v1.38 → v1.39 additive-only migration guide.
const V1_39_PAGES = [
  { path: '/tutorials/82-mtls-zero-trust', title: 'mTLS + Zero-trust' },
  { path: '/tutorials/83-siem-incident-response', title: 'SIEM audit + Incident response' },
  { path: '/tutorials/84-supply-chain-slsa', title: 'Supply chain SLSA' },
  { path: '/concepts/security-advanced-II-testing', title: 'Security advanced II testing' },
  { path: '/migrations/v1.38-to-v1.39', title: 'v1.38 → v1.39' },
];

// V1.40-5 (Issue #1135 / CAR-892) — docs 補強 for the AI-LLM 深化 III milestone
// pair 深度 4 段拡張 (v1.12 v0.1 base → v1.15 v0.2 multimodal → v1.38 v0.4
// advanced → v1.40 v0.5 advanced III). Same skip-if-dist-missing pattern so the
// tests pass on a fresh clone without a full docs build. Coverage adds
// Multi-agent orchestration + Agent swarm (CrewAI + LangGraph supervisor +
// role-based swarm + PBFT-lite Byzantine consensus walkthrough) tutorial 85 +
// Code interpreter + Fine-tuning pipeline (sandboxed REPL + tool use + rollback
// + RLHF/DPO + drift detection walkthrough) tutorial 86 + LLM ops + Prompt
// engineering + RAG III + Cost optimization (model registry + rollout + A/B +
// canary + shadow + CoT + few-shot + caching + versioning + GraphRAG + agentic
// + self-query + parent doc + batch + cascade + semantic cache walkthrough)
// tutorial 87 + AI-LLM advanced III testing SSOT (v0.5 8 axis × 4 provider =
// 32 advanced III cell grid + 16-axis combined harness + pair 深度 4 段 record)
// concept doc + v1.39 → v1.40 additive-only migration guide.
const V1_40_PAGES = [
  { path: '/tutorials/85-multi-agent-swarm', title: 'Multi-agent orchestration + Agent swarm' },
  { path: '/tutorials/86-code-interpreter-fine-tuning', title: 'Code interpreter + Fine-tuning pipeline' },
  { path: '/tutorials/87-llm-ops-rag-iii-cost', title: 'LLM ops + Prompt engineering + RAG III + Cost optimization' },
  { path: '/concepts/ai-llm-advanced-III-testing', title: 'AI-LLM advanced III testing' },
  { path: '/migrations/v1.39-to-v1.40', title: 'v1.39 → v1.40' },
];

// V1.41-5 (Issue #1148 / CAR-981) — docs 補強 for the Payment 深化 III milestone
// pair 深度 4 段拡張 2 例目 (v1.14 v0.1 base → v1.19 v0.2 advanced → v1.33 v0.4
// advanced II → v1.41 v0.5 advanced III). Same skip-if-dist-missing pattern so
// the tests pass on a fresh clone without a full docs build. Coverage adds
// Embedded finance + BNPL (BaaS + card + KYC/KYB + installment + risk + late
// fee walkthrough) tutorial 88 + Crypto payment + FX cross-border (stablecoin
// + on-chain + gas abstraction + rate lock + SWIFT/SEPA walkthrough) tutorial
// 89 + Recurring revenue + Orchestration II + Fraud detection + Regulatory
// reporting (MRR/NRR + smart route + ML fraud + PCI/PSD2/DORA/SAR walkthrough)
// tutorial 90 + Payment advanced III testing SSOT (v0.5 8 axis × 3 provider =
// 24 advanced III cell grid + 25-axis combined harness + pair 深度 4 段 2 例目
// record) concept doc + v1.40 → v1.41 additive-only migration guide.
const V1_41_PAGES = [
  { path: '/tutorials/88-embedded-finance-bnpl', title: 'Embedded finance + BNPL' },
  { path: '/tutorials/89-crypto-payment-fx', title: 'Crypto payment + FX cross-border' },
  { path: '/tutorials/90-recurring-orchestration-fraud-regulatory', title: 'Recurring revenue + Payment orchestration II + Fraud detection + Regulatory reporting' },
  { path: '/concepts/payment-advanced-III-testing', title: 'Payment advanced III testing' },
  { path: '/migrations/v1.40-to-v1.41', title: 'v1.40 → v1.41' },
];

// V1.42-5 (Issue #1161 / CAR-1050) — docs 補強 for the Observability III 深化
// milestone pair 深度 4 段拡張 3 例目 (v1.14 v2.0 baseline → v1.17 v2.0 advanced
// base 4 axis → v1.35 v2.1 advanced 8 axis → v1.42 v2.2 advanced III 8 axis).
// Same skip-if-dist-missing pattern so the tests pass on a fresh clone without
// a full docs build. Coverage adds IaC + Service mesh + eBPF profiling III
// (Terraform drift + OPA + mTLS + sidecar + circuit breaker + uprobe + kprobe
// + LSM + syscall + netflow walkthrough) tutorial 91 + LLM observability +
// FinOps (token counting + prompt log + hallucination + budget + CPR + team
// attribution + rightsizing + spot walkthrough) tutorial 92 + Chaos + Data
// pipeline + AIOps (fault + blast radius + rollback + game day + lineage +
// freshness + schema drift + DQ + anomaly + remediation + RCA + correlation
// walkthrough) tutorial 93 + Observability advanced III testing SSOT (v2.2
// 8 axis × 4 provider = 32 advanced III cell grid + 16-axis combined harness
// + pair 深度 4 段 3 例目 record) concept doc + v1.41 → v1.42 additive-only
// migration guide.
const V1_42_PAGES = [
  { path: '/tutorials/91-iac-servicemesh-ebpf', title: 'IaC + Service mesh + eBPF profiling III' },
  { path: '/tutorials/92-llm-observability-finops', title: 'LLM observability + FinOps' },
  { path: '/tutorials/93-chaos-datapipeline-aiops', title: 'Chaos engineering + Data pipeline + AIOps' },
  { path: '/concepts/observability-advanced-III-testing', title: 'Observability advanced III testing' },
  { path: '/migrations/v1.41-to-v1.42', title: 'v1.41 → v1.42' },
];

// v1.43 introduces Edge / Serverless deepening pair 第 12 新規 base pair
// (first new pair base since v1.37 Security, 5 milestones ago). Advanced 8
// axis semantics on top of the existing 8-axis base (16 total axis).
// 3 new dogfood apps + 3 new tutorials (94 Serverless cold-start + 95
// DurableObject state migration + 96 Global routing) + Edge / Serverless
// advanced testing SSOT concept doc + v1.42 → v1.43 additive-only
// migration guide.
const V1_43_PAGES = [
  { path: '/tutorials/94-serverless-cold-start', title: 'Serverless cold-start' },
  { path: '/tutorials/95-durable-object-migration', title: 'DurableObject state migration' },
  { path: '/tutorials/96-global-routing', title: 'Global routing' },
  { path: '/concepts/edge-serverless-advanced-testing', title: 'Edge / Serverless advanced testing' },
  { path: '/migrations/v1.42-to-v1.43', title: 'v1.42 → v1.43' },
];

// v1.44 introduces Auth Passwordless UX III (pair 1 depth 3 achievement).
// 3 new dogfood apps + 3 tutorials (97 Passwordless UX + 98 Step-up MFA
// + 99 Risk-based auth) + auth-advanced-III-testing concept doc + v1.43
// → v1.44 additive-only migration guide.
const V1_44_PAGES = [
  { path: '/tutorials/97-passwordless-ux', title: 'Passwordless UX' },
  { path: '/tutorials/98-step-up-mfa', title: 'Step-up MFA' },
  { path: '/tutorials/99-risk-based-auth', title: 'Risk-based auth' },
  { path: '/concepts/auth-advanced-III-testing', title: 'Auth advanced III testing' },
  { path: '/migrations/v1.43-to-v1.44', title: 'v1.43 → v1.44' },
];

// v1.45 introduces Realtime III (pair 2 depth 3 achievement、 3rd example).
// 3 new dogfood apps + 3 tutorials (100 MoQ+WebCodecs + 101 voice streaming
// + 102 SVC adaptive) + realtime-advanced-III-testing concept doc + v1.44
// → v1.45 additive-only migration guide.
const V1_45_PAGES = [
  { path: '/tutorials/100-moq-webcodecs', title: 'MoQ + WebCodecs' },
  { path: '/tutorials/101-voice-streaming', title: 'LLM voice streaming' },
  { path: '/tutorials/102-svc-adaptive', title: 'SVC layer selection' },
  { path: '/concepts/realtime-advanced-III-testing', title: 'Realtime advanced III testing' },
  { path: '/migrations/v1.44-to-v1.45', title: 'v1.44 → v1.45' },
];

// v1.46 = quality gate integrity + DevSecOps library 2 軸。
// 1 dogfood + 2 tutorial (103 DevSecOps + 104 perf strict) + concept doc + migration。
const V1_46_PAGES = [
  { path: '/tutorials/103-security-devsecops', title: 'DevSecOps 6 axis' },
  { path: '/tutorials/104-perf-strict', title: 'Perf strict mode' },
  { path: '/concepts/security-devsecops-library-integration', title: 'DevSecOps library integration' },
  { path: '/migrations/v1.45-to-v1.46', title: 'v1.45 → v1.46' },
];

// v1.47 = security-devsecops v0.2 adapter 統合 Phase 2 完成、 単軸 milestone。
// 1 dogfood + 1 tutorial (105 adapter) + migration。
const V1_47_PAGES = [
  { path: '/tutorials/105-security-adapter', title: 'DevSecOps adapter' },
  { path: '/migrations/v1.46-to-v1.47', title: 'v1.46 → v1.47' },
];

// v1.48 = security-devsecops v0.3 Phase 3 orchestrator 単軸 milestone。
// 1 dogfood + 1 tutorial (106 orchestrator) + migration。
const V1_48_PAGES = [
  { path: '/tutorials/106-security-orchestrator', title: 'DevSecOps single entry' },
  { path: '/migrations/v1.47-to-v1.48', title: 'v1.47 → v1.48' },
];

// v1.49 = Frontend 深化 III pair 3 段拡張 4 例目、 3 dogfood + 3 tutorial (107-109) + migration + concept。
const V1_49_PAGES = [
  { path: '/tutorials/107-rsc-server-actions-v2', title: 'RSC + Server Actions v2' },
  { path: '/tutorials/108-view-transitions-concurrent', title: 'View Transitions + Concurrent React' },
  { path: '/tutorials/109-islands-turbopack-hmr', title: 'Islands + Turbopack HMR' },
  { path: '/concepts/frontend-advanced-III-testing', title: 'Frontend advanced III testing' },
  { path: '/migrations/v1.48-to-v1.49', title: 'v1.48 → v1.49' },
];

// v1.50 = Mobile new-base pair 第 13、 1 dogfood + 1 tutorial (110) + migration + concept。
const V1_50_PAGES = [
  { path: '/tutorials/110-mobile-testing', title: 'Mobile testing baseline' },
  { path: '/concepts/mobile-testing-baseline', title: 'Mobile testing baseline' },
  { path: '/migrations/v1.49-to-v1.50', title: 'v1.49 → v1.50' },
];

// v1.51 = Mobile 深化 II、 pair 第 13 の 2 段目 Phase 2、 1 dogfood + 1 tutorial (111) + migration + concept。
const V1_51_PAGES = [
  { path: '/tutorials/111-mobile-advanced', title: 'Mobile advanced II' },
  { path: '/concepts/mobile-testing-advanced', title: 'Mobile testing advanced II' },
  { path: '/migrations/v1.50-to-v1.51', title: 'v1.50 → v1.51' },
];

// v1.52 = Mobile 深化 III、 pair 深度 3 段拡張達成 5 例目、 30 milestone streak 突入。
const V1_52_PAGES = [
  { path: '/tutorials/112-mobile-new-architecture', title: 'Mobile New Architecture' },
  { path: '/concepts/mobile-testing-advanced-III', title: 'Mobile testing advanced III' },
  { path: '/migrations/v1.51-to-v1.52', title: 'v1.51 → v1.52' },
];

// v1.53 = Mobile 深化 IV、 pair 深度 4 段拡張達成 4 例目 depth-4 record、 31 milestone streak。
const V1_53_PAGES = [
  { path: '/tutorials/113-mobile-real-driver', title: 'Mobile v0.4 real driver adapter' },
  { path: '/concepts/mobile-testing-real-driver', title: 'Mobile real driver adapter interface' },
  { path: '/migrations/v1.52-to-v1.53', title: 'v1.52 → v1.53' },
];

// v1.54 = 2 軸 milestone (rules 昇格 + Mobile 深化 V)、 pair 深度 5 段拡張 1 例目 candidate、 depth-5 pattern 新設、 32 milestone streak。
const V1_54_PAGES = [
  { path: '/tutorials/114-mobile-real-cli', title: 'Mobile v0.5 child_process.spawn stub' },
  { path: '/concepts/mobile-testing-real-cli', title: 'Mobile v0.5 child_process.spawn stub 契約層' },
  { path: '/migrations/v1.53-to-v1.54', title: 'v1.53 → v1.54' },
];

// v1.55 = Mobile 深化 VI、 depth-5 pattern 実装完成、 kiwa milestone 史上初 6 段拡張、 33 milestone streak。
const V1_55_PAGES = [
  { path: '/tutorials/115-mobile-v06-spawn', title: 'Mobile v0.6 実 child_process.spawn 実行' },
  { path: '/concepts/mobile-testing-v06-spawn', title: 'Mobile v0.6 実 child_process.spawn 実行' },
  { path: '/migrations/v1.54-to-v1.55', title: 'v1.54 → v1.55' },
];

// v1.56 = Desktop new-base pair 第 14、 42 package 到達、 34 milestone streak。
const V1_56_PAGES = [
  { path: '/tutorials/116-desktop-testing', title: 'Desktop testing baseline' },
  { path: '/concepts/desktop-testing-baseline', title: 'Desktop testing baseline' },
  { path: '/migrations/v1.55-to-v1.56', title: 'v1.55 → v1.56' },
];

// v1.57 = Desktop 深化 I (v0.2 advanced 5 axis)、 35 milestone streak、 systematic pattern 32 度目。
const V1_57_PAGES = [
  { path: '/tutorials/117-desktop-advanced-axis', title: 'Desktop advanced axis' },
  { path: '/concepts/desktop-advanced-axis', title: 'Desktop advanced axis' },
  { path: '/migrations/v1.56-to-v1.57', title: 'v1.56 → v1.57' },
];

// v1.58 = Desktop 深化 II (v0.3 advanced III 4 axis)、 36 milestone streak、 systematic pattern 33 度目、 Mobile v1.50-v1.52 rhythm 再現。
const V1_58_PAGES = [
  { path: '/tutorials/118-desktop-advanced-iii', title: 'Desktop advanced III' },
  { path: '/concepts/desktop-advanced-iii', title: 'Desktop advanced III' },
  { path: '/migrations/v1.57-to-v1.58', title: 'v1.57 → v1.58' },
];

/**
 * VitePress landing pages built from `hero:` frontmatter use the `.VPHome`
 * layout with no `<main>` element; every other layout mounts content into
 * `<main>`. Prefer `.VPContent` — VitePress always emits that around the
 * rendered content, regardless of the layout — as the innerText anchor.
 */
const CONTENT_LOCATOR = '.VPContent';

test.describe('docs site — canonical pages render', () => {
  for (const p of CANONICAL_PAGES) {
    test(`page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.12 pages render', () => {
  for (const p of V1_12_PAGES) {
    test(`v1.12 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.13 pages render', () => {
  for (const p of V1_13_PAGES) {
    test(`v1.13 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.16 pages render', () => {
  for (const p of V1_16_PAGES) {
    test(`v1.16 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.17 pages render', () => {
  for (const p of V1_17_PAGES) {
    test(`v1.17 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.18 pages render', () => {
  for (const p of V1_18_PAGES) {
    test(`v1.18 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.19 pages render', () => {
  for (const p of V1_19_PAGES) {
    test(`v1.19 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.20 pages render', () => {
  for (const p of V1_20_PAGES) {
    test(`v1.20 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.21 pages render', () => {
  for (const p of V1_21_PAGES) {
    test(`v1.21 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.22 pages render', () => {
  for (const p of V1_22_PAGES) {
    test(`v1.22 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.23 pages render', () => {
  for (const p of V1_23_PAGES) {
    test(`v1.23 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.24 pages render', () => {
  for (const p of V1_24_PAGES) {
    test(`v1.24 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.25 pages render', () => {
  for (const p of V1_25_PAGES) {
    test(`v1.25 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.26 pages render', () => {
  for (const p of V1_26_PAGES) {
    test(`v1.26 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.27 pages render', () => {
  for (const p of V1_27_PAGES) {
    test(`v1.27 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.28 pages render', () => {
  for (const p of V1_28_PAGES) {
    test(`v1.28 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.29 pages render', () => {
  for (const p of V1_29_PAGES) {
    test(`v1.29 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.30 pages render', () => {
  for (const p of V1_30_PAGES) {
    test(`v1.30 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.31 pages render', () => {
  for (const p of V1_31_PAGES) {
    test(`v1.31 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.32 pages render', () => {
  for (const p of V1_32_PAGES) {
    test(`v1.32 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.33 pages render', () => {
  for (const p of V1_33_PAGES) {
    test(`v1.33 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.34 pages render', () => {
  for (const p of V1_34_PAGES) {
    test(`v1.34 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.35 pages render', () => {
  for (const p of V1_35_PAGES) {
    test(`v1.35 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.36 pages render', () => {
  for (const p of V1_36_PAGES) {
    test(`v1.36 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.38 pages render', () => {
  for (const p of V1_38_PAGES) {
    test(`v1.38 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.39 pages render', () => {
  for (const p of V1_39_PAGES) {
    test(`v1.39 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.40 pages render', () => {
  for (const p of V1_40_PAGES) {
    test(`v1.40 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.41 pages render', () => {
  for (const p of V1_41_PAGES) {
    test(`v1.41 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.42 pages render', () => {
  for (const p of V1_42_PAGES) {
    test(`v1.42 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.43 pages render', () => {
  for (const p of V1_43_PAGES) {
    test(`v1.43 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.44 pages render', () => {
  for (const p of V1_44_PAGES) {
    test(`v1.44 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.58 pages render', () => {
  for (const p of V1_58_PAGES) {
    test(`v1.58 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      const htmlPath = join(distDir, `${p.path.replace(/^\//, '')}.html`);
      await page.goto(`file://${htmlPath}`);
      await expect(page.locator('h1').first()).toContainText(p.title);
    });
  }
});

test.describe('docs site — v1.57 pages render', () => {
  for (const p of V1_57_PAGES) {
    test(`v1.57 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      const htmlPath = join(distDir, `${p.path.replace(/^\//, '')}.html`);
      await page.goto(`file://${htmlPath}`);
      await expect(page.locator('h1').first()).toContainText(p.title);
    });
  }
});

test.describe('docs site — v1.56 pages render', () => {
  for (const p of V1_56_PAGES) {
    test(`v1.56 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      const htmlPath = join(distDir, `${p.path.replace(/^\//, '')}.html`);
      await page.goto(`file://${htmlPath}`);
      await expect(page.locator('h1').first()).toContainText(p.title);
    });
  }
});

test.describe('docs site — v1.55 pages render', () => {
  for (const p of V1_55_PAGES) {
    test(`v1.55 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      const htmlPath = join(distDir, `${p.path.replace(/^\//, '')}.html`);
      await page.goto(`file://${htmlPath}`);
      await expect(page.locator('h1').first()).toContainText(p.title);
    });
  }
});

test.describe('docs site — v1.54 pages render', () => {
  for (const p of V1_54_PAGES) {
    test(`v1.54 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      const htmlPath = join(distDir, `${p.path.replace(/^\//, '')}.html`);
      await page.goto(`file://${htmlPath}`);
      await expect(page.locator('h1').first()).toContainText(p.title);
    });
  }
});

test.describe('docs site — v1.53 pages render', () => {
  for (const p of V1_53_PAGES) {
    test(`v1.53 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      const htmlPath = join(distDir, `${p.path.replace(/^\//, '')}.html`);
      await page.goto(`file://${htmlPath}`);
      await expect(page.locator('h1').first()).toContainText(p.title);
    });
  }
});

test.describe('docs site — v1.52 pages render', () => {
  for (const p of V1_52_PAGES) {
    test(`v1.52 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      const htmlPath = join(distDir, `${p.path.replace(/^\//, '')}.html`);
      await page.goto(`file://${htmlPath}`);
      await expect(page.locator('h1').first()).toContainText(p.title);
    });
  }
});

test.describe('docs site — v1.51 pages render', () => {
  for (const p of V1_51_PAGES) {
    test(`v1.51 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      const htmlPath = join(distDir, `${p.path.replace(/^\//, '')}.html`);
      await page.goto(`file://${htmlPath}`);
      await expect(page.locator('h1').first()).toContainText(p.title);
    });
  }
});

test.describe('docs site — v1.50 pages render', () => {
  for (const p of V1_50_PAGES) {
    test(`v1.50 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      const htmlPath = join(distDir, `${p.path.replace(/^\//, '')}.html`);
      await page.goto(`file://${htmlPath}`);
      await expect(page.locator('h1').first()).toContainText(p.title);
    });
  }
});

test.describe('docs site — v1.49 pages render', () => {
  for (const p of V1_49_PAGES) {
    test(`v1.49 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      const htmlPath = join(distDir, `${p.path.replace(/^\//, '')}.html`);
      await page.goto(`file://${htmlPath}`);
      await expect(page.locator('h1').first()).toContainText(p.title);
    });
  }
});

test.describe('docs site — v1.48 pages render', () => {
  for (const p of V1_48_PAGES) {
    test(`v1.48 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      const htmlPath = join(distDir, `${p.path.replace(/^\//, '')}.html`);
      await page.goto(`file://${htmlPath}`);
      await expect(page.locator('h1').first()).toContainText(p.title);
    });
  }
});

test.describe('docs site — v1.47 pages render', () => {
  for (const p of V1_47_PAGES) {
    test(`v1.47 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      const htmlPath = join(distDir, `${p.path.replace(/^\//, '')}.html`);
      await page.goto(`file://${htmlPath}`);
      await expect(page.locator('h1').first()).toContainText(p.title);
    });
  }
});

test.describe('docs site — v1.46 pages render', () => {
  for (const p of V1_46_PAGES) {
    test(`v1.46 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      const htmlPath = join(distDir, `${p.path.replace(/^\//, '')}.html`);
      await page.goto(`file://${htmlPath}`);
      await expect(page.locator('h1').first()).toContainText(p.title);
    });
  }
});

test.describe('docs site — v1.45 pages render', () => {
  for (const p of V1_45_PAGES) {
    test(`v1.45 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — nav + search', () => {
  test('nav bar links to all trunk sections', async ({ page }) => {
    if (!existsSync(join(distDir, 'index.html'))) {
      test.skip(true, 'dist not built');
      return;
    }
    await page.goto(`file://${join(distDir, 'index.html')}`);
    for (const label of ['Home', 'Tutorials', 'Migrations', 'Quality', 'API Reference']) {
      const link = page.locator(`nav a >> text="${label}"`).first();
      await expect(link).toBeVisible({ timeout: 2000 });
    }
  });

  test('search widget mounts on the landing page', async ({ page }) => {
    if (!existsSync(join(distDir, 'index.html'))) {
      test.skip(true, 'dist not built');
      return;
    }
    // VitePress local search backs `#local-search` with a lazy-loaded chunk
    // that pulls a JSON index over `fetch`. Under `file://` the browser
    // enforces same-origin fetch which prevents the modal from populating —
    // asserting the widget is rendered in the navbar is the strongest signal
    // available without a static file server. GitHub Pages (https://) exercises
    // the full search flow in production; this local suite validates mount only.
    await page.goto(`file://${join(distDir, 'index.html')}`);
    const searchButton = page.locator('button.DocSearch, button.VPNavBarSearchButton').first();
    await expect(searchButton).toBeVisible({ timeout: 2000 });
  });
});
