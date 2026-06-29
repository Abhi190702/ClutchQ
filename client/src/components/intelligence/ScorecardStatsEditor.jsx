const commonResults = [
  { value: "completed", label: "Completed" },
  { value: "win", label: "Win" },
  { value: "loss", label: "Loss" },
  { value: "unknown", label: "Unknown" }
];

const fpsFields = [
  { key: "kills", label: "Kills" },
  { key: "deaths", label: "Deaths" },
  { key: "assists", label: "Assists" },
  { key: "damage", label: "Damage" },
  { key: "score", label: "Score" },
  { key: "durationMinutes", label: "Duration minutes" }
];

const battleRoyaleFields = [
  { key: "placement", label: "Placement" },
  { key: "kills", label: "Kills" },
  { key: "damage", label: "Damage" },
  { key: "assists", label: "Assists" },
  { key: "revives", label: "Revives" },
  { key: "durationMinutes", label: "Survival time minutes" },
  { key: "score", label: "Score" }
];

const isBattleRoyale = (gameName = "") => /bgmi|pubg|battle|royale|free fire/i.test(gameName);
const normalizeNumber = (raw) => {
  if (raw === "") return "";
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : "";
};

const ScorecardStatsEditor = ({ value, onChange, gameName = "" }) => {
  const update = (key, nextValue) => onChange?.({ ...value, [key]: nextValue });
  const fields = isBattleRoyale(gameName) ? battleRoyaleFields : fpsFields;

  return (
    <div className="rounded-[10px] border border-white/10 bg-white/[0.025] p-4">
      <div className="text-sm font-black text-white">Confirm match stats</div>
      <p className="mt-1 text-sm text-zinc-400">
        {isBattleRoyale(gameName) ? "Battle royale fields are tuned for placement, survival, and impact." : "FPS fields are tuned for impact, support, and consistency."}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label>
          <span className="form-label">Result</span>
          <select className="form-input" value={value.result || "completed"} onChange={(event) => update("result", event.target.value)}>
            {commonResults.map((result) => (
              <option key={result.value} value={result.value}>{result.label}</option>
            ))}
          </select>
        </label>
        {fields.map((field) => (
          <label key={field.key}>
            <span className="form-label">{field.label}</span>
            <input
              className="form-input"
              type="number"
              min="0"
              value={value[field.key] ?? ""}
              onChange={(event) => update(field.key, normalizeNumber(event.target.value))}
            />
          </label>
        ))}
      </div>
    </div>
  );
};

export default ScorecardStatsEditor;
