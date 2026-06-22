import { useEffect, useState } from "react";
import { getErrorMessage } from "../../services/api";
import activityApi from "../../services/activityApi";

const StartSessionDock = ({ games = [], active, onStarted, showToast }) => {
  const [gameSlug, setGameSlug] = useState(games[0]?.slug || "valorant");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameSlug && games[0]?.slug) setGameSlug(games[0].slug);
  }, [gameSlug, games]);

  const start = async () => {
    if (!gameSlug) return;
    setLoading(true);
    try {
      await activityApi.start({ gameSlug });
      showToast?.("Session started");
      onStarted?.();
    } catch (error) {
      showToast?.(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="border-b border-white/10 pb-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-black text-white">{active ? `Tracking ${active.gameName}` : "Start a session"}</div>
          <div className="mt-1 text-xs text-zinc-500">Manual sessions sharpen recommendations and activity history.</div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            className="form-input min-w-[220px]"
            value={gameSlug}
            onChange={(event) => setGameSlug(event.target.value)}
            disabled={Boolean(active)}
            aria-label="Choose game to track"
          >
            {games.map((game) => (
              <option key={game.slug} value={game.slug}>
                {game.title}
              </option>
            ))}
          </select>
          <button type="button" className="btn-primary shrink-0" onClick={start} disabled={loading || Boolean(active) || !gameSlug}>
            {active ? "Session active" : "Start Session"}
          </button>
        </div>
      </div>
    </section>
  );
};

export default StartSessionDock;
