import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test',
  testMatch: '**/*.spec.ts',
  use: { baseURL: 'http://localhost:4173' },
  webServer: { command: 'npm run preview', url: 'http://localhost:4173/boilerplate.html', reuseExistingServer: true },
});
