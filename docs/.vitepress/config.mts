import { defineConfig } from 'vitepress';

// 分類・文書種別の呼び方・別枠で扱う文書は docs/libraries.json が正本。
// 整合検査 (scripts/check-docs-consistency.mjs) も同じ file を読む。
//
// データだけの JSON にしてあるのは、読む側が評価を伴わずに済ませるため。
// 検査 script は repo の内側にあることを確かめてから読み込んで parse する。
import definition from '../libraries.json' with { type: 'json' };
// 組み立ては共有 module に置く。test も同じ関数を呼ぶので、書き直した側がずれる余地がない。
import { buildLibrarySidebar } from './library-sidebar.mjs';
// 生成物かどうかの判定は削除経路と共有する。片方だけ判定が変わると、
// 消される file と索引から外れる file がずれる。
import { isGeneratedApiPageSource } from '../../scripts/docs-api-pages.mjs';

const librarySidebar = buildLibrarySidebar(definition);

// 検索の索引から本文を落とす場所。ページの題名だけ残す。
//
// 検索の主対象は API と使い方で、リリース告知の下書きや過去の測定値ではない。
// 索引は検索を開いた時に全体を読み込むため、載せるものを絞る。
const SEARCH_EXCLUDED = [
  // X 投稿の下書きと GitHub Discussions の文面。sidebar からも nav からも辿れない。
  'announcements/',
  // 版ごとの測定値のスナップショット。入口の 1 ページだけが nav にある。
  'quality-reports/',
  // 英語で書かれた旧ページ群。sidebar の見出しでアーカイブと明示していて、nav には無い。
  // 日本語の索引に英語の全文を載せる必然性が低い。
  'tutorials/',
  'concepts/',
  'migrations/',
];

/**
 * 検索の索引から、生成した API 契約を丸ごと落とす。
 *
 * 管理ブロックには公開名ごとの型宣言とエラー診断の表が入り、公開名は `####` の見出しになる。
 * 索引は見出しごとに 1 件を作るので、リファレンス 71 ページで 4,799 件に達する。
 * 索引の大きさは件数で決まる (転置索引と保存 field が件数に比例する) ため、
 * 本文だけ落としても件数は減らない。
 *
 * 主要な API は管理ブロックの外に手書きの見出しがあり、そちらは索引に残る。
 * ページ自体もリファレンスの見出しで引ける。
 */
function stripGeneratedApi(source: string) {
  const start = '<!-- kiwa-public-api:start -->';
  const end = '<!-- kiwa-public-api:end -->';
  // 目印は行として置かれる。生成した型宣言の中に同じ文字列があっても拾わないよう、
  // code block の外にある行だけを見る。
  const lines = source.split('\n');
  let fence: string | null = null;
  let from = -1;
  let to = -1;
  let offset = 0;
  const offsets: number[] = [];
  for (const line of lines) {
    offsets.push(offset);
    offset += line.length + 1;
  }
  for (const [index, line] of lines.entries()) {
    // 開く fence は run の後ろに言語名を置ける。閉じる fence は置けないので、
    // run の後ろが空白だけであることまで見る。見ないと `~~~text` を閉じと誤認する。
    const opened = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (opened) {
      const [, run, rest] = opened;
      if (fence === null) {
        // backtick で開く fence の言語名に backtick は置けない。
        if (run[0] === '`' && rest.includes('`')) continue;
        fence = run;
      } else if (run[0] === fence[0] && run.length >= fence.length && rest.trim() === '') {
        fence = null;
      }
      continue;
    }
    if (fence !== null) continue;
    // 目印は独立した行として置かれる。説明文や inline code で触れただけの行を
    // 境界と見なすと、その間にある本文が索引から落ちる。
    const trimmed = line.trim();
    if (from === -1 && trimmed === start) from = offsets[index] + line.indexOf(start);
    else if (from !== -1 && to === -1 && trimmed === end) to = offsets[index] + line.indexOf(end);
  }
  if (from === -1 || to === -1) return source;

  return `${source.slice(0, from)}${source.slice(to + end.length)}`;
}

/**
 * 索引に入れる markdown。
 *
 * 除外する場所は先頭の見出し 1 行だけ残す。索引はページごとではなく見出しごとに
 * 1 件を作るので、見出しを全部残すと件数が減らず、索引の大きさも下がらない。
 * 1 行残すことで、ページ自体はその題名で引ける。
 */
