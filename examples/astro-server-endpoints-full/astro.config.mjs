import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// SSR (output: 'server') が必須。 API Route は SSR の時のみ実行される (static では存在しない)。
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  server: { port: 3060 },
});
