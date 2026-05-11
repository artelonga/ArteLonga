import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Load data.js: it assigns globalThis.AL (window fallback in Node.js)
const require = createRequire(import.meta.url);
require(path.join(ROOT, 'assets/data.js'));
const AL = globalThis.AL;

const BASE = 'https://artelonga.com.br';
const urls = ['/'];

for (const p of AL.people) urls.push(`/${p.handle}/`);
for (const c of AL.communities) urls.push(`/${c.handle}/`);
for (const s of AL.services) {
    if (s.slug) urls.push(`/servicos/${s.slug}/`);
}
for (const m of AL.missions) urls.push(`/missoes/${m.handle}/`);
for (const sol of AL.solutions) {
    if (sol.internalLink !== false && (sol.url ?? '').startsWith('/')) {
        urls.push(`/solucoes/${sol.handle}/`);
    }
}
for (const p of AL.people) {
    for (const item of (p.portfolio || [])) {
        if (!item.draft) urls.push(`/${p.handle}/${item.slug}/`);
    }
}

const sorted = [...new Set(urls)].sort();

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sorted.map(u => `  <url><loc>${BASE}${u}</loc></url>`).join('\n')}
</urlset>`;

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');
console.log(`sitemap.xml gerado com ${sorted.length} URLs.`);
