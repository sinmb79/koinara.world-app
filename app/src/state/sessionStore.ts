import type { AppJobSession } from "../types/appTypes";

const storageKey = "koinara-app-sessions";

export function loadSessions(): AppJobSession[] {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return [];
  }
  return JSON.parse(raw) as AppJobSession[];
}

export function saveSessions(sessions: AppJobSession[]): void {
  localStorage.setItem(storageKey, JSON.stringify(sessions));
}

export function upsertSession(nextSession: AppJobSession): AppJobSession[] {
  const sessions = loadSessions();
  const index = sessions.findIndex((entry) => entry.requestHash === nextSession.requestHash);
  if (index >= 0) {
    sessions[index] = nextSession;
  } else {
    sessions.unshift(nextSession);
  }
  saveSessions(sessions);
  return sessions;
}

export function replaceSessions(sessions: AppJobSession[]): void {
  saveSessions(sessions);
}

export function isTerminalSession(session: AppJobSession): boolean {
  return ["Settled", "Rejected", "Expired"].includes(session.lastKnownState);
}
