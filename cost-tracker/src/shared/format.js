const AUD = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });
const AUD2 = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const PCT = new Intl.NumberFormat('en-AU', { style: 'percent', minimumFractionDigits: 1 });

export const fmt = {
  aud: v => AUD.format(v),
  aud2: v => AUD2.format(v),
  pct: v => PCT.format(v),
  date: iso => iso ? new Date(iso).toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' }) : '—',
  month: iso => iso ? new Date(iso).toLocaleDateString('en-AU', { year: 'numeric', month: 'short' }) : '—',
};
