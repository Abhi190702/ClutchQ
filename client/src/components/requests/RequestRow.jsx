import { Link } from "react-router-dom";
import Badge from "../common/Badge";
import { formatSafeDateTime, getInitials } from "../../utils/formatters";

const RequestRow = ({ request, direction = "incoming", onAction }) => {
  const other = direction === "incoming" ? request.fromUser : request.toUser;
  const lobby = request.lobbyId;
  const name = other?.name || "Unknown player";
  const avatar = other?.avatar;
  const target = lobby?.title || (request.type === "teammate" ? "Teammate request" : "Unknown lobby");

  return (
    <article className="grid gap-4 border-b border-white/10 py-5 last:border-b-0 lg:grid-cols-[minmax(0,1fr)_160px_260px] lg:items-center">
      <div className="flex min-w-0 items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-white/[0.08] text-sm font-black text-white">
          {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : getInitials(name)}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-black text-white">{name}</h3>
            <Badge>{request.type || "request"}</Badge>
            <Badge tone={request.status === "pending" ? "info" : request.status === "accepted" ? "success" : "default"}>{request.status || "pending"}</Badge>
          </div>
          <p className="mt-1 text-sm text-zinc-500">{target} · {formatSafeDateTime(request.createdAt, "Time unknown")}</p>
          <p className="mt-2 line-clamp-1 text-sm text-zinc-300">{request.message || "No message provided."}</p>
        </div>
      </div>

      <div className="text-sm text-zinc-400">
        {lobby?.game ? <div className="font-bold text-white">{lobby.game}</div> : null}
        <div>{direction === "incoming" ? "Needs your response" : "Waiting for response"}</div>
      </div>

      <div className="flex flex-wrap gap-2 lg:justify-end">
        {direction === "incoming" && request.status === "pending" && (
          <>
            <button className="btn-primary py-2" onClick={() => onAction(request, "accepted")} type="button">Accept</button>
            <button className="btn-secondary py-2" onClick={() => onAction(request, "rejected")} type="button">Decline</button>
          </>
        )}
        {direction === "outgoing" && request.status === "pending" && (
          <button className="btn-secondary py-2" onClick={() => onAction(request, "cancelled")} type="button">Cancel</button>
        )}
        {lobby?._id ? <Link to={`/lobbies/${lobby._id}`} className="btn-secondary py-2">Lobby</Link> : null}
        {other?._id ? <Link to={`/player/${other._id}`} className="btn-secondary py-2">Profile</Link> : null}
      </div>
    </article>
  );
};

export default RequestRow;
