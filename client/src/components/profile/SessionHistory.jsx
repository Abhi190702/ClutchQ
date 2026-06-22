import { shortDateTime } from "../../utils/formatters";

const SessionHistory = ({ sessions = [] }) => (
  <div className="card p-5">
    <h3 className="mb-4 text-lg font-semibold text-clutch-text">Session history</h3>
    <div className="space-y-3">
      {sessions.length ? (
        sessions.map((session) => (
          <div key={session._id} className="rounded-lg border border-clutch-border bg-clutch-panelSoft p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="font-bold text-clutch-text">{session.game}</div>
              <div className="text-xs text-clutch-muted">{shortDateTime(session.startedAt, "Time unknown")}</div>
            </div>
            <div className="mt-1 text-sm text-clutch-muted">Chemistry {session.chemistryScore ?? 0}% · {session.result || "Completed"}</div>
          </div>
        ))
      ) : (
        <p className="text-sm text-clutch-muted">No completed sessions yet.</p>
      )}
    </div>
  </div>
);

export default SessionHistory;
