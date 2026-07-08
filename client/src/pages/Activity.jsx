import { useCallback, useEffect, useMemo, useState } from "react";
import PageShell from "../components/common/PageShell";
import ErrorState from "../components/common/ErrorState";
import SkeletonCard from "../components/common/SkeletonCard";
import ActivityCalendarStrip from "../components/activity/ActivityCalendarStrip";
import ActivityHero from "../components/activity/ActivityHero";
import ActivityInsightPanel from "../components/activity/ActivityInsightPanel";
import FriendCompatibilityStrip from "../components/activity/FriendCompatibilityStrip";
import GameTimeSplit from "../components/activity/GameTimeSplit";
import GamingRhythmChart from "../components/activity/GamingRhythmChart";
import RecentGameTimeline from "../components/activity/RecentGameTimeline";
import StartSessionDock from "../components/activity/StartSessionDock";
import MatchWrapUpModal from "../components/intelligence/MatchWrapUpModal";
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
import intelligenceApi from "../services/intelligenceApi";
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
  const [rhythmIntel, setRhythmIntel] = useState(null);
  const [teammateFits, setTeammateFits] = useState([]);
  const [scorecardAnalyses, setScorecardAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(null);
  const [wrapUpSession, setWrapUpSession] = useState(null);
  const [form, setForm] = useState({ result: "completed", teamworkScore: 75, communicationScore: 75, performanceScore: 75, notes: "" });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [gamesResponse, summaryResponse, sessionsResponse, heatmapResponse, libraryResponse, friendsResponse, rhythmResponse, teammatesResponse, scorecardsResponse] = await Promise.all([
        gameApi.list(),
        activityApi.summary(),
        activityApi.me(),
        steamApi.getSteamHeatmap().catch(() => ({ data: { data: [] } })),
        steamApi.getSteamLibrary().catch(() => ({ data: { data: [] } })),
        steamApi.getSteamFriends().catch(() => ({ data: { data: [] } })),
        intelligenceApi.getMyRhythm().catch(() => ({ data: { data: null } })),
        intelligenceApi.getMyTeammates().catch(() => ({ data: { data: { matches: [] } } })),
        intelligenceApi.getMyScorecards().catch(() => ({ data: { data: [] } }))
      ]);
      setGames(gamesResponse.data.data || []);
      setSummary(summaryResponse.data.data || { aggregates: [], active: null, recentAnalysis: [] });
      setSessions(sessionsResponse.data.data || []);
      setSteamHeatmap(heatmapResponse.data.data || []);
      setSteamLibrary(libraryResponse.data.data || []);
      setSteamFriends(friendsResponse.data.data || []);
      setRhythmIntel(rhythmResponse.data.data || null);
      setTeammateFits(teammatesResponse.data.data?.matches || []);
      setScorecardAnalyses(scorecardsResponse.data.data || []);
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
      const response = await activityApi.stop(ending._id, form);
      showToast("Match saved. Wrap-up is ready.");
      setWrapUpSession(response.data.data?.activity || ending);
      setEnding(null);
      load();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const fallbackSeries = useMemo(() => buildPlaytimeSeries(sessions, steamHeatmap, 30), [sessions, steamHeatmap]);
  const series = useMemo(() => (rhythmIntel?.series?.length ? rhythmIntel.series : fallbackSeries), [fallbackSeries, rhythmIntel]);
  const fallbackSplit = useMemo(() => buildGameTimeSplit(summary.aggregates, steamLibrary), [summary.aggregates, steamLibrary]);
  const split = useMemo(() => (rhythmIntel?.gameMix?.length ? rhythmIntel.gameMix : fallbackSplit), [fallbackSplit, rhythmIntel]);
  const snapshot = useMemo(
    () => buildActivitySnapshot({ aggregates: summary.aggregates, sessions, steamLibrary, series }),
    [summary.aggregates, sessions, steamLibrary, series]
  );
  const fallbackFriends = useMemo(
    () => deriveFriendCompatibility({ steamFriends, sessions, profile }),
    [steamFriends, sessions, profile]
  );
  const compatibleFriends = teammateFits.length ? teammateFits : fallbackFriends;

  return (
    <PageShell fullWidth>
      <div className="space-y-8">
        <ActivityHero snapshot={snapshot} rhythmSummary={rhythmIntel?.summary} active={summary.active} onEndActive={setEnding}>
          <StartSessionDock games={games} active={summary.active} onStarted={load} compact />
        </ActivityHero>
        {error ? <ErrorState message={error} onRetry={load} /> : null}
        {loading ? (
          <div className="grid min-w-0 gap-7 xl:grid-cols-[minmax(0,1.85fr)_minmax(320px,0.95fr)]">
            <div className="space-y-6">
              <SkeletonCard rows={6} />
              <SkeletonCard rows={4} />
            </div>
            <aside className="space-y-6">
              <SkeletonCard rows={5} />
              <SkeletonCard rows={5} />
            </aside>
          </div>
        ) : (
          <>
            <div className="grid min-w-0 gap-7 xl:grid-cols-[minmax(0,1.85fr)_minmax(320px,0.95fr)]">
              <div className="min-w-0 space-y-6">
                <GamingRhythmChart series={series} />
                <ActivityCalendarStrip days={series} />
                <RecentGameTimeline sessions={sessions} analyses={scorecardAnalyses} />
              </div>
              <aside className="min-w-0 space-y-6">
                <ActivityInsightPanel snapshot={snapshot} split={split} insights={rhythmIntel?.insights || []} rhythmSummary={rhythmIntel?.summary} />
                <FriendCompatibilityStrip friends={compatibleFriends} />
                <GameTimeSplit items={split} />
              </aside>
            </div>
          </>
        )}

        {ending ? (
          <div className="fixed inset-0 z-50 grid place-items-end bg-black/75 p-0 sm:place-items-center sm:p-4">
            <form onSubmit={stop} className="w-full max-w-lg rounded-t-[22px] border border-[#33333a] bg-[#202024] p-5 shadow-2xl sm:rounded-[14px]">
              <h2 className="text-2xl font-black text-white">Finish match</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">Save the session first, then add scorecard stats and teammate feedback in the wrap-up.</p>
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
                <label>
                  <span className="form-label">Quick note</span>
                  <textarea className="form-input min-h-24" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
                </label>
              </div>
              <div className="mt-5 flex gap-3">
                <button type="submit" className="btn-primary">Open wrap-up</button>
                <button type="button" className="btn-secondary" onClick={() => setEnding(null)}>Cancel</button>
              </div>
            </form>
          </div>
        ) : null}
        {wrapUpSession ? (
          <MatchWrapUpModal
            session={wrapUpSession}
            teammates={teammateFits}
            onClose={() => {
              setWrapUpSession(null);
              load();
            }}
            onComplete={load}
          />
        ) : null}
      </div>
    </PageShell>
  );
};

export default Activity;
