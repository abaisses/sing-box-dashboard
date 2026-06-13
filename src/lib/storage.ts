export function loadStoredJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function saveStoredJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}
