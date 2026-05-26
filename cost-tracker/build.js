#!/usr/bin/env node
// Builds dist/cost-tracker.html — a single self-contained file that runs
// from file:// with no server. Bundles all ES modules, inlines CSS, vendored
// React/ReactDOM/htm UMD, the workbook seed, and the logo SVG as a data URI.

import * as esbuild from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function read(rel) {
  return fs.readFile(path.join(__dirname, rel), 'utf8');
}

async function readBin(rel) {
  return fs.readFile(path.join(__dirname, rel));
}

async function main() {
  process.stdout.write('Bundling src/app.js ... ');
  const bundle = await esbuild.build({
    entryPoints: [path.join(__dirname, 'src/app.js')],
    bundle: true,
    format: 'iife',
    globalName: 'WWCTApp',
    write: false,
    minify: true,
    platform: 'browser',
    target: ['es2020'],
    legalComments: 'none',
  });
  let appJs = bundle.outputFiles[0].text;
  console.log(`${appJs.length} bytes`);

  // Inline the logo as a data URI so it works from file://
  const logoSvg = await readBin('public/assets/logo.svg');
  const logoDataUri = `data:image/svg+xml;base64,${logoSvg.toString('base64')}`;
  appJs = appJs.replaceAll('public/assets/logo.svg', logoDataUri);

  const themeCss = await read('public/css/theme.css');
  const appCss   = await read('public/css/app.css');
  const printCss = await read('public/css/print-board.css');

  const reactJs    = await read('vendor/react.production.min.js');
  const reactDomJs = await read('vendor/react-dom.production.min.js');
  const htmJs      = await read('vendor/htm.umd.js');

  const seedJson = await read('seed/workbook-seed.json');
  // Validate JSON parses
  JSON.parse(seedJson);

  const buildTimestamp = new Date().toISOString();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>WWRI Subscription Cost Tracker</title>
<meta name="generator" content="cost-tracker build ${buildTimestamp}">
<style>
${themeCss}
${appCss}
${printCss}
</style>
</head>
<body>
<div id="root"></div>
<script>${reactJs}</script>
<script>${reactDomJs}</script>
<script>${htmJs}</script>
<script>
(function(){
  var htm = window.htm;
  window.__WWCT__ = Object.assign({ html: htm.bind(React.createElement) }, React);
  window.__WWCT_SEED__ = ${seedJson};
})();
</script>
<script>${appJs}</script>
<script>
WWCTApp.mount(document.getElementById('root'));
</script>
</body>
</html>
`;

  const outDir = path.join(__dirname, 'dist');
  await fs.mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, 'cost-tracker.html');
  await fs.writeFile(outFile, html);

  const stat = await fs.stat(outFile);
  console.log(`Built ${path.relative(__dirname, outFile)} (${(stat.size / 1024).toFixed(1)} KB)`);
}

main().catch(err => { console.error(err); process.exit(1); });
