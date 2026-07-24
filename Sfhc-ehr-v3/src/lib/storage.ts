// ============================================================================
// localStorage persistence layer
// ============================================================================

const PREFIX = "sfhc-ehr:";
const VERSION_KEY = `${PREFIX}schema-version`;
const CURRENT_VERSION = "8.0.0";

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // storage full / unavailable — fail silently in demo
  }
}

export function remove(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}

export function getSchemaVersion(): string {
  return load<string>("schema-version", "0.0.0") as unknown as string || localStorage.getItem(VERSION_KEY) || "0.0.0";
}

export function setSchemaVersion(v: string = CURRENT_VERSION): void {
  save("schema-version", v);
}

export function uid(prefix = "id"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function clearAll(): void {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIX)) keys.push(k);
  }
  keys.forEach((k) => localStorage.removeItem(k));
}

export const SCHEMA_VERSION = CURRENT_VERSION;
export const STORAGE_PREFIX = PREFIX;
