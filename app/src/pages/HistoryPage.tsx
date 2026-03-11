import { useAppContext } from "../state/AppContext";

export function HistoryPage() {
  const { sessions } = useAppContext();

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>History</h2>
      </div>
      <table className="history-table">
        <thead>
          <tr>
            <th>Job</th>
            <th>State</th>
            <th>Token</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr key={session.requestHash}>
              <td>{session.jobId ?? "pending"}</td>
              <td>{session.lastKnownState}</td>
              <td>{session.selectedToken.toUpperCase()}</td>
              <td>{new Date(session.updatedAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
