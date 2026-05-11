// LHCI assertions restored to `error` after AL-49 closed all baseline issues:
//  - color-contrast (axe): all grey text colors bumped to WCAG AA-compliant values
//  - CLS: logo img width/height set (prevents reflow), body padding-bottom inlined
//  - SEO: meta description added to /contato/ and JS-rendered pages
//  - Performance: CLS fix removes the main drag on perf score
//
// Remaining variance risk: shared GH Actions runner still has non-deterministic
// CPU; if a flaky run fails, re-run. LCP in particular can vary ±0.3s.
// If persistent failures occur, consider switching numberOfRuns to 5 for median
// or using a dedicated runner (see AL-49 Phase 5 notes).
//
// Reference: https://web.dev/articles/lighthouse-ci#configure-thresholds
module.exports = {
    ci: {
        collect: {
            url: [
                'http://localhost:8000/',
                'http://localhost:8000/parceiros/',
                'http://localhost:8000/yuri/',
                'http://localhost:8000/servicos/grafite/',
                'http://localhost:8000/contato/',
            ],
            numberOfRuns: 3,
        },
        assert: {
            assertions: {
                'categories:performance': ['error', { minScore: 0.9 }],
                'categories:accessibility': ['error', { minScore: 0.9 }],
                'categories:seo': ['error', { minScore: 0.95 }],
                'categories:best-practices': ['warn', { minScore: 0.9 }],
                'largest-contentful-paint': ['warn', { maxNumericValue: 2000 }],
                'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
                'total-byte-weight': ['warn', { maxNumericValue: 1500000 }],
            },
        },
        upload: { target: 'temporary-public-storage' },
    },
};
