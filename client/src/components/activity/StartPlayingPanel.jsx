import { useState } from "react";
import { useToast } from "../../context/ToastContext";
import activityApi from "../../services/activityApi";
import { getErrorMessage } from "../../services/api";

const StartPlayingPanel = ({ games = [], selectedGameSlug, onStarted }) => {
  const { showToast } = useToast();
  const [gameSlug, setGameSlug] = useState(selectedGameSlug || games[0]?.slug || "");
  const [loading, setLoading] = useState(false);

  const start = async () => {
    if (!gameSlug) return;
    setLoading(true);
    try {
      const response = await activityApi.start({ gameSlug });
      showToast("Playing session started");
      onStarted?.(response.data.data);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[10px] border border-[#2f2f36] bg-[#202024] p-5">
      <h3 className="text-lg font-black text-white">Start Playing</h3>
      <p className="mt-1 text-sm leading-6 text-zinc-400">Track a manual session, then rate the match to build your ClutchQ activity history.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <select className="form-input" value={gameSlug} onChange={(event) => setGameSlug(event.target.value)}>
          {games.map((game) => (
            <option key={game.slug} value={game.slug}>
              {game.title}
            </option>
          ))}
        </select>
        <button type="button" className="btn-primary shrink-0" onClick={start} disabled={loading || !gameSlug}>
          {loading ? "Starting..." : "Start Session"}
        </button>
      </div>
    </div>
  );
};

export default StartPlayingPanel;
