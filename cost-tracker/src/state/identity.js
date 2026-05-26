const KEY = 'wwct_user_name';

export function getAuthor() {
  return (localStorage.getItem(KEY) || '').trim();
}

export function setAuthor(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) throw new Error('Display name cannot be empty.');
  localStorage.setItem(KEY, trimmed);
  return trimmed;
}

export function hasAuthor() {
  return Boolean(getAuthor());
}