function searchSource(source: string, relativePath: string) {
  // 生成した API 契約のページ。宣言元ごとに分けてあり、中身は型宣言そのもの。
  // 索引は見出しごとに 1 件を作るので、公開名の数だけ件数が積み上がる。
  //
  // 場所ではなく中身の印で判定する。同じ directory に人が置いたページがあれば、
  // そちらは本文ごと索引に載せる。削除経路と同じ判定を使う。
  if (isGeneratedApiPageSource(source) || isExcludedFromSearch(relativePath)) {
    return pageTitle(source, relativePath);
  }
  return stripGeneratedApi(source);
}

/**
 * 索引から本文を落とす場所か。
 *
 * 英語の旧ページ群は locale ごとの写しも同じ扱いにする。`concepts/` を外して
 * `en/concepts/` を残すと、外した理由 (日本語の索引に英語の全文を載せない) と食い違う。
 */
function isExcludedFromSearch(relativePath: string) {
  return SEARCH_EXCLUDED.some(
    (prefix) => relativePath.startsWith(prefix) || relativePath.startsWith(`en/${prefix}`),
  );
}

/** frontmatter で検索から外すと指定しているか。縮約する前の source を見る。 */
function excludedByFrontmatter(source: string) {
  const frontmatter = source.match(/^---\n([\s\S]*?)\n---/);
  return /^search:\s*false\s*$/m.test(frontmatter?.[1] ?? '');
}

/**
 * ページを索引に載せるための題名。
 *
 * 見出しがあればそれを使う。無ければ frontmatter の題名から作る。
 * どちらも無いページを空にすると索引から完全に消えて、名前でも辿れなくなる。
 * その場合は path を題名にする。
 */
