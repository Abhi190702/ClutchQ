import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../components/common/PageShell";
import ErrorState from "../components/common/ErrorState";
import LobbyBoard from "../components/lobbies/LobbyBoard";
import LobbyFilters from "../components/lobbies/LobbyFilters";
import { useToast } from "../context/ToastContext";
import api, { getErrorMessage } from "../services/api";

const Lobbies = () => {
  const { showToast } = useToast();
  const [lobbies, setLobbies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requested, setRequested] = useState([]);
  const [filters, setFilters] = useState({ game: "", region: "", language: "", mode: "" });
  const clearFilters = () => setFilters({ game: "", region: "", language: "", mode: "" });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/lobbies");
      setLobbies(response.data.data);
    } catch (error) {
      const message = getErrorMessage(error);
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      lobbies.filter(({ lobby }) =>
        (!filters.game || lobby.game === filters.game) &&
        (!filters.region || lobby.region === filters.region) &&
        (!filters.language || lobby.language === filters.language) &&
        (!filters.mode || lobby.mode === filters.mode)
      ),
    [lobbies, filters]
  );

  const requestJoin = async (lobby) => {
    setRequested((current) => [...current, lobby._id]);
    try {
      await api.post("/requests", {
        type: "lobby",
        lobbyId: lobby._id,
        message: "I fit the lobby requirements and can fill a needed role."
      });
      showToast("Join request sent");
    } catch (error) {
      setRequested((current) => current.filter((id) => id !== lobby._id));
      showToast(getErrorMessage(error), "error");
    }
  };

  return (
    <PageShell fullWidth>
      <div className="space-y-7">
        <section className="flex flex-col gap-5 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="eyebrow mb-3">Squad Finder</div>
            <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">Open Lobbies</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
              Join ranked stacks, casual squads, and active voice-ready rooms.
            </p>
          </div>
          <Link to="/lobbies/create" className="btn-primary shrink-0">
            Create Lobby
          </Link>
        </section>

        <LobbyFilters filters={filters} onChange={setFilters} />
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <LobbyBoard items={filtered} loading={loading} onJoin={requestJoin} requested={requested} onClearFilters={clearFilters} />
        )}
      </div>
    </PageShell>
  );
};

export default Lobbies;
