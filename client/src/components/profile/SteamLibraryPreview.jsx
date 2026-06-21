import { formatDate, formatHours } from "../../utils/formatters";
import { getGameImage } from "./profileDisplay";
import ProfileEmptyState from "./ProfileEmptyState";

const GameTile = ({ game }) => {
  const image = getGameImage(game);

  return (
    <div className="flex gap-3 rounded-md border border-clutch-border bg-clutch-bg/40 p-3">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-clutch-panelSoft">
        {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : null}
      </div>
      <div className="min-w-0">
        <h3 className="line-clamp-1 font-bold text-clutch-text">{game.name}</h3>
        <p className="mt-1 text-sm text-clutch-muted">{formatHours(game.playtimeForeverMinutes)} played</p>
        <p className="mt-1 text-xs text-clutch-muted">{game.lastPlayedAt ? `Last played ${formatDate(game.lastPlayedAt)}` : "No recent playtime"}</p>
      </div>
    </div>
  );
};

const SteamLibraryPreview = ({ library = [], recent = [], steamLinked = false, syncStatus, isDemo = false }) => {
  const totalMinutes = library.reduce((sum, game) => sum + (game.playtimeForeverMinutes || 0), 0);
  const unplayed = library.filter((game) => !game.playtimeForeverMinutes).length;
  const emptyTitle = steamLinked ? "Steam connected. Your public library is hidden or empty." : "Steam library is private or unavailable.";
  const emptyDescription = steamLinked
    ? syncStatus?.warnings?.[0] || "Set Steam Profile and Game Details to Public, then sync again."
    : "Connect Steam or make your Steam game details public, then sync again.";

  return (
    <section id="library" className="card p-5 md:p-6">
      <div className="flex flex-col gap-3 border-b border-clutch-border pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="eyebrow">Steam library</div>
          <h2 className="mt-2 text-2xl font-bold text-clutch-text">{isDemo ? "Demo library preview" : "Library preview"}</h2>
          <p className="mt-2 text-sm text-clutch-muted">
            {isDemo ? "Sample Steam data shown until a Steam account is connected." : "A compact snapshot of your public Steam games."}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md border border-clutch-border px-3 py-2">
            <div className="text-lg font-bold">{library.length}</div>
            <div className="text-[11px] text-clutch-muted">Games</div>
          </div>
          <div className="rounded-md border border-clutch-border px-3 py-2">
            <div className="text-lg font-bold">{formatHours(totalMinutes)}</div>
            <div className="text-[11px] text-clutch-muted">Playtime</div>
          </div>
          <div className="rounded-md border border-clutch-border px-3 py-2">
            <div className="text-lg font-bold">{unplayed}</div>
            <div className="text-[11px] text-clutch-muted">Unplayed</div>
          </div>
        </div>
      </div>
      {!library.length ? (
        <div className="mt-5">
          <ProfileEmptyState title={emptyTitle} description={emptyDescription} />
        </div>
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-clutch-muted">Top games</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {library.slice(0, 6).map((game) => <GameTile key={game.appId || game.name} game={game} />)}
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-clutch-muted">Recently active</h3>
            <div className="space-y-3">
              {(recent.length ? recent : library.slice(0, 4)).slice(0, 5).map((game) => <GameTile key={`recent-${game.appId || game.name}`} game={game} />)}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default SteamLibraryPreview;
