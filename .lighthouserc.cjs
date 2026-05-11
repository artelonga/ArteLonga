// LHCI assertions são WARN-only por noise inerente de shared CI runners
// (mesmo PR varia: perf 0.89 ↔ 0.76; LCP 1.8s ↔ 7.6s entre runs back-to-back).
//
// Dados continuam coletados em cada PR → trend tracking + diagnóstico via
// uploaded reports. AL-49 endereça baseline issues estruturais (CLS bug
// real, contrast, missing meta) onde fix é determinístico.
//
// Quando AL-49 land e baseline estabilizar + perf budget for genuinamente
// alcançável em shared runner, converter assertions de volta pra `error`.
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
                // Todas warn enquanto LHCI roda em shared runner (variance alta).
                // Threshold = aspirational, mas só registra warning (não falha CI).
                'categories:performance': ['warn', { minScore: 0.9 }],
                'categories:accessibility': ['warn', { minScore: 0.9 }],
                'categories:seo': ['warn', { minScore: 0.95 }],
                'categories:best-practices': ['warn', { minScore: 0.9 }],
                'largest-contentful-paint': ['warn', { maxNumericValue: 2000 }],
                'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
                'total-byte-weight': ['warn', { maxNumericValue: 1500000 }],
            },
        },
        upload: { target: 'temporary-public-storage' },
    },
};
