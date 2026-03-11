import type { AppErrorDescriptor } from "../types/appTypes";

export function classifyAppError(error: unknown): AppErrorDescriptor {
  const detail = error instanceof Error ? error.message : String(error);
  const lowered = detail.toLowerCase();

  if (lowered.includes("timeout") || lowered.includes("rate") || lowered.includes("network")) {
    return { bucket: "retryable", title: "Temporary network issue", action: "retry", detail };
  }
  if (
    lowered.includes("gas") ||
    lowered.includes("wallet") ||
    lowered.includes("discovery") ||
    lowered.includes("locked") ||
    lowered.includes("project id")
  ) {
    return { bucket: "recoverable", title: "Action needs attention", action: "settings", detail };
  }
  return { bucket: "fatal", title: "Unsupported or invalid state", action: "dismiss", detail };
}
