import { GAMES, REGIONS, LANGUAGES } from "../../utils/constants";

const modes = ["competitive", "casual", "scrim", "tournament"];

const LobbyFilters = ({ filters, onChange }) => {
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
    <div className="card grid gap-4 p-5 md:grid-cols-4">
      {field("game", "Game", GAMES)}
      {field("region", "Region", REGIONS)}
      {field("language", "Language", LANGUAGES)}
      {field("mode", "Mode", modes)}
    </div>
  );
};

export default LobbyFilters;
