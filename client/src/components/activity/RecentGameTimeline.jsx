import EmptyState from "../common/EmptyState";
import { formatMinutes, formatRating, formatSafeDateTime } from "../../utils/formatters";
import { gameInitials, getGameArt } from "../../utils/gameArt";

const RecentGameTimeline = ({ sessions = [] }) => (
  <section className="rounded-3xl bg-white/[0.035] p-6">
    <div className="flex items-end justify-between gap-4">
      <div>
        <div className="eyebrow mb-3">Previous games</div>
        <h2 className="text-2xl font-black text-white">Recent session timeline</h2>
      </div>
      <span className="text-sm font-semibold text-zinc-500">{sessions.length} tracked</span>
    </div>

    {sessions.length ? (
      <div className="mt-6 divide-y divide-white/10">
        {sessions.slice(0, 10).map((session) => {
          const image = getGameArt(session.gameName || session.gameSlug);
          return (
            <article key={session._id || `${session.gameName}-${session.startedAt}`} className="grid gap-4 py-4 sm:grid-cols-[56px_1fr_auto] sm:items-center">
              <div className="h-14 w-14 overflow-hidden rounded-2xl bg-white/[0.06]">
                {image ? (
                  <img
                    src={image}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : null}
                <div className="grid h-full w-full place-items-center text-sm font-black text-white">{gameInitials(session.gameName)}</div>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base font-black text-white">{session.gameName || "Unknown game"}</h3>
                  {session.result ? <span className="rounded-full bg-white/[0.07] px-2 py-1 text-xs font-bold uppercase text-zinc-300">{session.result}</span> : null}
                </div>
                <p className="mt-1 text-sm text-zinc-500">{formatSafeDateTime(session.startedAt, "Time unknown")} · {formatMinutes(session.durationMinutes)}</p>
                {session.notes ? <p className="mt-2 line-clamp-1 text-sm text-zinc-400">{session.notes}</p> : null}
              </div>
              <div className="text-left sm:text-right">
                <div className="text-lg font-black text-white">{formatRating(session.matchRating)}</div>
                <div className="text-xs text-zinc-500">rating</div>
              </div>
            </article>
          );
        })}
      </div>
    ) : (
      <EmptyState compact className="mt-5 border-white/10 bg-transparent" title="No sessions yet." description="Start a session to build a timeline of games, ratings, and notes." />
    )}
  </section>
);

export default RecentGameTimeline;
