import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/common/PageShell";
import { GAMES, LANGUAGES, RANKS, REGIONS, ROLES } from "../utils/constants";
import api, { getErrorMessage } from "../services/api";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

const getPrimaryGame = (profile) => profile?.games?.find((game) => game.isPrimary) || profile?.games?.[0];

const buildInitialForm = (profile) => {
  const primaryGame = getPrimaryGame(profile);

  return {
    title: "",
    game: primaryGame?.gameName || "Valorant",
    rankMin: primaryGame?.rank || "Gold 1",
    rankMax: primaryGame?.rank || "Platinum 2",
    region: profile?.region || "India",
    language: profile?.languages?.[0] || "English",
    micRequired: profile?.micAvailable ?? true,
    neededPlayers: 5,
    neededRoles: primaryGame?.roles?.length ? primaryGame.roles.slice(0, 5) : ["Duelist", "Controller", "Initiator", "Sentinel", "Flex"],
    startTime: "",
    mode: "competitive",
    description: ""
  };
};

const CreateLobby = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => buildInitialForm(profile));

  const toggleRole = (role) => {
    setForm((current) => ({
      ...current,
      neededRoles: current.neededRoles.includes(role) ? current.neededRoles.filter((item) => item !== role) : [...current.neededRoles, role]
    }));
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      showToast("Add a clear lobby title before creating the room.", "error");
      return;
    }

    setSaving(true);
    try {
      const response = await api.post("/lobbies", form);
      showToast("Lobby created");
      navigate(`/lobbies/${response.data.data._id}`);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const useProfileDefaults = () => {
    setForm((current) => ({
      ...buildInitialForm(profile),
      title: current.title,
      description: current.description,
      startTime: current.startTime
    }));
    showToast("Profile defaults applied");
  };

  const select = (name, label, options) => (
    <label>
      <span className="form-label">{label}</span>
      <select className="form-input" value={form[name]} onChange={(event) => setForm({ ...form, [name]: event.target.value })}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );

  return (
    <PageShell title="Create Lobby" eyebrow="Squad builder">
      <form onSubmit={submit} className="card grid gap-5 p-6 md:grid-cols-2">
        <div className="md:col-span-2 flex flex-col gap-3 rounded-md border border-clutch-border bg-clutch-panelSoft p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-clutch-text">Room setup</h2>
            <p className="mt-1 text-sm text-clutch-muted">Start with your profile, then adjust the details for this squad.</p>
          </div>
          <button type="button" className="btn-secondary" onClick={useProfileDefaults}>
            Use my profile defaults
          </button>
        </div>
        <label className="md:col-span-2">
          <span className="form-label">Lobby title</span>
          <input className="form-input" maxLength="80" placeholder="Example: Ranked stack with clean comms" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        </label>
        {select("game", "Game", GAMES)}
        {select("mode", "Mode", ["competitive", "casual", "scrim", "tournament"])}
        {select("rankMin", "Rank minimum", RANKS)}
        {select("rankMax", "Rank maximum", RANKS)}
        {select("region", "Region", REGIONS)}
        {select("language", "Language", LANGUAGES)}
        <label>
          <span className="form-label">Needed players</span>
          <input className="form-input" type="number" min="2" max="10" value={form.neededPlayers} onChange={(event) => setForm({ ...form, neededPlayers: Number(event.target.value) })} />
        </label>
        <label>
          <span className="form-label">Start time</span>
          <input className="form-input" type="datetime-local" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} />
        </label>
        <div className="md:col-span-2">
          <span className="form-label">Needed roles</span>
          <div className="flex flex-wrap gap-2">
            {ROLES.slice(0, 8).map((role) => (
              <button
                type="button"
                key={role}
                onClick={() => toggleRole(role)}
                className={`rounded-full border px-3 py-2 text-xs font-semibold ${
                  form.neededRoles.includes(role) ? "border-clutch-cyan bg-clutch-cyan/15 text-clutch-cyan" : "border-clutch-border bg-clutch-panelSoft text-clutch-muted"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-3 rounded-lg border border-clutch-border bg-clutch-panelSoft p-4 text-sm font-semibold">
          <input type="checkbox" checked={form.micRequired} onChange={(event) => setForm({ ...form, micRequired: event.target.checked })} />
          Mic required
        </label>
        <label className="md:col-span-2">
          <span className="form-label">Description</span>
          <textarea className="form-input min-h-28" maxLength="500" placeholder="Optional notes: roles, queue plan, voice expectations..." value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </label>
        <div className="md:col-span-2">
          <button disabled={saving} className="btn-primary" type="submit">{saving ? "Creating..." : "Create lobby"}</button>
        </div>
      </form>
    </PageShell>
  );
};

export default CreateLobby;
