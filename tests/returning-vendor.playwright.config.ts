import { defineConfig } from '@playwright/test';
import path from 'node:path';

const cwd = path.resolve(__dirname, '..');

export default defineConfig({
  testDir: './e2e', testMatch: ['returning-vendor.spec.ts', 'directory-registration.spec.ts'], workers: 1, fullyParallel: false,
  timeout: 60_000, expect: { timeout: 15_000 },
  use: { baseURL: 'http://127.0.0.1:4320', headless: true, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: [
    { cwd, command: 'node tests/fixtures/returning-vendor-server.mjs', url: 'http://127.0.0.1:4319/health', reuseExistingServer: false },
    { cwd, command: 'npx next dev --hostname 127.0.0.1 --port 4320', url: 'http://127.0.0.1:4320/vendors/returning', timeout: 120_000, reuseExistingServer: false,
      env: { NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:4319', NEXT_PUBLIC_SUPABASE_ANON_KEY:'test-anon-key',
        NEXT_TEST_DIST_DIR:'.next-vendor-tests',
        NEXT_PUBLIC_APP_URL:'http://127.0.0.1:4320', SUPABASE_SERVICE_ROLE_KEY:'test-service-role',
        RESEND_API_KEY:'test-resend-key', RESEND_BASE_URL:'http://127.0.0.1:4319',
        ADMIN_EMAIL:'admin@example.test', RESEND_FROM_EMAIL:'sender@example.test', GOOGLE_SHEET_WEBHOOK_URL:'' } },
  ],
});