function pageTitle(source: string, relativePath: string) {
  const heading = source.split('\n').find((line) => /^#\s/.test(line));
  if (heading) return heading;
  const frontmatter = source.match(/^---\n([\s\S]*?)\n---/);
  const title = frontmatter?.[1].match(/^title:\s*(.+)$/m)?.[1]?.trim();
  if (title) return `# ${title.replace(/^["']|["']$/g, '')}`;
  // 見出しも題名も無いページ。空にすると索引から完全に消えるので、path から作る。
  return `# ${relativePath.replace(/\.md$/, '')}`;
}

const englishFoundationSidebar = [
  {
    text: 'Libraries',
    items: [
      { text: 'Overview', link: '/en/libraries/' },
      { text: 'Foundation', link: '/en/libraries/foundation/' },
    ],
  },
  {
    text: 'Foundation',
    items: ['core', 'dapp', 'api', 'ui', 'e2e'].map((packageName) => ({
      text: `@kiwa-lab/${packageName}`,
      link: `/en/libraries/foundation/${packageName}/`,
    })),
  },
];

export default defineConfig({
  title: 'kiwa',
  description: 'OSS test libraries for application boundaries.',
  lang: 'ja-JP',
  cleanUrls: true,
  ignoreDeadLinks: true,
  base: '/kiwa/',
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/kiwa/kiwa-mascot.png' }],
    ['link', { rel: 'apple-touch-icon', href: '/kiwa/kiwa-mascot.png' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'kiwa' }],
    ['meta', { property: 'og:title', content: 'kiwa' }],
    ['meta', { property: 'og:description', content: 'OSS test libraries for application boundaries.' }],
    ['meta', { property: 'og:image', content: 'https://cardene777.github.io/kiwa/kiwa-ogp.png' }],
    ['meta', { property: 'og:image:alt', content: 'kiwa mascot for the documentation site' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: 'https://cardene777.github.io/kiwa/kiwa-ogp.png' }],
  ],
  locales: {
    root: {
      label: '日本語',
      lang: 'ja-JP',
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      title: 'kiwa',
      description: 'OSS test libraries for application boundaries.',
      themeConfig: {
        logo: '/kiwa-mascot.png',
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'Libraries', link: '/en/libraries/' },
          { text: 'API reference', link: '/api/' },
        ],
        sidebar: { '/en/libraries/': englishFoundationSidebar },
        langMenuLabel: 'Change language',
        i18nRouting: false,
        outlineTitle: 'On this page',
      },
    },
  },
  themeConfig: {
    logo: '/kiwa-mascot.png',
    siteTitle: 'kiwa',
    outline: [2, 3],
    langMenuLabel: '言語を切り替える',
    i18nRouting: false,
    nav: [
      { text: 'はじめる', link: '/libraries/foundation/dapp/quickstart' },
      { text: 'ライブラリ', link: '/libraries/' },
      { text: 'ガイド', link: '/guides/' },
      { text: '品質', link: '/quality/release-gate' },
      { text: 'API', link: '/api/' },
    ],
    sidebar: {
      '/tutorials/': [
        {
          text: 'チュートリアル (アーカイブ・英語)',
          items: [
            { text: 'Overview', link: '/tutorials/' },
            {
              text: '01 — Your first Supabase Auth test',
              link: '/tutorials/01-supabase-auth-first-test',
            },
            { text: '02 — RabbitMQ DLX test recipe', link: '/tutorials/02-rabbitmq-dlx-recipe' },
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
            { text: '13 — Search mock (Meilisearch / Algolia / Typesense)', link: '/tutorials/13-search' },
            { text: '14 — Telemetry mock (OpenTelemetry / Datadog / Sentry)', link: '/tutorials/14-observability' },
          ],
        },
        {
          text: 'AI-LLM 深化 (v1.15)',
          items: [
            { text: '16 — Multimodal chat (image + audio + Whisper)', link: '/tutorials/16-multimodal-chat' },
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
            { text: '104 — Perf strict mode (iter 400 + Welch |t|>3 + delta 10% + fail-fast release gate walkthrough)', link: '/tutorials/104-perf-strict' },
          ],
        },
        {
          text: 'DevSecOps adapter integration Phase 2 (v1.47)',
          items: [
          ],
        },
        {
          text: 'DevSecOps orchestrator Phase 3 (v1.48)',
          items: [
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
          ],
        },
        {
          text: 'Mobile 深化 II (v1.51、 pair 第 13 の 2 段目 Phase 2)',
          items: [
          ],
        },
        {
          text: 'Mobile 深化 III (v1.52、 pair 第 13 の 3 段目 Phase 3、 3 段拡張達成 5 例目 pair 深度 3 段記録、 30 milestone streak 突入)',
          items: [
          ],
        },
        {
          text: 'Mobile 深化 IV (v1.53、 pair 第 13 の 4 段目 Phase 4、 pair 深度 4 段拡張達成 4 例目 depth-4 record、 31 milestone streak)',
          items: [
          ],
        },
        {
          text: 'Mobile 深化 V (v1.54、 pair 第 13 の 5 段目 Phase 5、 pair 深度 5 段拡張 1 例目 candidate depth-5 pattern 新設、 32 milestone streak)',
          items: [
          ],
        },
        {
          text: 'Mobile 深化 VI (v1.55、 pair 第 13 の 6 段目 Phase 6、 depth-5 pattern 実装完成 kiwa milestone 史上初 6 段拡張、 33 milestone streak)',
          items: [
          ],
        },
        {
          text: 'Desktop new-base pair 第 14 (v1.56、 42 package 到達、 v2.0 milestone desktop adapter goal 達成、 34 milestone streak)',
          items: [
          ],
        },
        {
          text: 'Desktop 深化 I (v1.57、 v0.2 advanced 5 axis、 systematic pattern 32 度目、 35 milestone streak)',
          items: [
          ],
        },
        {
          text: 'Desktop 深化 II (v1.58、 v0.3 advanced III 4 axis、 systematic pattern 33 度目、 36 milestone streak、 Mobile v1.50-v1.52 rhythm 再現)',
          items: [
          ],
        },
        {
          text: 'Desktop 深化 III (v1.59、 v0.4 adapter layer + fidelity harness、 systematic pattern 34 度目、 37 milestone streak、 depth-4 record 5 例目、 Mobile v1.53 rhythm 再現)',
          items: [
          ],
        },
        {
          text: 'Desktop 深化 IV (v1.60、 v0.5 spawn stub 契約層、 systematic pattern 35 度目、 38 milestone streak、 depth-5 pattern 2 例目 candidate、 Mobile v1.54 rhythm 再現)',
          items: [
          ],
        },
        {
          text: 'Desktop 深化 V (v1.61、 v0.6 実 spawn 実装完成、 systematic pattern 36 度目、 39 milestone streak、 depth-5 pattern 2 例目確定 + depth-6 pattern 新設 kiwa milestone 史上初、 Mobile v1.55 rhythm 再現)',
          items: [
          ],
        },
        {
          text: 'Desktop 深化 VI (v1.62、 v0.7 real behavior runner + fidelity harness behavior diff early warning、 systematic pattern 37 度目、 40 milestone streak、 depth-7 pattern 新設 candidate)',
          items: [
          ],
        },
        {
          text: 'Desktop 深化 VII (v1.63、 v0.8 native binding availability probe + skip 経路、 systematic pattern 38 度目、 41 milestone streak、 depth-8 pattern 新設 candidate)',
          items: [
          ],
        },
        {
          text: 'Desktop 深化 VIII (v1.64、 v0.9 実 native binding 呼出、 systematic pattern 39 度目、 42 milestone streak、 depth-9 pattern 新設 candidate、 3 layer separation 完全 pay off)',
          items: [
          ],
        },
        {
          text: 'quality-metrics 深化 II (v1.65、 v0.5 historical trend tracking + drift detection、 systematic pattern 40 度突入、 43 milestone streak、 depth-5 pattern 3 例目確定 = 絶対的 rule 昇格 signal)',
          items: [
            { text: '125 — quality-metrics v0.5 history (captureSnapshot + compareToBaseline + detectDrift + generateTrendReport walkthrough)', link: '/tutorials/125-quality-metrics-history' },
          ],
        },
        {
          text: 'quality-metrics 深化 III (v1.66、 v0.6 evaluateReleaseGate に drift check opt-in 統合、 systematic pattern 41 度目、 44 milestone streak、 depth-5 pattern 3 例目確定 実運用 継続)',
          items: [
            { text: '126 — quality-metrics v0.6 drift-gate (driftEnabled + driftBaseline + driftThresholdPct + drift.{axis} blocker walkthrough)', link: '/tutorials/126-quality-metrics-drift-gate' },
          ],
        },
        {
          text: 'Desktop 深化 IX (v1.67、 v1.0 invoke-cache layer、 systematic pattern 42 度目、 45 milestone streak、 depth-6 pattern 2 例目確定 candidate)',
          items: [
          ],
        },
        {
          text: 'quality-metrics 深化 IV (v2.1、 adaptive drift threshold learning、 systematic pattern 44 度目、 47 milestone streak、 4 PR rhythm 復帰)',
          items: [
            { text: '128 — quality-metrics v2.1 adaptive threshold (learnAdaptiveThreshold + pickThresholdForAxis + statistical inference SSOT walkthrough)', link: '/tutorials/128-quality-metrics-adaptive-threshold' },
          ],
        },
        {
          text: 'Auth pair pioneer record 更新 (v2.2、 auth v0.7 continuous-auth state machine、 systematic pattern 45 度目 continuous state machine variant、 48 milestone streak、 Auth pair 4 段深化)',
          items: [
            { text: '129 — auth v0.7 continuous state machine (5 state SSOT + 4 段 risk level + interval 動的切替 + events log walkthrough)', link: '/tutorials/129-auth-continuous-state-machine' },
          ],
        },
        {
          text: 'Payment pair depth-5 到達 (v2.3、 payment v2.1 lifecycle-orchestrator、 depth-5 pattern 4 例目確定 = dominant pattern 昇格 confirmed、 systematic pattern 46 度目 continuous state machine variant Payment 転用、 49 milestone streak)',
          items: [
          ],
        },
        {
          text: 'Realtime pair depth-5 到達 (v2.4、 realtime v2.1 session-orchestrator、 depth-5 pattern 5 例目発生 = systematic law 昇格 candidate 到達、 systematic pattern 47 度目、 50 milestone streak)',
          items: [
            { text: '131 — realtime v2.1 session-orchestrator (5 state SSOT + 8 event SSOT + 40 セル 遷移表 + heartbeat 動的 QoS walkthrough)', link: '/tutorials/131-realtime-session-orchestrator' },
          ],
        },
        {
          text: 'Streaming pair depth-5 到達 (v2.5、 streaming v2.1 pipeline-orchestrator、 depth-5 pattern 6 例目発生 = **systematic law CONFIRMED**、 systematic pattern 48 度目、 51 milestone streak)',
          items: [
          ],
        },
        {
          text: 'Search pair depth-5 到達 (v2.6、 search v2.1 query-orchestrator、 depth-5 pattern 7 例目発生 = systematic law 継続強化、 systematic pattern 49 度目、 52 milestone streak)',
          items: [
            { text: '133 — search v2.1 query-orchestrator (5 state SSOT + 8 event SSOT + parsing/searching/reranking/facet walkthrough)', link: '/tutorials/133-search-query-orchestrator' },
          ],
        },
        {
          text: 'Observability pair depth-5 到達 (v2.7、 observability v2.1 incident-orchestrator、 depth-5 pattern 8 例目発生 = systematic law 継続強化 第 2 例、 **systematic pattern 50 度到達** milestone、 53 milestone streak)',
          items: [
            { text: '134 — observability v2.1 incident-orchestrator (5 state SSOT + 8 event SSOT + detecting/triaging/escalating/mitigating/resolved walkthrough)', link: '/tutorials/134-observability-incident-orchestrator' },
          ],
        },
        {
          text: 'Composition patterns (v2.8、 SaaS + backend + mobile + DevX + infra 26 lib composition)',
          items: [
          ],
        },
      ],
      '/concepts/': [
        {
          text: '設計概念 (アーカイブ・英語)',
          items: [
            { text: 'Multi-provider mock pattern (統一 interface で複数 provider を mock する)', link: '/concepts/multi-provider-mock' },
            { text: 'Lib composition pattern (26 lib を組合わせて real app test を書く)', link: '/concepts/lib-composition' },
            { text: 'AI-LLM testing (non-determinism SSOT)', link: '/concepts/ai-llm-testing' },
            { text: 'AI-LLM multimodal testing (image + audio + MCP + agent SSOT)', link: '/concepts/ai-llm-multimodal-testing' },
            { text: 'Realtime testing (time-axis mock SSOT)', link: '/concepts/realtime-testing' },
            { text: 'Search testing (ranking + typo tolerance SSOT)', link: '/concepts/search-testing' },
            { text: 'Telemetry testing (span + metric + log aggregation SSOT)', link: '/concepts/telemetry-testing' },
            { text: 'Component testing (story + CT + visual diff SSOT)', link: '/concepts/component-testing' },
            { text: 'Observability v2 testing (dashboard + alert + trace + correlation SSOT)', link: '/concepts/observability-v2-testing' },
            { text: 'Blockchain testing (chain state / EL client / fuzz / reorg SSOT)', link: '/concepts/blockchain-testing' },
            { text: 'Modern web framework testing (Signal reactivity / Islands / edge runtime + RPC type-safety SSOT)', link: '/concepts/modern-web-framework-testing' },
            { text: 'Auth protocol testing (virtual authenticator / PKCE+DPoP / id_token / discovery+federation SSOT)', link: '/concepts/auth-protocol-testing' },
            { text: 'Real driver testing (mock only / real-optional / real-required 3 execution modes SSOT)', link: '/concepts/real-driver-testing' },
            { text: 'Edge runtime testing (8-axis SSOT — Durable Object / WebSocket / edge KV / geo-replicated / Cron / subrequest / CPU / streaming)', link: '/concepts/edge-runtime-testing' },
            { text: 'Perf-testing SSOT (p50 / p95 / p99 + baseline persistence + regression detection + 3-layer harness + 33 package coverage)', link: '/concepts/perf-testing-ssot' },
            { text: 'Db advanced testing SSOT (8 axis — replication / CDC / logical replication / MVCC / RLS / connection pool / partitioning / vector store)', link: '/concepts/db-advanced-testing' },
            { text: 'Mutation testing SSOT (kill rate + 4-tier threshold + baseline persistence + 12-axis release gate)', link: '/concepts/mutation-testing-ssot' },
            { text: 'WebRTC / WebTransport / HTTP/3 testing (8-axis SSOT + P2P vs SFU + ICE trickle vs half-trickle + WebTransport vs WebSocket)', link: '/concepts/webrtc-webtransport-testing' },
            { text: 'A11y testing SSOT (WCAG 2.1 AA + 4-tier threshold + baseline persistence + 3-layer harness + 13-axis release gate)', link: '/concepts/a11y-testing-ssot' },
            { text: 'Database real-driver testing (16 axis SSOT + 3 provider × 3 backend × 16 axis = 144 cell grid + testcontainers pattern + KIWA_MODE=real env-gate)', link: '/concepts/database-real-driver-testing' },
            { text: 'Frontend real-driver testing (8 axis SSOT + 3 target × 8 axis = 24 cell grid + browser-shaped env-gate pattern + KIWA_MODE=real env-gate)', link: '/concepts/frontend-real-driver-testing' },
            { text: 'Observability real-driver testing (8 axis SSOT + 4 provider × 8 axis = 32 cell grid + provider _URL env-gate pattern + KIWA_MODE=real env-gate)', link: '/concepts/observability-real-driver-testing' },
            { text: 'Search real-driver testing (8 axis SSOT + 4 provider × 8 axis = 32 cell grid + provider _URL / _KEY env-gate pattern + KIWA_MODE=real env-gate)', link: '/concepts/search-real-driver-testing' },
            { text: 'Security real-driver testing (8 axis SSOT + 4 provider × 8 axis = 32 cell grid + provider _URL / _PATH env-gate pattern + KIWA_MODE=real env-gate)', link: '/concepts/security-real-driver-testing' },
            { text: 'AI-LLM real-driver testing (8 axis SSOT + 4 provider × 8 axis = 32 cell grid + provider _API_KEY + KIWA_LLM_BUDGET_USD budget guard + KIWA_MODE=real env-gate)', link: '/concepts/ai-llm-real-driver-testing' },
            { text: 'Security advanced II testing (v0.2 8 axis SSOT + 4 provider × 8 axis = 32 advanced cell grid + provider _URL / _TOKEN env-gate pattern + KIWA_MODE=real env-gate)', link: '/concepts/security-advanced-II-testing' },
            { text: 'AI-LLM advanced III testing (v0.5 8 axis SSOT + 4 provider × 8 axis = 32 advanced III cell grid + 16-axis combined harness + pair 深度 4 段 record + KIWA_MODE=real env-gate)', link: '/concepts/ai-llm-advanced-III-testing' },
            { text: 'Observability advanced III testing (v2.2 8 axis SSOT + 4 provider × 8 axis = 32 advanced III cell grid + 16-axis combined harness + pair 深度 4 段 3 例目 record + KIWA_MODE=real env-gate)', link: '/concepts/observability-advanced-III-testing' },
            { text: 'Edge / Serverless advanced testing (v1.2 8 axis SSOT + 3 platform × 8 axis = 24 advanced cell grid + 16-axis combined harness + pair 第 12 新規 base pair 導入 + KIWA_MODE=real env-gate)', link: '/concepts/edge-serverless-advanced-testing' },
            { text: 'Auth advanced III testing (v0.6 8 axis SSOT + 3 platform × 8 axis = 24 advanced cell grid + pair 第 1 pair 3 段拡張達成 record + KIWA_MODE=real env-gate)', link: '/concepts/auth-advanced-III-testing' },
            { text: 'Realtime advanced III testing (v0.3 8 axis SSOT + 3 protocol MoQ / WebCodecs / AI-media × 8 axis + pair 第 2 pair 3 段拡張達成 record + KIWA_MODE=real env-gate)', link: '/concepts/realtime-advanced-III-testing' },
            { text: 'Frontend advanced III testing (v1.49 6 axis SSOT + pair 深度 3 段 4 例目)', link: '/concepts/frontend-advanced-III-testing' },
            { text: 'quality-metrics v0.5 historical trend + drift (v1.65 history.ts 新設 6 type SSOT + captureSnapshot + compareToBaseline + detectDrift + generateTrendReport + axis 別 上昇=改善/悪化 判定 + shape 契約 preserving 絶対維持 + depth-5 pattern 3 例目確定 = 絶対的 rule 昇格 signal + systematic pattern 40 度突入)', link: '/concepts/quality-metrics-history' },
            { text: 'quality-metrics v0.6 evaluateReleaseGate に drift check opt-in 統合 (v1.66 ReleaseGateContext 3 新 field = driftBaseline + driftThresholdPct + driftEnabled + drift.{axis} blocker 1:1 格上げ + axesEvaluated +1 lane 加算 + default off backward compat 絶対維持 + shape 契約 preserving + depth-5 pattern 3 例目確定 実運用 継続 + systematic pattern 41 度目)', link: '/concepts/quality-metrics-drift-gate' },
            { text: 'quality-metrics v2.1 adaptive drift threshold learning (v2.1 threshold-learning.ts 新設 learnAdaptiveThreshold + pickThresholdForAxis + AdaptiveThreshold / AdaptiveThresholdReport type SSOT + 統計的異常検知 mean+k*stdev SSOT + axis 別独立学習 + baseline=0 Infinity 除外 + shape 契約 preserving + backward compat 絶対維持 + depth-5 実運用継続 3 例目 compound 深化 + systematic pattern 44 度目 statistical inference variant + 4 PR rhythm 復帰)', link: '/concepts/quality-metrics-adaptive-threshold' },
            { text: 'auth v0.7 continuous-auth 状態機械 (v2.2 continuous-auth.ts 新設 startContinuousAuth + scoreToLevel + evaluateRisk + completeStepUp + freezeSession + terminateContinuousAuth + 5 state SSOT monitoring/elevated/step-up-required/session-frozen/terminated + 4 段 risk level low/medium/high/critical + interval 動的切替 60_000ms/15_000ms + events log 累積 + guard clause + Auth pair v0.4 → v0.7 4 段深化 pioneer record 更新 + systematic pattern 45 度目 continuous state machine variant 8 原則統合)', link: '/concepts/auth-continuous-state-machine' },
            { text: 'realtime v2.1 session-orchestrator (v2.4 session-orchestrator.ts 新設 startSession + dispatchEvent + summarizeSession + 5 state SSOT connecting/subscribed/reconnecting/degraded/closed + 8 event SSOT + 40 セル 遷移表 + heartbeat 動的 QoS 3 回連続失敗 で degraded 降格 + soft-reject pattern + Realtime pair 5 段深化 = depth-5 pattern 5 例目発生 = systematic law 昇格 candidate 到達 + systematic pattern 47 度目 continuous state machine variant Realtime 転用)', link: '/concepts/realtime-session-orchestrator' },
            { text: 'search v2.1 query-orchestrator (v2.6 query-orchestrator.ts 新設 startQuery + dispatchQueryEvent + summarizeQuery + 5 state SSOT parsing/searching/reranking/facet-aggregating/completed + 8 event SSOT + query DSL + faceted + semantic + geo + relevance 継続合成 + Search pair 5 段深化 = depth-5 pattern 7 例目発生 systematic law 継続強化 + systematic pattern 49 度目 systematic law 継承 第 1 例)', link: '/concepts/search-query-orchestrator' },
            { text: 'observability v2.1 incident-orchestrator (v2.7 incident-orchestrator.ts 新設 startIncident + dispatchIncidentEvent + summarizeIncident + 5 state SSOT detecting/triaging/escalating/mitigating/resolved + 8 event SSOT + alert + escalation + AIOps + FinOps + chaos 継続合成 + Observability pair 5 段深化 = depth-5 pattern 8 例目発生 systematic law 継続強化 第 2 例 + **systematic pattern 50 度到達 milestone**)', link: '/concepts/observability-incident-orchestrator' },
            { text: 'auth v0.8 session-lifecycle-orchestrator', link: '/concepts/auth-session-lifecycle-orchestrator' },
            { text: 'cache v0.6 cache-lifecycle-orchestrator', link: '/concepts/cache-lifecycle-orchestrator' },
            { text: 'cli-test v0.6 cli-lifecycle-orchestrator', link: '/concepts/cli-test-lifecycle-orchestrator' },
            { text: 'orm v0.6 transaction-orchestrator', link: '/concepts/orm-transaction-orchestrator' },
            { text: 'queue v0.6 job-lifecycle-orchestrator', link: '/concepts/queue-job-lifecycle-orchestrator' },
            { text: 'kaname v0.1 3 layer specification model', link: '/concepts/kaname-3-layer-model' },
            { text: 'kaname skill (kiwa plugin 経由 dialog flow)', link: '/concepts/kaname-skill' },
            { text: 'lean v0.1 spec generator', link: '/concepts/lean-spec-generator' },
            { text: 'lean v0.2 verify integration', link: '/concepts/lean-verify-integration' },
          ],
        },
      ],
      '/migrations/': [
        {
          text: '移行ガイド (アーカイブ・英語)',
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
            { text: 'v1.61 → v1.62', link: '/migrations/v1.61-to-v1.62' },
            { text: 'v1.62 → v1.63', link: '/migrations/v1.62-to-v1.63' },
            { text: 'v1.63 → v1.64', link: '/migrations/v1.63-to-v1.64' },
            { text: 'v1.64 → v1.65', link: '/migrations/v1.64-to-v1.65' },
            { text: 'v1.65 → v1.66', link: '/migrations/v1.65-to-v1.66' },
            { text: 'v1.66 → v1.67', link: '/migrations/v1.66-to-v1.67' },
            { text: 'v1.67 → v2.0 (rename @kiwa-test/* → @kiwa/*)', link: '/migrations/v2.0-rename-plan' },
            { text: 'v2.0 → v2.1', link: '/migrations/v2.0-to-v2.1' },
            { text: 'v2.1 → v2.2', link: '/migrations/v2.1-to-v2.2' },
            { text: 'v2.2 → v2.3', link: '/migrations/v2.2-to-v2.3' },
            { text: 'v2.3 → v2.4', link: '/migrations/v2.3-to-v2.4' },
            { text: 'v2.4 → v2.5', link: '/migrations/v2.4-to-v2.5' },
            { text: 'v2.5 → v2.6', link: '/migrations/v2.5-to-v2.6' },
            { text: 'v2.6 → v2.7', link: '/migrations/v2.6-to-v2.7' },
            { text: 'v2.7 → v2.8', link: '/migrations/v2.7-to-v2.8' },
            { text: 'v2.8 → v2.9', link: '/migrations/v2.8-to-v2.9' },
            { text: 'v2.9 → v2.10', link: '/migrations/v2.9-to-v2.10' },
            { text: 'v2.10 → v2.11', link: '/migrations/v2.10-to-v2.11' },
            { text: 'v2.11 → v2.12', link: '/migrations/v2.11-to-v2.12' },
            { text: 'v2.12 → v2.13', link: '/migrations/v2.12-to-v2.13' },
            { text: 'v2.13 → v2.14', link: '/migrations/v2.13-to-v2.14' },
            { text: 'v2.14 → v2.15', link: '/migrations/v2.14-to-v2.15' },
            { text: 'v2.15 → v2.16', link: '/migrations/v2.15-to-v2.16' },
            { text: 'v2.16 → v2.17', link: '/migrations/v2.16-to-v2.17' },
            { text: 'v2.18 → v2.19', link: '/migrations/v2.18-to-v2.19' },
          ],
        },
      ],
      '/libraries/': librarySidebar,
      '/guides/': [
        {
          text: 'ガイド',
          items: [
            { text: '全体像', link: '/guides/' },
            { text: 'skill を使う', link: '/guides/skills' },
            { text: 'kiwa の考え方', link: '/guides/architecture' },
            { text: '文書を更新する', link: '/guides/library-docs' },
            { text: 'チュートリアル', link: '/tutorials/' },
            { text: 'テスト設計', link: '/concepts/test-taxonomy' },
            { text: '移行ガイド', link: '/migrations/' },
          ],
        },
      ],
      '/quality/': [
        {
          text: '品質',
          items: [
            { text: 'リリース基準', link: '/quality/release-gate' },
            { text: '品質レポート', link: '/quality-reports/' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API',
          items: [
            { text: '全体像', link: '/api/' },
            { text: 'テスト分類ガイド', link: '/api/test-taxonomy-guide' },
          ],
        },
        {
          text: 'SaaS',
          items: [
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
      text: 'GitHub で編集する',
    },
    footer: {
      message: 'Pre-release — All rights reserved. See LICENSE.',
      copyright: `© ${new Date().getFullYear()} cardene`,
    },
    search: {
      provider: 'local',
      options: {
        detailedView: true,
        translations: {
          button: { buttonText: 'kiwa を検索' },
        },
        // 索引に入れる前に本文を落とす。何をどこまで落とすかは searchSource が決める。
        async _render(src, env, md) {
          // 独自の描画を渡すと、frontmatter による除外は自分で見る必要がある。
          // 本文を落とすと frontmatter も一緒に消えるので、縮約する前の source から読む。
          if (excludedByFrontmatter(src)) return '';
          const html = md.render(searchSource(src, env.relativePath ?? ''), env);
          // 縮約しなかったページは env にも入るので、そちらでも見ておく。
          if (env.frontmatter?.search === false) return '';
          return html;
        },
      },
    },
  },
});
