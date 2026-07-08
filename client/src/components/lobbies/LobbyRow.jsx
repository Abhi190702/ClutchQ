import { Link } from "react-router-dom";
import { gameInitials, getGameArt } from "../../utils/gameArt";
import { formatServerDateTime } from "../../utils/formatters";
import { getLobbyState } from "../../utils/lobbyState";
import LobbyHostBadge from "./LobbyHostBadge";

const formatMode = (value) => String(value || "open").replace(/^\w/, (letter) => letter.toUpperCase());

const LobbyRow = ({ item, onJoin, requested = false }) => {
  const lobby = item.lobby;
  const state = getLobbyState(lobby, item.compatibility);
  const joinDisabled = requested || !state.canRequest;
  const joinLabel = requested ? "Requested" : state.joinLabel;
  const art = getGameArt(lobby.game);
  const schedule = formatServerDateTime(lobby.displayStartTime || lobby.startTime || lobby.createdAt || lobby.updatedAt);
  const rankRange = [lobby.rankMin, lobby.rankMax].filter(Boolean).join(" to ") || "Any rank";
  const roles = (lobby.neededRoles || []).slice(0, 3).join(" / ");
  const requirements = [
    { label: rankRange, className: "text-amber-100" },
    { label: lobby.language || "Any language", className: "text-zinc-300" },
    { label: lobby.micRequired ? "Mic required" : "Mic optional", className: lobby.micRequired ? "text-sky-200" : "text-zinc-400" },
    roles ? { label: roles, className: "text-zinc-400" } : null
  ].filter(Boolean);

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
          <p className="mt-1 text-sm text-zinc-500">{lobby.game} · {formatMode(lobby.mode)} · {lobby.region} · {schedule}</p>
        </div>
      </div>

      <div className="min-w-0">
        <h3 className="hidden truncate text-lg font-black text-white lg:block">{lobby.title}</h3>
        <p className="mt-1 text-sm text-zinc-500">{lobby.game} · {formatMode(lobby.mode)} · {lobby.region} · {schedule}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold">
          {requirements.map((part, index) => (
            <span key={part.label} className="inline-flex items-center gap-x-2">
              {index ? <span className="text-zinc-700">·</span> : null}
              <span className={part.className}>{part.label}</span>
            </span>
          ))}
        </div>
        {!!item.compatibility?.warnings?.length && (
          <p className="mt-3 line-clamp-1 text-xs font-semibold text-amber-200">{item.compatibility.warnings.join(" · ")}</p>
        )}
      </div>

      <LobbyHostBadge host={lobby.ownerId} />

      <div>
        <div className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-clutch-blue" />
          <span className="text-sm font-black text-white">{state.scoreLabel}</span>
        </div>
        <div className="mt-1 text-xs text-zinc-500">{state.fitLabel}</div>
      </div>

      <div>
        <div className="text-xl font-black text-white">{state.isFull ? "Full" : state.openSlots}</div>
        <div className="text-xs text-zinc-500">{state.isFull ? "Squad" : "slots"}</div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
        <button type="button" disabled={joinDisabled} title={state.disabledTitle} onClick={() => !joinDisabled && onJoin?.(lobby)} className="btn-primary rounded-2xl py-3">
          {joinLabel}
        </button>
        <Link to={`/lobbies/${lobby._id}`} className="px-3 py-3 text-sm font-black text-zinc-300 transition hover:text-white">
          Details
        </Link>
        <Link to={`/squad/${lobby._id}`} className="px-3 py-3 text-sm font-black text-zinc-300 transition hover:text-white">
          Room
        </Link>
      </div>
    </article>
  );
};

export default LobbyRow;
