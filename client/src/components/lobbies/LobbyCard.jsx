import { Link } from "react-router-dom";
import Badge from "../common/Badge";
import RankBadge from "../common/RankBadge";
import LobbyCompatibility from "./LobbyCompatibility";
import { shortDateTime } from "../../utils/formatters";

const LobbyCard = ({ item, onJoin, requested = false }) => {
  const lobby = item.lobby;
  const openSlots = Math.max(0, (lobby.neededPlayers || 5) - (lobby.currentMembers?.length || 0));

  return (
    <article className="card p-5 transition hover:border-clutch-blue/40">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-clutch-text">{lobby.title}</h3>
          <p className="mt-1 text-sm text-clutch-muted">{lobby.game} - {lobby.mode} - {lobby.region}</p>
        </div>
        <Badge tone={openSlots ? "border-clutch-green/40 bg-clutch-green/10 text-green-200" : "border-clutch-amber/40 bg-clutch-amber/10 text-amber-100"}>
          {openSlots} slots
        </Badge>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <RankBadge rank={`${lobby.rankMin} - ${lobby.rankMax}`} />
        <Badge>{lobby.language}</Badge>
        <Badge>{lobby.micRequired ? "Mic Required" : "Mic Optional"}</Badge>
        <Badge>{shortDateTime(lobby.startTime)}</Badge>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-clutch-border bg-clutch-panelSoft p-3">
          <div className="text-xs text-clutch-muted">Needed roles</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {lobby.neededRoles?.map((role) => <Badge key={role}>{role}</Badge>)}
          </div>
        </div>
        <LobbyCompatibility compatibility={item.compatibility} />
      </div>

      {!!item.compatibility?.warnings?.length && (
        <div className="mt-4 rounded-lg border border-clutch-amber/40 bg-clutch-amber/10 p-3 text-xs text-amber-100">
          {item.compatibility.warnings.join(" - ")}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" disabled={requested || lobby.status !== "open"} onClick={() => onJoin?.(lobby)} className="btn-primary py-2">
          {requested ? "Join Requested" : "Request Join"}
        </button>
        <Link to={`/lobbies/${lobby._id}`} className="btn-secondary py-2">
          View Details
        </Link>
        <Link to={`/squad/${lobby._id}`} className="btn-secondary py-2">
          Squad Room
        </Link>
      </div>
    </article>
  );
};

export default LobbyCard;
