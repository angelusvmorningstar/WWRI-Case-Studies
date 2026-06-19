// Sync Miro user seats into rpRegister[*].subscriptions.miro
// Usage: node _miro_sync.js <get|put>
// Env: STORAGE_CONNECTION_STRING, MIRO_CSV (path to exported CSV)
const fs = require('fs');
const { BlobServiceClient } = require('@azure/storage-blob');

const CONTAINER = 'wwct';
const BLOB = 'workbook.json';
const MODE = process.argv[2] || 'get';
const MIRO_CSV = process.env.MIRO_CSV;
const BACKUP = process.env.BACKUP || '/tmp/wb-miro-backup.json';

// Maps normalised email local-part -> register name (null = skip / admin)
const NAME_MAP = {
  'anouk.deblieck': 'anouk de blieck',   // email local-part vs register spacing
  'robertbruce': 'robert bruce',          // whitewatertx.com account, no dot
  'angelus.morningstar': null,            // admin
  'bernard sso': null,                    // display-name fallback; email handles this correctly
};

function normEmail(email) {
  const local = String(email || '').toLowerCase().split('@')[0];
  const fromDots = local.replace(/\./g, ' ').trim();
  return Object.prototype.hasOwnProperty.call(NAME_MAP, local)
    ? NAME_MAP[local]
    : fromDots;
}

function normName(raw) {
  return String(raw || '').trim().toLowerCase().replace(/[^a-z ]/g, ' ').trim().replace(/ +/g, ' ');
}

function parseCSV(text) {
  const rows = []; let i = 0, field = '', row = [], inq = false;
  text = text.replace(/^﻿/, '');
  while (i < text.length) {
    const c = text[i];
    if (inq) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inq = false; }
      else field += c;
    } else {
      if (c === '"') inq = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\r') {}
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else field += c;
    }
    i++;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function buildMiroLookup() {
  if (!MIRO_CSV) throw new Error('MIRO_CSV env not set');
  const rows = parseCSV(fs.readFileSync(MIRO_CSV, 'utf-8'));
  const hdr = rows[0];
  const emailIdx = hdr.indexOf('E-mail');
  const licIdx = hdr.indexOf('License');
  const lookup = {};
  const skipped = [];
  for (let r = 1; r < rows.length; r++) {
    const email = rows[r][emailIdx]; if (!email) continue;
    const lic = rows[r][licIdx] || '';
    if (lic.toLowerCase() !== 'full') continue; // only Full licence seats
    const key = normEmail(email);
    if (key === null) { skipped.push(email); continue; }
    if (key !== undefined) lookup[key] = 'seat';
  }
  console.log(`Skipped (admin/non-seat): ${skipped.join(', ') || 'none'}`);
  return lookup;
}

function blobClient() {
  const conn = process.env.STORAGE_CONNECTION_STRING;
  if (!conn) throw new Error('STORAGE_CONNECTION_STRING not set');
  return BlobServiceClient.fromConnectionString(conn)
    .getContainerClient(CONTAINER)
    .getBlockBlobClient(BLOB);
}

async function download(c) {
  const d = await c.download(0);
  const chunks = [];
  for await (const ch of d.readableStreamBody) chunks.push(Buffer.isBuffer(ch) ? ch : Buffer.from(ch));
  return Buffer.concat(chunks).toString('utf-8');
}

(async () => {
  const c = blobClient();
  const raw = await download(c);
  fs.writeFileSync(BACKUP, raw, 'utf-8');
  const wb = JSON.parse(raw);
  const reg = wb.rpRegister || {};

  const miroLookup = buildMiroLookup();
  console.log(`Miro seated (Full licence): ${Object.keys(miroLookup).length}`);

  const changes = [];
  const unmatched = [];

  for (const rp of Object.values(reg)) {
    const nk = normName(rp.name);
    const inMiro = Object.prototype.hasOwnProperty.call(miroLookup, nk);
    const newVal = inMiro ? 'seat' : null;
    rp.subscriptions = rp.subscriptions || {};
    const oldVal = rp.subscriptions.miro !== undefined ? rp.subscriptions.miro : null;
    if (!inMiro) unmatched.push(rp.name);
    if (oldVal !== newVal) {
      changes.push({ name: rp.name, from: oldVal, to: newVal });
      if (MODE === 'put') rp.subscriptions.miro = newVal;
    }
  }

  console.log(`\n=== Register names with NO Miro seat (-> null): ${unmatched.length} ===`);
  unmatched.sort().forEach(n => console.log('  ' + n));

  console.log(`\n=== miro CHANGES (${changes.length}) ===`);
  changes.sort((a, b) => String(a.to).localeCompare(String(b.to)) || a.name.localeCompare(b.name))
    .forEach(ch => console.log(`  ${ch.name}: ${ch.from} -> ${ch.to}`));

  const seated = Object.values(reg).filter(rp => (rp.subscriptions || {}).miro === 'seat').length;
  console.log(`\nTotals: ${Object.keys(reg).length} register entries | Miro-seated: ${seated}`);

  if (MODE === 'put') {
    const buf = Buffer.from(JSON.stringify(wb, null, 2), 'utf-8');
    await c.upload(buf, buf.length, {
      blobHTTPHeaders: { blobContentType: 'application/json; charset=utf-8' },
      overwrite: true,
    });
    console.log(`\nPUT complete. ${changes.length} miro fields updated. Backup: ${BACKUP}`);
  } else {
    console.log(`\n(DRY RUN — no write. Backup: ${BACKUP})`);
  }
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
