import type { WebJobSession } from "@koinara/shared";

const STORAGE_KEY = "koinara.site.sessions.v1";

export function loadSiteSessions(): WebJobSession[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as WebJobSession[];
    return parsed.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  } catch {
    return [];
  }
}

export function saveSiteSessions(sessions: WebJobSession[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sortSessions(sessions)));
}

export function sortSessions(sessions: WebJobSession[]): WebJobSession[] {
  return [...sessions].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}
