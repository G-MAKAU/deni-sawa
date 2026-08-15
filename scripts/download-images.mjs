import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'images');
mkdirSync(OUT, { recursive: true });

const IMAGES = {
  'learning-hero.jpg': 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600&q=80&auto=format&fit=crop',
  'exec-finance.jpg': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1600&q=80&auto=format&fit=crop',
  'governance.jpg': 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1600&q=80&auto=format&fit=crop',
  'resilience.jpg': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1600&q=80&auto=format&fit=crop',
  'recovery.jpg': 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=1600&q=80&auto=format&fit=crop',
  'network.jpg': 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1600&q=80&auto=format&fit=crop',
  'network-forum.jpg': 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=1600&q=80&auto=format&fit=crop',
  'about-team.jpg': 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&q=80&auto=format&fit=crop',
  'leadership.jpg': 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=1600&q=80&auto=format&fit=crop',
  'philosophy.jpg': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1600&q=80&auto=format&fit=crop',
  'experience.jpg': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&q=80&auto=format&fit=crop',
  'health-check.jpg': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&q=80&auto=format&fit=crop',
  'business-check.jpg': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1600&q=80&auto=format&fit=crop',
  'professional-check.jpg': 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=1600&q=80&auto=format&fit=crop',
  'investors.jpg': 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1600&q=80&auto=format&fit=crop',
  'investor-readiness.jpg': 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=1600&q=80&auto=format&fit=crop',
  'portfolio-oversight.jpg': 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1600&q=80&auto=format&fit=crop',
  'investor-rep.jpg': 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1600&q=80&auto=format&fit=crop',
  'method.jpg': 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1600&q=80&auto=format&fit=crop',
  'implement.jpg': 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1600&q=80&auto=format&fit=crop',
  'growth.jpg': 'https://images.unsplash.com/photo-1543286386-713bdd548da4?w=1600&q=80&auto=format&fit=crop',
  'strategy.jpg': 'https://images.unsplash.com/photo-1531973576160-7125cd663d86?w=1600&q=80&auto=format&fit=crop',
  'audit.jpg': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1600&q=80&auto=format&fit=crop',
};

function download(url, dest) {
  return new Promise((resolve) => {
    https
      .get(url, (res) => {
        const status = res.statusCode ?? 0;
        const ct = res.headers['content-type'] ?? '';
        if (status !== 200 || !ct.startsWith('image/')) {
          res.resume();
          resolve({ file: dest, ok: false, status, ct });
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          writeFileSync(dest, Buffer.concat(chunks));
          resolve({ file: dest, ok: true, status, ct, bytes: Buffer.concat(chunks).length });
        });
      })
      .on('error', (e) => resolve({ file: dest, ok: false, error: e.message }));
  });
}

const results = await Promise.all(
  Object.entries(IMAGES).map(([file, url]) => download(url, join(OUT, file)))
);

let okCount = 0;
for (const r of results) {
  if (r.ok) {
    okCount++;
    console.log(`OK   ${r.file} (${r.bytes} bytes)`);
  } else {
    console.log(`FAIL ${r.file} ${r.status ?? ''} ${r.ct ?? r.error ?? ''}`);
  }
}
console.log(`\n${okCount}/${results.length} downloaded`);
