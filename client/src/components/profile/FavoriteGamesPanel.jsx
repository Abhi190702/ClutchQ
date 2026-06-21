import { Link } from "react-router-dom";
import { formatHours } from "../../utils/formatters";
import { getGameImage } from "./profileDisplay";
import ProfileEmptyState from "./ProfileEmptyState";

const FavoriteGamesPanel = ({ favorites = [] }) => (
  <section id="favorites" className="card p-5 md:p-6">
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="eyebrow">Favorite games</div>
        <h2 className="mt-2 text-2xl font-bold text-clutch-text">Auto-detected squad fit</h2>
        <p className="mt-2 text-sm text-clutch-muted">Detected from public Steam playtime and recent activity.</p>
      </div>
      <Link to="/lobbies" className="btn-secondary">Find rooms</Link>
    </div>
    {!favorites.length ? (
      <div className="mt-5">
        <ProfileEmptyState title="No favorite games detected yet." description="Connect and sync Steam to let ClutchQ detect your main games." />
      </div>
    ) : (
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {favorites.map((item) => {
          const image = getGameImage(item.game);
          return (
            <div key={`${item.label}-${item.game?.appId || item.game?.name}`} className="overflow-hidden rounded-md border border-clutch-border bg-clutch-bg/40">
              <div className="aspect-[16/9] bg-clutch-panelSoft">
                {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : null}
              </div>
              <div className="p-4">
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-clutch-muted">{item.label}</div>
                <h3 className="mt-2 line-clamp-1 text-lg font-bold text-clutch-text">{item.game?.name}</h3>
                <p className="mt-2 text-sm text-clutch-muted">{item.reason || `${formatHours(item.game?.playtimeForeverMinutes)} total playtime`}</p>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </section>
);

export default FavoriteGamesPanel;
