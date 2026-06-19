/**
 * xero-auth.mjs — One-time OAuth 2.0 authorisation for Xero Web App.
 *
 * Usage: node scripts/xero/xero-auth.mjs
 *
 * On first run, prompts for Client ID + Secret and saves to xero.config.json.
 * Opens a browser window for Xero consent, catches the callback on localhost:3456,
 * exchanges the code for tokens, and saves them to .xero-tokens.json.
 */

import http from 'http';
import crypto from 'crypto';
import { exec } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createInterface } from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE = path.join(__dir, 'xero.config.json');
const TOKENS_FILE = path.join(__dir, '.xero-tokens.json');
const REDIRECT_URI = 'http://localhost:3456/callback';
const SCOPES = 'openid profile email offline_access accounting.transactions.read accounting.reports.read';

function loadConfig() {
  if (!existsSync(CONFIG_FILE)) return null;
  return JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
}

async function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

function generatePKCE() {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

async function exchangeCode(code, verifier, clientId, clientSecret) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: clientId,
    client_secret: clientSecret,
    code_verifier: verifier,
  });

  const res = await fetch('https://identity.xero.com/connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${res.status} — ${err}`);
  }

  const tokens = await res.json();
  tokens.expires_at = Date.now() + (tokens.expires_in - 60) * 1000;
  return tokens;
}

async function main() {
  console.log('── Xero Auth ─────────────────────────────────────────────────────');

  let config = loadConfig();
  if (!config) {
    console.log('No config found. Enter your Xero Web App credentials:\n');
    const clientId = await prompt('Client ID:     ');
    const clientSecret = await prompt('Client Secret: ');
    config = { clientId, clientSecret };
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    console.log(`\nSaved to ${CONFIG_FILE}`);
  } else {
    console.log(`Using config: ${CONFIG_FILE}`);
  }

  const state = crypto.randomBytes(16).toString('hex');
  const { verifier, challenge } = generatePKCE();

  const authUrl = new URL('https://login.xero.com/identity/connect/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('scope', SCOPES);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', challenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  console.log('\nStarting callback server on port 3456...');
  console.log('Opening browser for Xero authorisation...\n');

  await new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url, 'http://localhost:3456');
      if (url.pathname !== '/callback') { res.writeHead(404); res.end(); return; }

      const code = url.searchParams.get('code');
      const returnedState = url.searchParams.get('state');
      const error = url.searchParams.get('error');

      const html = (title, body) =>
        `<html><body style="font-family:sans-serif;padding:2rem"><h2>${title}</h2>${body}</body></html>`;

      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(html(`Auth error: ${error}`, '<p>Close this tab and check the error.</p>'));
        server.close();
        reject(new Error(`Xero returned error: ${error}`));
        return;
      }

      if (returnedState !== state) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(html('State mismatch', '<p>Possible CSRF. Try again.</p>'));
        server.close();
        reject(new Error('State mismatch in OAuth callback'));
        return;
      }

      try {
        const tokens = await exchangeCode(code, verifier, config.clientId, config.clientSecret);
        writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html('✓ Xero connected', '<p>Tokens saved. You can close this tab.</p>'));
        server.close();
        console.log('✓ Tokens saved to', TOKENS_FILE);
        console.log('\nRun next: node scripts/xero/xero-sync.mjs\n');
        resolve();
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(html('Error', `<pre>${err.message}</pre>`));
        server.close();
        reject(err);
      }
    });

    server.listen(3456, () => {
      const cmd = process.platform === 'win32'
        ? `start "" "${authUrl}"`
        : `open "${authUrl}"`;
      exec(cmd);
    });
  });
}

main().catch(err => { console.error('✗', err.message); process.exit(1); });
