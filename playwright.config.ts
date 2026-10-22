import { defineConfig } from '@playwright/test';
const browserPath = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env?.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
export default defineConfig({
  testDir: './tests/browser',
  use: { baseURL: 'http://127.0.0.1:5173', headless: true, launchOptions: { executablePath: browserPath, args: ['--enable-unsafe-swiftshader'] } },
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:5173', reuseExistingServer: true },
});
