/**
 * layer × module × example の対応表。
 *
 * `layer-test-output-resolves.test.ts` が `test_paths` の解決に、
 * `spec-path-anchor.test.ts` が `spec_path` の起点に使う。
 *
 * **2 つの検査で同じ表を使う**。 別々に持つと片方だけ更新されて、
 * 「解決するが仕様書が無い」 状態を検知できなくなる。
 *
 * 網羅の検査は `layer-test-output-resolves.test.ts` § roster が全 layer を覆う が持つ
 * (`docs/layers.json` の宣言から導くため、layer を足せばそちらが落ちる)。
 */
export const ROSTER = [
  { layer: 'contract', producer: 'kiwa-forge', module: 'defi-swap', example: 'defi-swap' },
  { layer: 'e2e', producer: 'kiwa-play', module: 'basic-connect', example: 'basic-connect' },
  { layer: 'api', producer: 'kiwa-api', module: 'items', example: 'nextjs-api-poc' },
  { layer: 'ui', producer: 'kiwa-ui', module: 'counter', example: 'react-component-poc' },
  { layer: 'data', producer: 'kiwa-data', module: 'orders', example: 'queue-poc' },
  { layer: 'cli', producer: 'kiwa-cli-test', module: 'kiwa-cli', example: 'cli-poc' },
  { layer: 'auth', producer: 'kiwa-auth', module: 'auth-flow', example: 'auth-lucia-poc' },
  { layer: 'cache', producer: 'kiwa-cache', module: 'session-cache', example: 'cache-redis-poc' },
  { layer: 'job-queue', producer: 'kiwa-queue', module: 'queue-flow', example: 'queue-bullmq-poc' },
  {
    layer: 'orm-query',
    producer: 'kiwa-orm',
    module: 'users-repo',
    example: 'orm-drizzle-sqlite-poc',
  },
  {
    layer: 'e2e-generic',
    producer: 'kiwa-e2e',
    module: 'reorg-4scenario',
    example: 'dogfood-dapp-e2e-reorg',
  },
  { layer: 'unit', producer: 'kiwa-vitest', module: 'token', example: 'vitest-unit-poc' },
  { layer: 'a11y', producer: 'kiwa-a11y', module: 'counter', example: 'react-component-poc' },
  {
    layer: 'edge-handler',
    producer: 'kiwa-edge',
    module: 'links',
    example: 'edge-handler-poc',
  },
  {
    layer: 'integration',
    producer: 'kiwa-api',
    module: 'inventory',
    example: 'nextjs-api-poc',
  },
  {
    layer: 'nextjs-server-action',
    producer: 'kiwa-nextjs',
    module: 'items',
    example: 'nextjs-app-router-full',
  },
  {
    layer: 'nextjs-middleware',
    producer: 'kiwa-nextjs',
    module: 'auth',
    example: 'nextjs-app-router-full',
  },
  {
    layer: 'nextjs-rsc',
    producer: 'kiwa-nextjs',
    module: 'items',
    example: 'nextjs-app-router-full',
  },
  {
    layer: 'nextjs-parallel-route',
    producer: 'kiwa-nextjs',
    module: 'items',
    example: 'nextjs-app-router-full',
  },
  {
    layer: 'nextjs-rsc-streaming',
    producer: 'kiwa-nextjs',
    module: 'items',
    example: 'nextjs-app-router-full',
  },
] as const;

export type RosterEntry = (typeof ROSTER)[number];
