// Sync HubSpot user seats into rpRegister[*].subscriptions.hubspot
// Usage: node _hubspot_sync.js <get|put>
// Env: STORAGE_CONNECTION_STRING, HUBSPOT_TOKEN
const { BlobServiceClient } = require('@azure/storage-blob');
const https = require('https');
const fs = require('fs');

const CONTAINER = 'wwct';
const BLOB = 'workbook.json';
const MODE = process.argv[2] || 'get';
const BACKUP = process.env.BACKUP || '/tmp/wb-hubspot-backup.json';

// Normalise names derived from HubSpot email local-parts (firstname.lastname@...)
// Maps normalised local-part -> register name (null = skip / internal account)
const NAME_MAP = {
  'jeremy dcruz': 'jeremy d cruz',
  'eric vanantwerpen': 'eric van antwerpen',
  'derkjan koole': 'derk jan koole',
  'niel': 'niel malan',
  'jan soucek': 'jan sorcek',       // HubSpot spelling vs register spelling
  'joe zhou': 'joe "zhiyong" zhou', // HubSpot email local-part vs register display name
  'angelus morningstar': null,      // admin — not an RP seat
  'accounts': null,
  'info': null,
};

function normEmail(email) {
  const local = String(email || '').toLowerCase().split('@')[0];
  const fromDots = local.replace(/\./g, ' ').trim();
  return Object.prototype.hasOwnProperty.call(NAME_MAP, fromDots)
    ? NAME_MAP[fromDots]
    : fromDots;
}

function normName(raw) {
  return String(raw || '').trim().toLowerCase().replace(/[^a-z ]/g, ' ').trim().replace(/ +/g, ' ');
}

function get(url, token) {
  return new Promise((resolve, reject) => {
    const opts = {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    };
    https.get(url, opts, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf-8');
        if (res.statusCode !== 200) reject(new Error(`HubSpot ${res.statusCode}: ${body}`));
        else resolve(JSON.parse(body));
      });
    }).on('error', reject);
  });
}

async function fetchHubSpotUsers(token) {
  const users = [];
  let after = null;
  do {
    const url = `https://api.hubapi.com/settings/v3/users?limit=100${after ? `&after=${after}` : ''}`;
    const data = await get(url, token);
    users.push(...(data.results || []));
    after = data.paging && data.paging.next ? data.paging.next.after : null;
  } while (after);
  return users;
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
  const token = process.env.HUBSPOT_TOKEN;
  if (!token) throw new Error('HUBSPOT_TOKEN not set');

  const c = blobClient();
  const raw = await download(c);
  fs.writeFileSync(BACKUP, raw, 'utf-8');
  const wb = JSON.parse(raw);
  const reg = wb.rpRegister || {};

  console.log('Fetching HubSpot users...');
  const hsUsers = await fetchHubSpotUsers(token);
  console.log(`HubSpot returned ${hsUsers.length} users`);

  // Build lookup: normalised-name -> 'seat'
  const hsLookup = {};
  const skipped = [];
  for (const u of hsUsers) {
    const key = normEmail(u.email);
    if (key === null) { skipped.push(u.email); continue; }
    if (key !== undefined) hsLookup[key] = 'seat';
  }
  console.log(`Skipped (internal/admin): ${skipped.join(', ') || 'none'}`);

  const changes = [];
  const unmatched = [];

  for (const rp of Object.values(reg)) {
    const nk = normName(rp.name);
    const inHS = Object.prototype.hasOwnProperty.call(hsLookup, nk);
    const newVal = inHS ? 'seat' : null;
    rp.subscriptions = rp.subscriptions || {};
    const oldVal = rp.subscriptions.hubspot !== undefined ? rp.subscriptions.hubspot : null;
    if (!inHS) unmatched.push(rp.name);
    if (oldVal !== newVal) {
      changes.push({ name: rp.name, from: oldVal, to: newVal });
      if (MODE === 'put') rp.subscriptions.hubspot = newVal;
    }
  }

  console.log(`\n=== Register names with NO HubSpot user (-> null): ${unmatched.length} ===`);
  unmatched.sort().forEach(n => console.log('  ' + n));

  console.log(`\n=== hubspot CHANGES (${changes.length}) ===`);
  changes.sort((a, b) => String(a.to).localeCompare(String(b.to)) || a.name.localeCompare(b.name))
    .forEach(ch => console.log(`  ${ch.name}: ${ch.from} -> ${ch.to}`));

  const seated = Object.values(reg).filter(rp => (rp.subscriptions || {}).hubspot === 'seat').length;
  console.log(`\nTotals: ${Object.keys(reg).length} register entries | HubSpot-seated: ${seated}`);

  if (MODE === 'put') {
    const buf = Buffer.from(JSON.stringify(wb, null, 2), 'utf-8');
    await c.upload(buf, buf.length, {
      blobHTTPHeaders: { blobContentType: 'application/json; charset=utf-8' },
      overwrite: true,
    });
    console.log(`\nPUT complete. ${changes.length} hubspot fields updated. Backup: ${BACKUP}`);
  } else {
    console.log(`\n(DRY RUN — no write. Backup: ${BACKUP})`);
  }
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
