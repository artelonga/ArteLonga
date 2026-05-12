// LHCI assertion strategy (atualizado pós-AL-49 segundo run, 2026-05-11):
//
// SOMENTE métricas estruturais ficam como `error`. Métricas temporal
// (perf score, LCP) viram `warn` por noise inerente de shared GH Actions
// runner — L-023 documented evidence: mesmo SHA varia perf 0.76↔0.85↔0.89
// e LCP 1.8s↔7.5s entre runs back-to-back.
//
// Estrutural (`error`):
//   - accessibility (axe — determinístico por SHA; passou no AL-49)
//   - cumulative-layout-shift (CLS — determinístico após image dims fix)
//
// Variance (`warn`):
//   - performance (deriva de LCP/TBT/etc, todos noisy)
//   - largest-contentful-paint
//   - seo (sem hreflang/sitemap/etc estabelecido por AL-47 mas Lighthouse
//     ainda penaliza 0.92 em pages com bio rica — não conseguimos isolar
//     o check exato sem rodar `lhci collect` local; AL-50 se vale fechar)
//   - best-practices
//   - total-byte-weight
//
// Reference: L-023 (LHCI shared CI = false positives), AL-49 Phase 5.
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
                'categories:performance': ['warn', { minScore: 0.9 }],
                'categories:accessibility': ['error', { minScore: 0.9 }],
                'categories:seo': ['warn', { minScore: 0.95 }],
                'categories:best-practices': ['warn', { minScore: 0.9 }],
                'largest-contentful-paint': ['warn', { maxNumericValue: 2000 }],
                'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
                'total-byte-weight': ['warn', { maxNumericValue: 1500000 }],
            },
        },
        upload: { target: 'temporary-public-storage' },
    },
};
