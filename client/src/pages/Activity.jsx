import { useCallback, useEffect, useMemo, useState } from "react";
import PageShell from "../components/common/PageShell";
import ErrorState from "../components/common/ErrorState";
import ActivityCalendarStrip from "../components/activity/ActivityCalendarStrip";
import ActivityHero from "../components/activity/ActivityHero";
import ActivityInsightPanel from "../components/activity/ActivityInsightPanel";
import FriendCompatibilityStrip from "../components/activity/FriendCompatibilityStrip";
import GameTimeSplit from "../components/activity/GameTimeSplit";
import GamingRhythmChart from "../components/activity/GamingRhythmChart";
import RecentGameTimeline from "../components/activity/RecentGameTimeline";
import StartSessionDock from "../components/activity/StartSessionDock";
import {
  buildActivitySnapshot,
  buildGameTimeSplit,
  buildPlaytimeSeries,
  deriveFriendCompatibility
} from "../utils/activityInsights";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import activityApi from "../services/activityApi";
import gameApi from "../services/gameApi";
import { getErrorMessage } from "../services/api";
import steamApi from "../services/steamApi";

const Activity = () => {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [games, setGames] = useState([]);
  const [summary, setSummary] = useState({ aggregates: [], active: null, recentAnalysis: [] });
  const [sessions, setSessions] = useState([]);
  const [steamHeatmap, setSteamHeatmap] = useState([]);
  const [steamLibrary, setSteamLibrary] = useState([]);
  const [steamFriends, setSteamFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(null);
  const [form, setForm] = useState({ result: "completed", teamworkScore: 75, communicationScore: 75, performanceScore: 75, notes: "" });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [gamesResponse, summaryResponse, sessionsResponse, heatmapResponse, libraryResponse, friendsResponse] = await Promise.all([
        gameApi.list(),
        activityApi.summary(),
        activityApi.me(),
        steamApi.getSteamHeatmap().catch(() => ({ data: { data: [] } })),
        steamApi.getSteamLibrary().catch(() => ({ data: { data: [] } })),
        steamApi.getSteamFriends().catch(() => ({ data: { data: [] } }))
      ]);
      setGames(gamesResponse.data.data || []);
      setSummary(summaryResponse.data.data || { aggregates: [], active: null, recentAnalysis: [] });
      setSessions(sessionsResponse.data.data || []);
      setSteamHeatmap(heatmapResponse.data.data || []);
      setSteamLibrary(libraryResponse.data.data || []);
      setSteamFriends(friendsResponse.data.data || []);
    } catch (error) {
      const message = getErrorMessage(error);
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const stop = async (event) => {
    event.preventDefault();
    try {
      await activityApi.stop(ending._id, form);
      showToast("Match analysis saved");
      setEnding(null);
      load();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const series = useMemo(() => buildPlaytimeSeries(sessions, steamHeatmap, 30), [sessions, steamHeatmap]);
  const split = useMemo(() => buildGameTimeSplit(summary.aggregates, steamLibrary), [summary.aggregates, steamLibrary]);
  const snapshot = useMemo(
    () => buildActivitySnapshot({ aggregates: summary.aggregates, sessions, steamLibrary, series }),
    [summary.aggregates, sessions, steamLibrary, series]
  );
  const compatibleFriends = useMemo(
    () => deriveFriendCompatibility({ steamFriends, sessions, profile }),
    [steamFriends, sessions, profile]
  );

  return (
    <PageShell fullWidth>
      <div className="space-y-8">
        <ActivityHero snapshot={snapshot} active={summary.active} onEndActive={setEnding} />
        {error ? <ErrorState message={error} onRetry={load} /> : null}
        {loading ? (
          <div className="border-l border-white/10 py-5 pl-4 text-sm font-semibold text-zinc-400">Loading activity rhythm...</div>
        ) : null}
        <StartSessionDock games={games} active={summary.active} onStarted={load} />
        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-6">
            <GamingRhythmChart series={series} />
            <ActivityCalendarStrip days={steamHeatmap} />
            <RecentGameTimeline sessions={sessions} />
          </div>
          <aside className="min-w-0 space-y-6">
            <GameTimeSplit items={split} />
            <ActivityInsightPanel snapshot={snapshot} split={split} />
          </aside>
        </div>
        <FriendCompatibilityStrip friends={compatibleFriends} />

        {ending ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
            <form onSubmit={stop} className="w-full max-w-lg rounded-[10px] border border-[#33333a] bg-[#202024] p-5">
              <h2 className="text-2xl font-black text-white">End Match</h2>
              <p className="mt-2 text-sm text-zinc-400">Rate the session so ClutchQ can create a match analysis.</p>
              <div className="mt-5 grid gap-4">
                <label>
                  <span className="form-label">Result</span>
                  <select className="form-input" value={form.result} onChange={(event) => setForm({ ...form, result: event.target.value })}>
                    <option value="completed">Completed</option>
                    <option value="win">Win</option>
                    <option value="loss">Loss</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </label>
                {["teamworkScore", "communicationScore", "performanceScore"].map((field) => (
                  <label key={field}>
                    <span className="form-label">{field.replace("Score", " score")}</span>
                    <input className="form-input" type="number" min="0" max="100" value={form[field]} onChange={(event) => setForm({ ...form, [field]: Number(event.target.value) })} />
                  </label>
                ))}
                <label>
                  <span className="form-label">Notes</span>
                  <textarea className="form-input min-h-24" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
                </label>
              </div>
              <div className="mt-5 flex gap-3">
                <button type="submit" className="btn-primary">Save Match</button>
                <button type="button" className="btn-secondary" onClick={() => setEnding(null)}>Cancel</button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
};

export default Activity;
