import { STORAGE_KEYS } from "./storage-keys";

export function vid(): string | null {
  try { return localStorage.getItem(STORAGE_KEYS.VID); } catch { return null; }
}
export function setVid(value: string): void {
  try { localStorage.setItem(STORAGE_KEYS.VID, value); } catch {}
}
export function removeVid(): void {
  try { localStorage.removeItem(STORAGE_KEYS.VID); } catch {}
}

export function sid(): string | null {
  try { return sessionStorage.getItem(STORAGE_KEYS.SID); } catch { return null; }
}
export function setSid(value: string): void {
  try { sessionStorage.setItem(STORAGE_KEYS.SID, value); } catch {}
}
export function removeSid(): void {
  try { sessionStorage.removeItem(STORAGE_KEYS.SID); } catch {}
}

export function optOut(): boolean {
  try { return localStorage.getItem(STORAGE_KEYS.OPT_OUT) === "1"; } catch { return false; }
}
export function setOptOut(): void {
  try { localStorage.setItem(STORAGE_KEYS.OPT_OUT, "1"); } catch {}
}
export function removeOptOut(): void {
  try { localStorage.removeItem(STORAGE_KEYS.OPT_OUT); } catch {}
}

export function utm(): Record<string, string> | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.UTM);
    return raw !== null ? (JSON.parse(raw) as Record<string, string>) : null;
  } catch { return null; }
}
export function setUtm(value: Record<string, string>): void {
  try { sessionStorage.setItem(STORAGE_KEYS.UTM, JSON.stringify(value)); } catch {}
}
export function removeUtm(): void {
  try { sessionStorage.removeItem(STORAGE_KEYS.UTM); } catch {}
}

export function eventQueue(): unknown[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENT_QUEUE);
    return raw !== null ? (JSON.parse(raw) as unknown[]) : [];
  } catch { return []; }
}
export function saveEventQueue(queue: unknown[]): void {
  try { localStorage.setItem(STORAGE_KEYS.EVENT_QUEUE, JSON.stringify(queue)); } catch {}
}
export function removeEventQueue(): void {
  try { localStorage.removeItem(STORAGE_KEYS.EVENT_QUEUE); } catch {}
}
