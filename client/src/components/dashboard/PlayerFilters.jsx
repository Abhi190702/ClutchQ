import { GAMES, REGIONS, ROLES } from "../../utils/constants";

const PlayerFilters = ({ filters, onChange }) => {
  const field = (name, label, options) => (
    <label>
      <span className="form-label">{label}</span>
      <select
        className="w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-clutch-text outline-none transition focus:border-clutch-blue/60"
        value={filters[name] || ""}
        onChange={(event) => onChange({ ...filters, [name]: event.target.value })}
      >
        <option value="">Any</option>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {field("game", "Game", GAMES)}
      {field("region", "Region", REGIONS)}
      {field("role", "Role", ROLES)}
    </div>
  );
};

export default PlayerFilters;
