import { test, expect, Page } from '@playwright/test';

const BASE = process.env['BASE_URL'] || 'http://localhost:8000';
const CO = 'https://co.artelonga.com.br';

type TrackCall = { name: string; props: Record<string, unknown> };

/** Inject an in-page spy. Works for tests that stay on the same URL. */
async function injectSpy(page: Page): Promise<void> {
    await page.evaluate(() => {
        (window as any)._al_calls = [];
        (window as any).AL_track = function (name: string, props: unknown) {
            (window as any)._al_calls.push({ name, props: props || {} });
        };
    });
}

async function getCalls(page: Page): Promise<TrackCall[]> {
    return page.evaluate(() => (window as any)._al_calls as TrackCall[]);
}

/**
 * Register a cross-navigation spy via exposeFunction (must call BEFORE page.goto).
 * Captures events even when the action triggers navigation away.
 */
async function setupCrossNavSpy(page: Page): Promise<TrackCall[]> {
    const calls: TrackCall[] = [];
    await page.exposeFunction('__alCapture__', (name: string, props: unknown) => {
        calls.push({ name, props: props as Record<string, unknown> });
    });
    return calls;
}

/** Wire AL_track to the cross-nav spy (call after page.goto). */
async function injectCrossNavSpy(page: Page): Promise<void> {
    await page.evaluate(() => {
        (window as any).AL_track = function (name: string, props: unknown) {
            (window as any).__alCapture__(name, props || {});
        };
    });
}

// ── Contact form events ────────────────────────────────────────────────────

test('funnel: lead_submit emitted on successful contact form POST', async ({ page }) => {
    await page.route(`${CO}/api/v1/leads`, r =>
        r.fulfill({ status: 200, body: JSON.stringify({ ok: true }), contentType: 'application/json' }));

    await page.goto(BASE + '/contato/');
    await injectSpy(page);

    await page.fill('#ct-nome', 'Fulano');
    await page.fill('#ct-precisa', 'Preciso de ajuda com carreira');
    await page.locator('label:has(input[name="canal"][value="email"])').click();
    await page.fill('#ct-contato', 'fulano@example.com');
    await page.click('.ct-submit');

    await page.waitForSelector('.ct-success.on');

    const calls = await getCalls(page);
    const ev = calls.find(c => c.name === 'lead_submit');
    expect(ev, 'lead_submit should be emitted').toBeDefined();
    expect(ev!.props).toMatchObject({ channel: 'email' });
});

test('funnel: lead_submit_failed emitted on contact form POST failure', async ({ page }) => {
    await page.route(`${CO}/api/v1/leads`, r =>
        r.fulfill({ status: 500, body: JSON.stringify({ error: 'server error' }), contentType: 'application/json' }));

    await page.goto(BASE + '/contato/');
    await injectSpy(page);

    await page.fill('#ct-nome', 'Fulano');
    await page.fill('#ct-precisa', 'Preciso de ajuda com carreira');
    await page.locator('label:has(input[name="canal"][value="whatsapp"])').click();
    await page.fill('#ct-contato', '+5511999999999');
    await page.click('.ct-submit');

    await page.waitForSelector('.ct-fallback.on');

    const calls = await getCalls(page);
    const ev = calls.find(c => c.name === 'lead_submit_failed');
    expect(ev, 'lead_submit_failed should be emitted').toBeDefined();
    expect(ev!.props).toMatchObject({ channel: 'whatsapp' });
});

// ── Signup flow events ─────────────────────────────────────────────────────

test('funnel: signup_request emitted on successful email submit', async ({ page }) => {
    await page.route(`${CO}/api/v1/auth/me`, r =>
        r.fulfill({ status: 401, body: '{}', contentType: 'application/json' }));
    await page.route(`${CO}/api/v1/auth/onboard-with-email`, r =>
        r.fulfill({ status: 200, body: JSON.stringify({ ok: true }), contentType: 'application/json' }));

    await page.goto(BASE + '/entrar/');
    await injectSpy(page);

    await page.fill('#email', 'test@example.com');
    await page.click('button[type=submit]');

    await page.waitForSelector('#al-code-step:not([hidden])');

    const calls = await getCalls(page);
    const ev = calls.find(c => c.name === 'signup_request');
    expect(ev, 'signup_request should be emitted').toBeDefined();
});

