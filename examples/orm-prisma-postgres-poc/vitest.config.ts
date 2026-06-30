import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

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
