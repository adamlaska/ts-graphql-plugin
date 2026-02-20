import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^(\.\.\/)+tsmodule$/,
        replacement: 'typescript',
      },
      {
        find: /^graphql$/,
        replacement: path.resolve(__dirname, 'node_modules/graphql/index.js'),
      },
    ],
  },
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'lib', '**/*.d.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['**/testing/**'],
      reporter: ['json', 'text'],
    },
  },
});
