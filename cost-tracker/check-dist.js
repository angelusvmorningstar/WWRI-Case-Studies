import fs from 'node:fs';
const html = fs.readFileSync('dist/cost-tracker.html', 'utf8');

const checks = [
  ['public/assets', /public\/assets/g],
  ['src=non-data', /src="(?!data:)([^"]+)"/g],
  ['href=non-data', /href="(?!data:)([^"]+)"/g],
  ['url(non-data', /url\(\s*(?!data:|'data:|"data:)([^)]+)\)/g],
  ['@import', /@import/g],
  ['iframe', /iframe/gi],
  ['new Worker', /new Worker/g],
  ['serviceWorker', /serviceWorker/g],
  ['createObjectURL', /createObjectURL/g],
  ['window.location =', /window\.location\s*=/g],
  ['window.open', /window\.open/g],
];

for (const [label, re] of checks) {
  const ms = [...html.matchAll(re)];
  console.log(`${label}: ${ms.length}`);
  if (ms.length && ms.length < 6) {
    ms.forEach(m => console.log('  ', m[0].slice(0, 120)));
  }
}
