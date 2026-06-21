import { gameGenres, gamePlatforms, gameTypes } from "../../data/gameCatalog";

const GameFilters = ({ filters, onChange }) => {
  const update = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <section className="border-y border-white/10 py-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-white">Filters</h3>
          <p className="mt-1 text-sm text-zinc-500">Narrow by platform, party size, room activity, or genre.</p>
        </div>
        <button type="button" className="text-xs font-bold text-zinc-400 hover:text-white" onClick={() => onChange({})}>
          Reset
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <label>
          <span className="form-label">Genre</span>
          <select className="form-input" value={filters.genre || ""} onChange={(event) => update("genre", event.target.value)}>
            <option value="">All genres</option>
            {gameGenres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="form-label">Platform</span>
          <select className="form-input" value={filters.platform || ""} onChange={(event) => update("platform", event.target.value)}>
            <option value="">All platforms</option>
            {gamePlatforms.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="form-label">Team size</span>
          <select className="form-input" value={filters.teamSize || ""} onChange={(event) => update("teamSize", event.target.value)}>
            <option value="">Any size</option>
            {[2, 3, 4, 5, 8, 10].map((size) => (
              <option key={size} value={size}>
                {size} players
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="form-label">Active rooms</span>
          <select className="form-input" value={filters.minRooms || ""} onChange={(event) => update("minRooms", event.target.value)}>
            <option value="">Any activity</option>
            {[5, 10, 15, 20].map((count) => (
              <option key={count} value={count}>
                {count}+ rooms
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="form-label">Game type</span>
          <select className="form-input" value={filters.type || ""} onChange={(event) => update("type", event.target.value)}>
            <option value="">All types</option>
            {gameTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
};

export default GameFilters;
