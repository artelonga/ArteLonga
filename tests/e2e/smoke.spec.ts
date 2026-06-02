import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BASE = process.env['BASE_URL'] || 'http://localhost:8000';

const pages = [
    { path: '/', h1: /Serviços|Marketplace/ },
    { path: '/parceiros/', h1: /Arte Longa é/ },
    { path: '/yuri/', h1: /yuri/i },
    { path: '/yuri/maes/', h1: /Mães/ },
    { path: '/kiyoshi/inocencia/', h1: /Inocência/ },
    { path: '/quilomboaraucaria/', h1: /Quilombo/ },
    { path: '/servicos/grafite/', h1: /Grafite/ },
    { path: '/contato/', h1: /Descreva/ },
    { path: '/design/', h1: /Design/ },
];

for (const p of pages) {
    test(`smoke + a11y: ${p.path}`, async ({ page }) => {
        const errors: string[] = [];
        page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

        const resp = await page.goto(BASE + p.path);
        expect(resp?.status()).toBe(200);

        // L-002: no fallback visible
        await expect(page.locator('text=Algo quebrou')).toHaveCount(0);

        // No JS errors
        expect(errors).toHaveLength(0);

        // Page-specific h1
        await expect(page.locator('h1')).toContainText(p.h1);

        // A11y: block on critical/serious only; moderate/minor documented separately.
        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();
        const blockers = results.violations.filter(
            v => v.impact === 'critical' || v.impact === 'serious',
        );
        expect(blockers, JSON.stringify(blockers.map(b => b.id), null, 2)).toHaveLength(0);
    });
}
