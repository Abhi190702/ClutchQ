import { shortDateTime } from "../../utils/formatters";

const RecentSessions = ({ sessions = [] }) => (
  <section className="rounded-[10px] border border-[#2f2f36] bg-[#202024] p-5">
    <h3 className="text-lg font-black text-white">Recent Sessions</h3>
    <div className="mt-4 grid gap-3">
      {sessions.length ? (
        sessions.slice(0, 8).map((session) => (
          <div key={session._id} className="flex flex-col gap-2 rounded-md border border-[#33333a] bg-[#18181c] p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-bold text-white">{session.gameName}</div>
              <div className="text-sm text-zinc-400">{shortDateTime(session.startedAt)} · {session.durationMinutes || 0} min</div>
            </div>
            <div className="text-sm font-bold text-zinc-200">Rating {session.matchRating || 0}</div>
          </div>
        ))
      ) : (
        <p className="text-sm text-zinc-400">No sessions yet. Start playing to build your history.</p>
      )}
    </div>
  </section>
);

export default RecentSessions;
