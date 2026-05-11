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
                'largest-contentful-paint': ['error', { maxNumericValue: 2000 }],
                'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
                'total-byte-weight': ['warn', { maxNumericValue: 500000 }],
            },
        },
        upload: { target: 'temporary-public-storage' },
    },
};
