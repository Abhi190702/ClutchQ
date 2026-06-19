import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/common/PageShell";
import Badge from "../components/common/Badge";
import ProfileCompleteness from "../components/profile/ProfileCompleteness";
import AvailabilityHeatmap from "../components/profile/AvailabilityHeatmap";
import PlaystyleRadar from "../components/profile/PlaystyleRadar";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { DEFAULT_PLAYSTYLE, GAMES, LANGUAGES, LOOKING_FOR, RANKS, REGIONS, ROLES } from "../utils/constants";
import { getRankValue } from "../utils/rankLogic";

const steps = ["Basic Identity", "Game and Rank", "Playstyle", "Availability", "Review Profile"];

const Onboarding = () => {
  const { user, profile, saveProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    displayName: profile?.displayName || user?.name || "",
    bio: profile?.bio || "",
    region: profile?.region || "India",
    country: profile?.country || "India",
    languages: profile?.languages || ["English", "Hindi"],
    micAvailable: profile?.micAvailable ?? true,
    discordTag: profile?.discordTag || "",
    gameName: profile?.games?.[0]?.gameName || "Valorant",
    rank: profile?.games?.[0]?.rank || "Gold 2",
    roles: profile?.games?.[0]?.roles || ["Duelist", "Flex"],
    playstyle: profile?.games?.[0]?.playstyle || "Aggressive",
    lookingFor: profile?.lookingFor || ["Rank Push", "Competitive", "Mic Only"],
    availability: profile?.availability || [],
    playstyleStats: profile?.playstyleStats || DEFAULT_PLAYSTYLE
  });

  const completeness = useMemo(() => {
    const checks = [
      form.displayName,
      form.bio,
      form.region,
      form.country,
      form.languages.length,
      form.discordTag,
      form.gameName,
      form.rank,
      form.roles.length,
      form.lookingFor.length,
      form.availability.length,
      form.playstyleStats
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form]);

  const toggleArray = (field, item) => {
    setForm((current) => ({
      ...current,
      [field]: current[field].includes(item) ? current[field].filter((value) => value !== item) : [...current[field], item]
    }));
  };

  const submit = async () => {
    setSaving(true);
    try {
      await saveProfile({
        displayName: form.displayName,
        bio: form.bio,
        region: form.region,
        country: form.country,
        languages: form.languages,
        micAvailable: form.micAvailable,
        discordTag: form.discordTag,
        lookingFor: form.lookingFor,
        games: [
          {
            gameName: form.gameName,
            rank: form.rank,
            rankValue: getRankValue(form.rank),
            roles: form.roles,
            playstyle: form.playstyle,
            isPrimary: true
          }
        ],
        availability: form.availability,
        playstyleStats: form.playstyleStats
      });
      showToast("Profile saved. Matchmaking is ready.");
      navigate("/dashboard");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const pillSelector = (field, values) => (
    <div className="flex flex-wrap gap-2">
      {values.map((item) => (
        <button
          type="button"
          key={item}
          onClick={() => toggleArray(field, item)}
          className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
            form[field].includes(item) ? "border-clutch-cyan bg-clutch-cyan/15 text-clutch-cyan" : "border-clutch-border bg-clutch-panelSoft text-clutch-muted"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );

  return (
    <PageShell title="Build your gamer profile" eyebrow="Onboarding">
      <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="space-y-4">
          <ProfileCompleteness value={completeness} />
          <div className="card p-4">
            <div className="space-y-2">
              {steps.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setStep(index)}
                  className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition ${
                    step === index ? "border-clutch-cyan/60 bg-clutch-cyan/10 text-clutch-cyan" : "border-clutch-border bg-clutch-panelSoft text-clutch-muted"
                  }`}
                >
                  <span className="font-bold">{label}</span>
                  <span>{index + 1}/5</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">{steps[step]}</h2>
            <Badge>{Math.round(completeness)}% Complete</Badge>
          </div>

          {step === 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="form-label">Display Name</label>
                <input className="form-input" value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} />
              </div>
              <div>
                <label className="form-label">Discord / Gamer Tag</label>
                <input className="form-input" value={form.discordTag} onChange={(event) => setForm({ ...form, discordTag: event.target.value })} />
              </div>
              <div>
                <label className="form-label">Region</label>
                <select className="form-input" value={form.region} onChange={(event) => setForm({ ...form, region: event.target.value })}>
                  {REGIONS.map((region) => <option key={region}>{region}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Country</label>
                <input className="form-input" value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="form-label">Bio</label>
                <textarea className="form-input min-h-28" value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="form-label">Languages</label>
                {pillSelector("languages", LANGUAGES)}
              </div>
              <label className="flex items-center gap-3 rounded-lg border border-clutch-border bg-clutch-panelSoft p-4 text-sm font-semibold">
                <input type="checkbox" checked={form.micAvailable} onChange={(event) => setForm({ ...form, micAvailable: event.target.checked })} />
                Mic available
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="form-label">Primary Game</label>
                <select className="form-input" value={form.gameName} onChange={(event) => setForm({ ...form, gameName: event.target.value })}>
                  {GAMES.map((game) => <option key={game}>{game}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Rank</label>
                <select className="form-input" value={form.rank} onChange={(event) => setForm({ ...form, rank: event.target.value })}>
                  {RANKS.map((rank) => <option key={rank}>{rank}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="form-label">Preferred Roles</label>
                {pillSelector("roles", ROLES)}
              </div>
              <div className="md:col-span-2">
                <label className="form-label">Looking For</label>
                {pillSelector("lookingFor", LOOKING_FOR)}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-4">
                {Object.entries(form.playstyleStats).map(([key, value]) => (
                  <label key={key} className="block">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold capitalize text-clutch-text">{key}</span>
                      <span className="text-clutch-cyan">{value}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={value}
                      onChange={(event) => setForm({ ...form, playstyleStats: { ...form.playstyleStats, [key]: Number(event.target.value) } })}
                      className="w-full"
                    />
                  </label>
                ))}
              </div>
              <PlaystyleRadar stats={form.playstyleStats} />
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="mb-4 text-sm text-clutch-muted">Click the cells when you usually queue. Demo user data uses 9 PM to midnight for strong seeded matches.</p>
              <AvailabilityHeatmap value={form.availability} onChange={(availability) => setForm({ ...form, availability })} />
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-clutch-border bg-clutch-panelSoft p-4">
                <div className="text-sm text-clutch-muted">Display</div>
                <div className="mt-1 text-xl font-semibold">{form.displayName}</div>
              </div>
              <div className="rounded-lg border border-clutch-border bg-clutch-panelSoft p-4">
                <div className="text-sm text-clutch-muted">Game</div>
                <div className="mt-1 text-xl font-semibold">{form.gameName} - {form.rank}</div>
              </div>
              <div className="rounded-lg border border-clutch-border bg-clutch-panelSoft p-4">
                <div className="text-sm text-clutch-muted">Roles</div>
                <div className="mt-1 font-bold">{form.roles.join(", ")}</div>
              </div>
              <div className="rounded-lg border border-clutch-border bg-clutch-panelSoft p-4">
                <div className="text-sm text-clutch-muted">Availability</div>
                <div className="mt-1 font-bold">{form.availability.length} queue hours</div>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-between gap-3">
            <button type="button" className="btn-secondary" disabled={step === 0} onClick={() => setStep((current) => current - 1)}>
              Back
            </button>
            {step < steps.length - 1 ? (
              <button type="button" className="btn-primary" onClick={() => setStep((current) => current + 1)}>
                Continue
              </button>
            ) : (
              <button type="button" className="btn-primary" disabled={saving} onClick={submit}>
                Save Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default Onboarding;
