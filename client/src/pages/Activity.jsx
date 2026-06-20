import { useEffect, useState } from "react";
import PageShell from "../components/common/PageShell";
import ActiveSessionTimer from "../components/activity/ActiveSessionTimer";
import MostPlayedGames from "../components/activity/MostPlayedGames";
import PlaytimeSummary from "../components/activity/PlaytimeSummary";
import RecentSessions from "../components/activity/RecentSessions";
import StartPlayingPanel from "../components/activity/StartPlayingPanel";
import { useToast } from "../context/ToastContext";
import activityApi from "../services/activityApi";
import gameApi from "../services/gameApi";
import { getErrorMessage } from "../services/api";

const Activity = () => {
  const { showToast } = useToast();
  const [games, setGames] = useState([]);
  const [summary, setSummary] = useState({ aggregates: [], active: null, recentAnalysis: [] });
  const [sessions, setSessions] = useState([]);
  const [ending, setEnding] = useState(null);
  const [form, setForm] = useState({ result: "completed", teamworkScore: 75, communicationScore: 75, performanceScore: 75, notes: "" });

  const load = async () => {
    try {
      const [gamesResponse, summaryResponse, sessionsResponse] = await Promise.all([gameApi.list(), activityApi.summary(), activityApi.me()]);
      setGames(gamesResponse.data.data);
      setSummary(summaryResponse.data.data);
      setSessions(sessionsResponse.data.data);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  useEffect(() => {
    load();
  }, []);

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

  return (
    <PageShell fullWidth>
      <div className="mx-auto max-w-[1480px] space-y-8 px-1 py-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white">Activity</h1>
          <p className="mt-3 max-w-2xl text-zinc-400">Track playtime, end sessions with match notes, and build a useful ClutchQ history.</p>
        </div>
        <PlaytimeSummary aggregates={summary.aggregates} />
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <StartPlayingPanel games={games} onStarted={load} />
            <RecentSessions sessions={sessions} />
          </div>
          <aside className="space-y-6">
            <ActiveSessionTimer activity={summary.active} onEnd={setEnding} />
            <MostPlayedGames aggregates={summary.aggregates} />
          </aside>
        </div>

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
