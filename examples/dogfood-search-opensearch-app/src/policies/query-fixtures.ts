/**
 * Canonical relevance + synonym + index-management fixtures for the
 * dogfood app.
 *
 * The 3 fixture sets exercise the relevance + synonym-advanced +
 * index-management axes canonical production workloads —
 *  - `FIXTURE_ARTICLES` — English article corpus with BM25 / TF-IDF /
 *    custom ranking + A/B variant queries. Aligns with the OpenSearch
 *    OSS BM25 relevance tuning surface.
 *  - `FIXTURE_MULTILINGUAL` — multi-language synonym registry (en / ja
 *    / de / fr / es) with expand + phonetic + stemmer + typo queries.
 *  - `FIXTURE_CLUSTER` — 3-node cluster shard allocation + replica
 *    promote + rolling reindex + zero-downtime alias swap steps.
 *
 * Each fixture is small enough to inspect by eye in tests but wide
 * enough to catch off-by-one drift in scoring / expansion / shard
 * allocation. Content is chosen so BM25 relevance is stable: the term
 * "opensearch" occurs 3x, "search" 2x, "database" 1x — the canonical
 * BM25 ordering is opensearch > search > database.
 */

import type {
  Language,
  RelevanceDocument,
  SynonymEntry,
} from '../adapters/interface.js';

/** A relevance query fixture — 1 relevance request under test. */
export interface RelevanceQueryFixture {
  id: string;
  kind: 'bm25' | 'tfidf' | 'ab-variant';
  query?: string;
  variants?: readonly string[];
  userId?: string;
  salt?: string;
}

/** A synonym query fixture — 1 synonym request under test. */
export interface SynonymQueryFixture {
  id: string;
  kind: 'expand' | 'phonetic' | 'stemmer' | 'typo';
  query?: string;
  languages?: readonly Language[];
  candidates?: readonly string[];
  tokens?: readonly string[];
  language?: Language;
  dictionary?: readonly string[];
  maxDistance?: number;
}

/** A cluster step fixture — 1 index-management step under test. */
export interface ClusterStepFixture {
  id: string;
  kind: 'allocate' | 'promote' | 'reindex' | 'swap';
  shardId?: number;
  failedNode?: string;
  batchPercent?: number;
  newIndexId?: string;
}

/** A named fixture set with docs / synonyms / cluster config + query lists. */
export interface FixtureSet {
  id: string;
  label: string;
  relevanceDocuments: readonly RelevanceDocument[];
  relevanceQueries: readonly RelevanceQueryFixture[];
  synonymEntries: readonly SynonymEntry[];
  synonymQueries: readonly SynonymQueryFixture[];
  clusterConfig: {
    shardCount: number;
    replicaCount: number;
    nodes: readonly string[];
  };
  clusterSteps: readonly ClusterStepFixture[];
}

/**
 * Articles — 5 English documents ranked BM25 / TF-IDF on the query
 * `opensearch`. Term `opensearch` occurs 3x, `search` 2x, so the
 * canonical BM25 order is opensearch > search > database.
 */
export const FIXTURE_ARTICLES: FixtureSet = {
  id: 'articles',
  label: 'articles (BM25 + TF-IDF + custom ranking + A/B variant)',
  relevanceDocuments: [
    {
      id: 'a-opensearch-intro',
      content: 'OpenSearch is an open source search and analytics suite',
      boostSignal: 1.5,
    },
    {
      id: 'a-opensearch-cluster',
      content: 'OpenSearch cluster deployment with multiple nodes and replicas',
      boostSignal: 1.2,
    },
    {
      id: 'a-opensearch-query',
      content: 'OpenSearch query DSL supports boolean and nested queries',
      boostSignal: 1.0,
    },
    {
      id: 'a-search-basics',
      content: 'Search fundamentals include tokenization and inverted index',
      boostSignal: 0.9,
    },
    {
      id: 'a-database-overview',
      content: 'Databases store relational data with transactional guarantees',
      boostSignal: 0.5,
    },
  ],
  relevanceQueries: [
    { id: 'q-bm25-opensearch', kind: 'bm25', query: 'opensearch' },
    { id: 'q-tfidf-opensearch', kind: 'tfidf', query: 'opensearch' },
    { id: 'q-bm25-search', kind: 'bm25', query: 'search' },
    {
      id: 'q-ab-ranker',
      kind: 'ab-variant',
      variants: ['bm25', 'tfidf', 'custom'],
      userId: 'user-42',
      salt: 'articles-experiment-v1',
    },
  ],
  synonymEntries: [],
  synonymQueries: [],
  clusterConfig: { shardCount: 0, replicaCount: 0, nodes: [] },
  clusterSteps: [],
};

