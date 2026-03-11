import { useEffect, useRef } from "react";
import type { AppJobSession } from "../types/appTypes";
import { isTerminalSession } from "../state/sessionStore";

const backoffSequence = [8000, 15000, 30000, 60000];

export function useJobPolling(options: {
  sessions: AppJobSession[];
  enabled: boolean;
  poller: (session: AppJobSession) => Promise<void>;
}) {
  const backoffIndexRef = useRef(0);

  useEffect(() => {
    if (!options.enabled) {
      return;
    }

    let timer: number | undefined;
    let cancelled = false;

    const run = async () => {
      const activeSessions = options.sessions.filter((entry) => entry.jobId && !isTerminalSession(entry));
      if (!activeSessions.length) {
        timer = window.setTimeout(run, 4000);
        return;
      }

      try {
        for (const session of activeSessions) {
          if (cancelled) {
            return;
          }
          await options.poller(session);
        }
        backoffIndexRef.current = 0;
        timer = window.setTimeout(run, 8000 + Math.floor(Math.random() * 600));
      } catch {
        backoffIndexRef.current = Math.min(backoffIndexRef.current + 1, backoffSequence.length - 1);
        timer = window.setTimeout(run, backoffSequence[backoffIndexRef.current]);
      }
    };

    timer = window.setTimeout(run, 4000);

    return () => {
      cancelled = true;
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [options]);
}
