export interface StoredScan {
  domain: string;
  scannedAt: string;
  subdomains: string[];
  subdomainCount: number;
}

const STORAGE_KEY = "am_i_secure_scan_history";
const MAX_ENTRIES = 10;

export function getScanHistory(): StoredScan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveScan(scan: StoredScan): void {
  const history = getScanHistory();
  const filtered = history.filter((h) => h.domain !== scan.domain);
  const updated = [scan, ...filtered].slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function getPreviousScan(domain: string): StoredScan | null {
  return getScanHistory().find((h) => h.domain === domain) ?? null;
}

export interface ScanDiff {
  added: string[];
  removed: string[];
}

export function compareScans(
  prev: StoredScan,
  current: string[]
): ScanDiff {
  const prevSet = new Set(prev.subdomains);
  const currSet = new Set(current);
  return {
    added: current.filter((s) => !prevSet.has(s)),
    removed: prev.subdomains.filter((s) => !currSet.has(s)),
  };
}
