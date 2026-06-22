import { GAMES, REGIONS, ROLES } from "../../utils/constants";

const PlayerFilters = ({ filters, onChange }) => {
  const field = (name, label, options) => (
    <label>
      <span className="form-label">{label}</span>
      <select className="form-input" value={filters[name]} onChange={(event) => onChange({ ...filters, [name]: event.target.value })}>
        <option value="">Any</option>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );

  return (
    <div className="grid gap-4 border-y border-white/10 py-5 md:grid-cols-3">
      {field("game", "Game", GAMES)}
      {field("region", "Region", REGIONS)}
      {field("role", "Role", ROLES)}
    </div>
  );
};

export default PlayerFilters;
