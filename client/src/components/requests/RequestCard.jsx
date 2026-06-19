import { Link } from "react-router-dom";
import Badge from "../common/Badge";

const RequestCard = ({ request, direction = "incoming", onAction }) => {
  const other = direction === "incoming" ? request.fromUser : request.toUser;
  const lobby = request.lobbyId;

  return (
    <div className="rounded-lg border border-clutch-border bg-clutch-panelSoft p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-clutch-text">{other?.name || "Player request"}</h3>
            <Badge>{request.type}</Badge>
            <Badge>{request.status}</Badge>
          </div>
          <p className="mt-2 text-sm text-clutch-muted">{request.message || "No message provided."}</p>
          {lobby && <p className="mt-1 text-sm text-clutch-cyan">Lobby: {lobby.title}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {direction === "incoming" && request.status === "pending" && (
            <>
              <button className="btn-primary py-2" onClick={() => onAction(request, "accepted")} type="button">Accept</button>
              <button className="btn-secondary py-2" onClick={() => onAction(request, "rejected")} type="button">Reject</button>
            </>
          )}
          {direction === "outgoing" && request.status === "pending" && (
            <button className="btn-secondary py-2" onClick={() => onAction(request, "cancelled")} type="button">Cancel</button>
          )}
          {other && <Link to={`/player/${request.type === "lobby" ? "" : ""}${other._id}`} className="btn-secondary py-2">View User</Link>}
        </div>
      </div>
    </div>
  );
};

export default RequestCard;
