import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

// `.vitest-dist/tests/*.js` から書かれた `../prisma/generated/...` import が
// `.vitest-dist/prisma/generated/...` に向くため、 実 path に rewrite する。
export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^(.*)\/prisma\/generated(.*)$/,
        replacement: resolve(here, 'prisma/generated') + '$2',
      },
    ],
  },
});
