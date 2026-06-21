import { Link } from "react-router-dom";
import Badge from "../common/Badge";
import RankBadge from "../common/RankBadge";
import { gameInitials, getGameArt } from "../../utils/gameArt";
import { shortDateTime } from "../../utils/formatters";
import LobbyHostBadge from "./LobbyHostBadge";

const fitLabel = (score) => {
  if (score >= 88) return "Great fit";
  if (score >= 72) return "Good fit";
  if (score >= 55) return "Partial fit";
  return "Low fit";
};

const LobbyRow = ({ item, onJoin, requested = false }) => {
  const lobby = item.lobby;
  const openSlots = Math.max(0, (lobby.neededPlayers || 5) - (lobby.currentMembers?.length || 0));
  const isOpen = lobby.status === "open";
  const isFull = openSlots <= 0 || lobby.status === "full";
  const joinDisabled = requested || !isOpen || isFull;
  const joinLabel = isFull ? "Full" : requested ? "Requested" : !isOpen ? "Closed" : "Request Join";
  const art = getGameArt(lobby.game);
  const score = item.compatibility?.score;

  return (
    <article className="group grid gap-4 border-b border-white/10 py-5 last:border-b-0 lg:grid-cols-[76px_minmax(0,1fr)_190px_120px_90px_270px] lg:items-center">
      <div className="flex items-start gap-4 lg:block">
        <div className="relative h-24 w-[72px] shrink-0 overflow-hidden rounded-2xl bg-white/[0.06]">
          {art ? (
            <img
              src={art}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : null}
          <div className="grid h-full w-full place-items-center px-2 text-center text-lg font-black text-white">{gameInitials(lobby.game)}</div>
        </div>
        <div className="min-w-0 lg:hidden">
          <h3 className="text-lg font-black text-white">{lobby.title}</h3>
          <p className="mt-1 text-sm text-zinc-500">{lobby.game} · {lobby.mode} · {lobby.region}</p>
        </div>
      </div>

      <div className="min-w-0">
        <h3 className="hidden truncate text-lg font-black text-white lg:block">{lobby.title}</h3>
        <p className="mt-1 text-sm text-zinc-500">{lobby.game} · {lobby.mode} · {lobby.region} · {shortDateTime(lobby.startTime, "Starts when full")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <RankBadge rank={`${lobby.rankMin} - ${lobby.rankMax}`} />
          <Badge>{lobby.language || "Any language"}</Badge>
          <Badge tone={lobby.micRequired ? "info" : "default"}>{lobby.micRequired ? "Mic required" : "Mic optional"}</Badge>
          {(lobby.neededRoles || []).slice(0, 3).map((role) => <Badge key={role}>{role}</Badge>)}
        </div>
        {!!item.compatibility?.warnings?.length && (
          <p className="mt-3 line-clamp-1 text-xs font-semibold text-amber-200">{item.compatibility.warnings.join(" · ")}</p>
        )}
      </div>

      <LobbyHostBadge host={lobby.ownerId} />

      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-clutch-blue" />
          <span className="text-sm font-black text-white">{score ?? 68}%</span>
        </div>
        <div className="mt-1 text-xs text-zinc-500">{fitLabel(score ?? 68)}</div>
      </div>

      <div>
        <div className="text-xl font-black text-white">{isFull ? "Full" : openSlots}</div>
        <div className="text-xs text-zinc-500">{isFull ? "Squad" : "slots"}</div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
        <button type="button" disabled={joinDisabled} onClick={() => !joinDisabled && onJoin?.(lobby)} className="btn-primary py-2">
          {joinLabel}
        </button>
        <Link to={`/lobbies/${lobby._id}`} className="btn-secondary py-2">
          Details
        </Link>
        <Link to={`/squad/${lobby._id}`} className="btn-secondary py-2">
          Room
        </Link>
      </div>
    </article>
  );
};

export default LobbyRow;