/**
 * Multilingual — 5 synonym entries across 5 languages (en / ja / de /
 * fr / es) plus stemmer / phonetic / typo query fixtures. Aligns with
 * OpenSearch OSS multi-analyzer surface.
 */
export const FIXTURE_MULTILINGUAL: FixtureSet = {
  id: 'multilingual',
  label: 'multilingual (expand + phonetic + stemmer + typo)',
  relevanceDocuments: [],
  relevanceQueries: [],
  synonymEntries: [
    {
      base: 'car',
      synonyms: ['automobile', 'vehicle'],
      language: 'en',
    },
    {
      base: 'quick',
      synonyms: ['fast', 'rapid', 'speedy'],
      language: 'en',
    },
    {
      base: '車',
      synonyms: ['自動車', 'クルマ'],
      language: 'ja',
    },
    {
      base: 'wagen',
      synonyms: ['auto', 'fahrzeug'],
      language: 'de',
    },
    {
      base: 'voiture',
      synonyms: ['automobile', 'auto'],
      language: 'fr',
    },
  ],
  synonymQueries: [
    {
      id: 'q-expand-car',
      kind: 'expand',
      query: 'car',
      languages: ['en', 'de'],
    },
    {
      id: 'q-phonetic-smith',
      kind: 'phonetic',
      query: 'smith',
      candidates: ['smyth', 'smithe', 'smit', 'jones', 'brown'],
    },
    {
      id: 'q-stemmer-running',
      kind: 'stemmer',
      tokens: ['running', 'jumped', 'quickly', 'apples'],
      language: 'en',
    },
    {
      id: 'q-typo-recieve',
      kind: 'typo',
      query: 'recieve',
      dictionary: ['receive', 'received', 'received', 'reception', 'reconcile'],
      maxDistance: 2,
    },
  ],
  clusterConfig: { shardCount: 0, replicaCount: 0, nodes: [] },
  clusterSteps: [],
};

/**
 * Cluster — 3-node OpenSearch cluster with 2 primary shards + 1
 * replica. Exercises the full rolling reindex + zero-downtime swap
 * lifecycle: allocate shards → promote a replica when the primary node
 * fails → advance the rolling reindex in 4 batches (25% each) → swap
 * alias to the new index.
 */
export const FIXTURE_CLUSTER: FixtureSet = {
  id: 'cluster',
  label: 'cluster (allocate + promote + reindex + swap)',
  relevanceDocuments: [],
  relevanceQueries: [],
  synonymEntries: [],
  synonymQueries: [],
  clusterConfig: {
    shardCount: 2,
    replicaCount: 1,
    nodes: ['node-a', 'node-b', 'node-c'],
  },
  clusterSteps: [
    { id: 's-allocate', kind: 'allocate' },
    {
      id: 's-promote-shard0',
      kind: 'promote',
      shardId: 0,
      failedNode: 'node-a',
    },
    { id: 's-reindex-25', kind: 'reindex', batchPercent: 25 },
    { id: 's-reindex-50', kind: 'reindex', batchPercent: 25 },
    { id: 's-reindex-75', kind: 'reindex', batchPercent: 25 },
    { id: 's-reindex-100', kind: 'reindex', batchPercent: 25 },
    {
      id: 's-swap',
      kind: 'swap',
      newIndexId: 'articles-v2',
    },
  ],
};

/** All 3 canonical fixture sets. */
export const ALL_FIXTURES: readonly FixtureSet[] = [
  FIXTURE_ARTICLES,
  FIXTURE_MULTILINGUAL,
  FIXTURE_CLUSTER,
];
