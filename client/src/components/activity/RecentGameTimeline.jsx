import { useState } from "react";
import EmptyState from "../common/EmptyState";
import DetailDrawer from "../common/DetailDrawer";
import { formatMinutes, formatPercentage, formatRating, formatSafeDateTime } from "../../utils/formatters";
import { gameInitials, getGameArt } from "../../utils/gameArt";

const GameThumb = ({ image, gameName }) => {
  const [imageFailed, setImageFailed] = useState(false);

  if (image && !imageFailed) {
    return (
      <img
        src={image}
        alt={gameName || "Game"}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div className="grid h-full w-full place-items-center text-sm font-black text-white">
      {gameInitials(gameName)}
    </div>
  );
};

const formatConfidence = (value) => {
  if (value === undefined || value === null) return "";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";
  return formatPercentage(numeric <= 1 ? numeric * 100 : numeric);
};

const RecentGameTimeline = ({ sessions = [], analyses = [] }) => {
  const [selected, setSelected] = useState(null);
  const selectedAnalysis = selected ? analyses.find((item) => String(item.sessionId) === String(selected._id)) : null;

  return (
    <section className="border-b border-white/10 pb-6">
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
            const analysis = analyses.find((item) => String(item.sessionId) === String(session._id));
            const hasFeedback = [session.teamworkScore, session.communicationScore, session.performanceScore].some((value) => value !== undefined && value !== null);
            return (
              <article key={session._id || `${session.gameName}-${session.startedAt}`} className="grid gap-4 py-4 sm:grid-cols-[56px_1fr_auto] sm:items-center">
                <div className="h-14 w-14 overflow-hidden rounded-2xl bg-white/[0.06]">
                  <GameThumb image={image} gameName={session.gameName || session.gameSlug} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-base font-black text-white">{session.gameName || "Unknown game"}</h3>
                    {session.result ? <span className="rounded-full bg-white/[0.07] px-2 py-1 text-xs font-bold uppercase text-zinc-300">{session.result}</span> : null}
                    {analysis ? <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-bold text-emerald-100">scorecard</span> : null}
                    {hasFeedback ? <span className="rounded-full bg-sky-500/15 px-2 py-1 text-xs font-bold text-sky-100">feedback</span> : null}
                    {formatConfidence(analysis?.confidence) ? <span className="rounded-full bg-white/[0.06] px-2 py-1 text-xs font-bold text-zinc-300">{formatConfidence(analysis.confidence)} confidence</span> : null}
                  </div>
                  <p className="mt-1 text-sm text-zinc-500">{formatSafeDateTime(session.startedAt, "Time unknown")} · {formatMinutes(session.durationMinutes)}</p>
                  {analysis?.summary?.[0] ? <p className="mt-2 line-clamp-1 text-sm text-zinc-300">{analysis.summary[0]}</p> : null}
                  {session.notes ? <p className="mt-2 line-clamp-1 text-sm text-zinc-400">{session.notes}</p> : null}
                </div>
                <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
                  <div>
                    <div className="text-lg font-black text-white">{formatRating(session.matchRating)}</div>
                    <div className="text-xs text-zinc-500">rating</div>
                  </div>
                  <button type="button" className="btn-secondary py-2 text-sm" onClick={() => setSelected(session)}>
                    View details
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState compact className="mt-5" title="No sessions yet." description="Start a session to build a timeline of games, ratings, and notes." />
      )}

      <DetailDrawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.gameName || "Session details"}
        subtitle={selected ? `${formatSafeDateTime(selected.startedAt, "Time unknown")} · ${formatMinutes(selected.durationMinutes)}` : ""}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Result", selected?.result || "completed"],
              ["Rating", formatRating(selected?.matchRating)],
              ["Teamwork", selected?.teamworkScore ?? "--"],
              ["Comms", selected?.communicationScore ?? "--"]
            ].map(([label, value]) => (
              <div key={label} className="border-l border-white/10 pl-3">
                <div className="text-xl font-black text-white">{value}</div>
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-600">{label}</div>
              </div>
            ))}
          </div>
          {selectedAnalysis ? (
            <div className="rounded-[12px] border border-white/10 bg-white/[0.025] p-4">
              <div className="text-sm font-black text-white">Scorecard analysis</div>
              <div className="mt-2 text-sm text-zinc-400">
                Source {selectedAnalysis.source === "fallback" ? "lightweight analyzer" : selectedAnalysis.source || "analyzer"} · {formatConfidence(selectedAnalysis.confidence) || "Medium"} confidence
              </div>
              <div className="mt-3 space-y-2 text-sm leading-6 text-zinc-300">
                {(selectedAnalysis.summary || []).slice(0, 3).map((item) => <p key={item}>{item}</p>)}
              </div>
            </div>
          ) : null}
          {selected?.notes ? <p className="text-sm leading-6 text-zinc-300">{selected.notes}</p> : null}
        </div>
      </DetailDrawer>
    </section>
  );
};

export default RecentGameTimeline;
