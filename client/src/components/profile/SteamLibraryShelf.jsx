import { formatDate, formatHours } from "../../utils/formatters";
import { getGameImage } from "./profileDisplay";
import ProfileEmptyState from "./ProfileEmptyState";

const SteamLibraryShelf = ({ library = [], recent = [], steamLinked, syncStatus, onSyncSteam, syncing }) => {
  const source = library.length ? library : recent;
  const emptyTitle = steamLinked ? "Steam connected. Your public library is hidden or empty." : "Steam is not connected yet.";
  const emptyDescription = steamLinked
    ? syncStatus?.warnings?.[0] || "Set Steam Profile and Game Details to Public, then sync again."
    : "Connect Steam to make your game library part of your ClutchQ identity.";

  if (!source.length) {
    return (
      <ProfileEmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={steamLinked ? <button type="button" className="btn-secondary" onClick={onSyncSteam} disabled={syncing}>{syncing ? "Syncing..." : "Sync Steam"}</button> : null}
      />
    );
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-full gap-4">
        {source.slice(0, 8).map((game) => {
          const image = getGameImage(game);
          return (
            <article key={game.appId || game.name} className="group w-40 shrink-0">
              <div className="aspect-[3/4] overflow-hidden rounded-md bg-clutch-panelSoft">
                {image ? (
                  <img src={image} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                ) : (
                  <div className="grid h-full place-items-center px-4 text-center text-sm font-black text-clutch-muted">{game.name}</div>
                )}
              </div>
              <h3 className="mt-3 line-clamp-1 text-sm font-black text-clutch-text">{game.name}</h3>
              <p className="mt-1 text-xs text-clutch-muted">{formatHours(game.playtimeForeverMinutes)} played</p>
              <p className="mt-1 line-clamp-1 text-[11px] text-zinc-500">
                {game.lastPlayedAt ? `Last played ${formatDate(game.lastPlayedAt)}` : "No recent playtime"}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default SteamLibraryShelf;
