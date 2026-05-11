import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    use: {
        trace: 'retain-on-failure',
    },
    webServer: {
        command: 'npx serve . -p 8000',
        url: 'http://localhost:8000',
        reuseExistingServer: true,
    },
    reporter: [
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
        ['list'],
    ],
});
