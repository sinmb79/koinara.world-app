import { ProofViewer } from "../components/ProofViewer";
import { useAppContext } from "../state/AppContext";

export function ResultPage() {
  const { sessions } = useAppContext();
  const readySessions = sessions.filter((entry) => entry.result || entry.proof);

  if (!readySessions.length) {
    return <div className="panel">Completed results will appear here after provider receipts are available.</div>;
  }

  return (
    <div className="stack">
      {readySessions.map((session) => (
        <section key={session.requestHash} className="panel">
          <div className="panel-header">
            <h2>Job #{session.jobId ?? "pending"}</h2>
            <span>
              {session.networkLabel} · {session.lastKnownState}
            </span>
          </div>
          <pre className="result-box">{JSON.stringify(session.result ?? "Pending receipt", null, 2)}</pre>
          <ProofViewer proof={session.proof} />
        </section>
      ))}
    </div>
  );
}
