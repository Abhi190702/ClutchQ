import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../components/common/PageShell";
import EmptyState from "../components/common/EmptyState";
import ErrorState from "../components/common/ErrorState";
import SkeletonCard from "../components/common/SkeletonCard";
import LobbyCard from "../components/lobbies/LobbyCard";
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
    <PageShell
      title="Open Lobbies"
      eyebrow="Squad finder"
      actions={<Link to="/lobbies/create" className="btn-primary">Create Lobby</Link>}
    >
      <div className="space-y-6">
        <LobbyFilters filters={filters} onChange={setFilters} />
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : loading ? (
          <div className="grid gap-4 lg:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} rows={5} />)}</div>
        ) : filtered.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {filtered.map((item) => <LobbyCard key={item.lobby._id} item={item} onJoin={requestJoin} requested={requested.includes(item.lobby._id)} />)}
          </div>
        ) : (
          <EmptyState
            title="No open lobbies yet."
            description="Create the first squad for tonight and let ClutchQ explain the fit."
            action={<Link to="/lobbies/create" className="btn-primary">Create lobby</Link>}
          />
        )}
      </div>
    </PageShell>
  );
};

export default Lobbies;
