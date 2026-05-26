export async function loadWorkbookFromFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) { reject(new Error('No file selected.')); return; }

      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        validateWorkbook(parsed);
        resolve({ workbook: parsed, filename: file.name });
      } catch (e) {
        reject(e);
      }
    };

    input.oncancel = () => reject(new Error('File selection cancelled.'));
    input.click();
  });
}

export function saveWorkbookToDownload(workbook, filename) {
  const updated = { ...workbook, updatedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(updated, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'WWRI Cost Tracker.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return updated;
}

export function exportPrintView(mode = 'print-with-footnotes') {
  const MODES = ['print-numbers-only', 'print-with-footnotes', 'print-full-provenance'];
  MODES.forEach(m => document.body.classList.remove(m));
  document.body.classList.add(mode);
  window.print();
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateWorkbook(obj) {
  if (!obj || typeof obj !== 'object') throw workbookError('Root must be an object.');
  if (obj.schemaVersion !== 1)
    throw workbookError(`Unsupported schema version: ${obj.schemaVersion}. Expected 1.`);
  if (!obj.workbookId) throw workbookError('Missing field: workbookId');
  if (typeof obj.assumptions !== 'object')
    throw workbookError('Missing or invalid field: assumptions');
}

function workbookError(msg) {
  const e = new Error(`Invalid workbook: ${msg}`);
  e.code = 'INVALID_WORKBOOK';
  return e;
}