test('funnel: signup_verify_failed emitted on wrong code', async ({ page }) => {
    await page.route(`${CO}/api/v1/auth/me`, r =>
        r.fulfill({ status: 401, body: '{}', contentType: 'application/json' }));
    await page.route(`${CO}/api/v1/auth/onboard-with-email`, r =>
        r.fulfill({ status: 200, body: JSON.stringify({ ok: true }), contentType: 'application/json' }));
    await page.route(`${CO}/api/v1/auth/onboard-with-email/verify`, r =>
        r.fulfill({ status: 401, body: JSON.stringify({ error: 'bad code' }), contentType: 'application/json' }));

    await page.goto(BASE + '/entrar/');
    await injectSpy(page);

    await page.fill('#email', 'test@example.com');
    await page.click('button[type=submit]');
    await page.waitForSelector('#al-code-step:not([hidden])');

    await page.fill('#al-code', '000000');
    await page.click('#al-verify-btn');

    await page.waitForSelector('#al-verify-error:not([hidden])');

    const calls = await getCalls(page);
    const ev = calls.find(c => c.name === 'signup_verify_failed');
    expect(ev, 'signup_verify_failed should be emitted').toBeDefined();
});

test('funnel: signup_verify_success emitted on correct code', async ({ page }) => {
    // exposeFunction captures IPC before navigation destroys the JS context
    const trackCalls = await setupCrossNavSpy(page);

    await page.route(`${CO}/api/v1/auth/me`, r =>
        r.fulfill({ status: 401, body: '{}', contentType: 'application/json' }));
    await page.route(`${CO}/api/v1/auth/onboard-with-email`, r =>
        r.fulfill({ status: 200, body: JSON.stringify({ ok: true }), contentType: 'application/json' }));
    await page.route(`${CO}/api/v1/auth/onboard-with-email/verify`, r =>
        r.fulfill({ status: 200, body: JSON.stringify({ ok: true }), contentType: 'application/json' }));
    await page.route(BASE + '/', r =>
        r.fulfill({ status: 200, body: '<html><body><h1>Home</h1></body></html>', contentType: 'text/html' }));

    await page.goto(BASE + '/entrar/');
    await injectCrossNavSpy(page);

    await page.fill('#email', 'test@example.com');
    await page.click('button[type=submit]');
    await page.waitForSelector('#al-code-step:not([hidden])');

    await page.fill('#al-code', '123456');
    // click() waits for the triggered navigation to complete
    await page.click('#al-verify-btn');

    // Allow time for the CDP exposeFunction IPC to be delivered to Node.js
    await page.waitForTimeout(300);

    const ev = trackCalls.find(c => c.name === 'signup_verify_success');
    expect(ev, 'signup_verify_success should be emitted').toBeDefined();
});

test('funnel: signup_google_start emitted on Google button click', async ({ page }) => {
    const trackCalls = await setupCrossNavSpy(page);

    await page.route(`${CO}/api/v1/auth/me`, r =>
        r.fulfill({ status: 401, body: '{}', contentType: 'application/json' }));
    await page.route(`${CO}/api/v1/auth/google/**`, r =>
        r.fulfill({ status: 200, body: '<html><body><h1>Google mock</h1></body></html>', contentType: 'text/html' }));

    await page.goto(BASE + '/entrar/');
    await injectCrossNavSpy(page);

    // click() waits for the triggered navigation to complete
    await page.click('#al-google-btn');

    // Allow time for the CDP exposeFunction IPC to be delivered to Node.js
    await page.waitForTimeout(300);

    const ev = trackCalls.find(c => c.name === 'signup_google_start');
    expect(ev, 'signup_google_start should be emitted').toBeDefined();
});
