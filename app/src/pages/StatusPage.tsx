import { ProgressTracker } from "../components/ProgressTracker";
import { useAppContext } from "../state/AppContext";

export function StatusPage() {
  const { sessions, markExpired, claimRefund } = useAppContext();

  return (
    <div className="stack">
      {sessions.length === 0 ? <div className="panel">No jobs yet. Submit one from the Submit page.</div> : null}
      {sessions.map((session) => {
        const deadlinePassed = session.lastKnownState === "Open" && session.deadline * 1000 < Date.now();
        const canRefund = session.lastKnownState === "Rejected" || session.lastKnownState === "Expired";
        return (
          <div key={session.requestHash} className="panel">
            <ProgressTracker session={session} />
            <div className="inline-row">
              {deadlinePassed && session.jobId ? (
                <button type="button" onClick={() => void markExpired(session.jobId!, session.networkId)}>
                  Mark expired
                </button>
              ) : null}
              {canRefund && session.jobId ? (
                <button type="button" onClick={() => void claimRefund(session.jobId!, session.networkId)}>
                  Claim refund
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
