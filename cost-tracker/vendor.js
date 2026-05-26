#!/usr/bin/env node
// Vendor third-party UMD bundles into ./vendor/ for offline build.
// Run once: `npm run vendor`. Committed alongside the repo.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TARGETS = [
  { url: 'https://unpkg.com/react@18/umd/react.production.min.js',         file: 'react.production.min.js' },
  { url: 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js', file: 'react-dom.production.min.js' },
  { url: 'https://unpkg.com/htm@3/dist/htm.umd.js',                        file: 'htm.umd.js' },
];

async function main() {
  const vendorDir = path.join(__dirname, 'vendor');
  await fs.mkdir(vendorDir, { recursive: true });

  for (const t of TARGETS) {
    const dest = path.join(vendorDir, t.file);
    process.stdout.write(`Fetching ${t.url} → vendor/${t.file} ... `);
    const res = await fetch(t.url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const text = await res.text();
    await fs.writeFile(dest, text);
    console.log(`${text.length} bytes`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
