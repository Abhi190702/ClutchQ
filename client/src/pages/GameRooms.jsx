import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageShell from "../components/common/PageShell";
import ErrorState from "../components/common/ErrorState";
import ActiveRoomsPanel from "../components/games/ActiveRoomsPanel";
import GameEmptyState from "../components/games/GameEmptyState";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import gameApi from "../services/gameApi";
import { getErrorMessage } from "../services/api";

const emptyRoom = (slug = "") => ({
  gameSlug: slug,
  title: "",
  mode: "Ranked Push",
  region: "India",
  language: "English",
  rankMin: "Gold 1",
  rankMax: "Platinum 2",
  micRequired: true,
  maxMembers: 5,
  neededRoles: [],
  tags: ["Mic Ready"]
});

const GameRooms = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [game, setGame] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(() => emptyRoom(slug));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [gameResponse, roomsResponse] = await Promise.all([gameApi.get(slug), gameApi.rooms(slug)]);
      setGame(gameResponse.data.data);
      setRooms(roomsResponse.data.data);
      setForm((current) => ({
        ...current,
        gameSlug: slug,
        title: current.title || `${gameResponse.data.data.title} ranked squad`,
        maxMembers: gameResponse.data.data.teamSize || 5,
        neededRoles: gameResponse.data.data.roles?.slice(0, 3) || []
      }));
    } catch (error) {
      const message = getErrorMessage(error);
      setError(message);
      showToast(message, "error");
    }
  }, [showToast, slug]);

  useEffect(() => {
    load();
  }, [load]);

  const createRoom = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await gameApi.createRoom(form);
      showToast("Game room created");
      setShowCreate(false);
      setForm(emptyRoom(slug));
      load();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  if (!game) {
    return (
      <PageShell fullWidth>
        <div className="mx-auto max-w-[1480px] py-8">
          {error ? <ErrorState message={error} onRetry={load} /> : <GameEmptyState title="Loading rooms" description="Preparing game room list." />}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell fullWidth>
      <div className="mx-auto max-w-[1480px] space-y-8 px-1 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white">{game.title} Rooms</h1>
            <p className="mt-3 max-w-2xl text-zinc-400">Join active squads, create a room, or wait for a compatible party.</p>
          </div>
          <button type="button" className="btn-primary" onClick={() => setShowCreate((value) => !value)}>
            {showCreate ? "Close" : "Create Room"}
          </button>
        </div>

        {showCreate ? (
          <form onSubmit={createRoom} className="rounded-[10px] border border-[#2f2f36] bg-[#202024] p-5">
            <h2 className="text-xl font-black text-white">Create {game.title} Room</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="md:col-span-2">
                <span className="form-label">Room title</span>
                <input className="form-input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
              </label>
              <label>
                <span className="form-label">Mode</span>
                <select className="form-input" value={form.mode} onChange={(event) => setForm({ ...form, mode: event.target.value })}>
                  {game.supportedModes?.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="form-label">Max members</span>
                <input className="form-input" type="number" min="2" max="16" value={form.maxMembers} onChange={(event) => setForm({ ...form, maxMembers: Number(event.target.value) })} />
              </label>
              {["region", "language", "rankMin", "rankMax"].map((field) => (
                <label key={field}>
                  <span className="form-label">{field}</span>
                  <input className="form-input" value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} />
                </label>
              ))}
              <label className="flex items-center gap-3 pt-6">
                <input type="checkbox" checked={form.micRequired} onChange={(event) => setForm({ ...form, micRequired: event.target.checked })} />
                <span className="text-sm font-bold text-zinc-200">Mic required</span>
              </label>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {game.roles?.map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`rounded-full border px-3 py-2 text-sm font-bold ${form.neededRoles.includes(role) ? "border-sky-400 bg-sky-400 text-black" : "border-[#33333a] text-zinc-300"}`}
                  onClick={() =>
                    setForm({
                      ...form,
                      neededRoles: form.neededRoles.includes(role) ? form.neededRoles.filter((item) => item !== role) : [...form.neededRoles, role]
                    })
                  }
                >
                  {role}
                </button>
              ))}
            </div>
            <button type="submit" className="btn-primary mt-5" disabled={loading}>
              {loading ? "Creating..." : "Create Room"}
            </button>
          </form>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <ActiveRoomsPanel rooms={rooms} user={user} onUpdated={load} />
          <aside className="space-y-4">
            <div className="rounded-[10px] border border-[#2f2f36] bg-[#202024] p-5">
              <h3 className="text-lg font-black text-white">Waiting Queue</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">Create a room if no current squad fits your region, rank, or role. Compatible players can join from the browse page.</p>
            </div>
            <div className="rounded-[10px] border border-[#2f2f36] bg-[#202024] p-5">
              <h3 className="text-lg font-black text-white">Quick Filters</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Open Lobby", "Ranked Push", "Casual Chill", "Mic Required", "Beginner Friendly", "Competitive"].map((tag) => (
                  <span key={tag} className="rounded-full border border-[#33333a] px-3 py-2 text-xs font-bold text-zinc-300">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </PageShell>
  );
};

export default GameRooms;
