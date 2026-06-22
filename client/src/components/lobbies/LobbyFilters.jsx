import { GAMES, REGIONS, LANGUAGES } from "../../utils/constants";

const modes = ["competitive", "casual", "scrim", "tournament"];

const LobbyFilters = ({ filters, onChange }) => {
  const field = (name, label, options) => (
    <label className="min-w-[160px] flex-1">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-600">{label}</span>
      <select className="form-input border-white/10 bg-black/20" value={filters[name]} onChange={(event) => onChange({ ...filters, [name]: event.target.value })}>
        <option value="">Any</option>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );

  return (
    <div className="sticky top-[65px] z-20 border-y border-white/10 bg-clutch-bg/90 py-4 backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row">
      {field("game", "Game", GAMES)}
      {field("region", "Region", REGIONS)}
      {field("language", "Language", LANGUAGES)}
      {field("mode", "Mode", modes)}
      </div>
    </div>
  );
};

export default LobbyFilters;
