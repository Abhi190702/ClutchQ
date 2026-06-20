import { Link } from "react-router-dom";
import { useState } from "react";
import { useToast } from "../../context/ToastContext";
import gameApi from "../../services/gameApi";
import { getErrorMessage } from "../../services/api";
import { shortDateTime } from "../../utils/formatters";

const getUserId = (value) => String(value?._id || value || "");

const GameRoomCard = ({ room, user, onUpdated, compact = false }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState("");
  const userId = getUserId(user?._id);
  const isHost = getUserId(room.hostId) === userId;
  const isMember = room.currentMembers?.some((member) => getUserId(member.userId) === userId);
  const members = room.currentMembers?.filter((member) => member.status !== "left") || [];
  const hasDiscord = Boolean(room.discord?.inviteUrl);
  const isPreview = Boolean(room.isPreview) || String(room._id || "").startsWith("preview-");

  const runAction = async (key, action, success) => {
    setLoading(key);
    try {
      const response = await action();
      showToast(success);
      onUpdated?.(response.data.data);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading("");
    }
  };

  const copyInvite = async () => {
    await navigator.clipboard.writeText(room.discord.inviteUrl);
    showToast("Discord invite copied.");
  };

  return (
    <article className="rounded-[10px] border border-[#2f2f36] bg-[#202024] p-4 transition hover:bg-[#28282d]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded bg-[#303036] px-2 py-1 text-xs font-bold text-white">{room.status?.replace("_", " ") || "open"}</span>
            {isPreview ? <span className="rounded bg-sky-400 px-2 py-1 text-xs font-bold text-black">Demo room</span> : null}
            {room.micRequired ? <span className="rounded bg-[#303036] px-2 py-1 text-xs font-bold text-white">Mic required</span> : null}
            {hasDiscord ? <span className="rounded bg-indigo-500/20 px-2 py-1 text-xs font-bold text-indigo-100">Discord ready</span> : null}
          </div>
          <h3 className="truncate text-lg font-black text-white">{room.title}</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Hosted by {room.hostId?.name || "Player"} · {room.mode || "Open Lobby"} · starts {shortDateTime(room.startsAt)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-300">
            <span>{room.region}</span>
            <span className="text-zinc-600">/</span>
            <span>{room.language}</span>
            <span className="text-zinc-600">/</span>
            <span>{room.rankMin || "Any"} - {room.rankMax || "Any"}</span>
          </div>
          {!compact ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {room.neededRoles?.map((role) => (
                <span key={role} className="rounded-full border border-white/10 px-2 py-1 text-xs font-semibold text-zinc-300">
                  {role}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="shrink-0 text-left lg:text-right">
          <div className="text-2xl font-black text-white">
            {members.length}/{room.maxMembers || 5}
          </div>
          <div className="text-xs text-zinc-400">members</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {!isMember ? (
          <button
            type="button"
            className="btn-primary py-2"
            disabled={isPreview || loading === "join"}
            onClick={() => !isPreview && runAction("join", () => gameApi.joinRoom(room._id), "Joined room")}
          >
            {isPreview ? "Preview Room" : "Join Room"}
          </button>
        ) : (
          <button
            type="button"
            className="btn-secondary py-2"
            disabled={loading === "ready"}
            onClick={() => runAction("ready", () => gameApi.readyRoom(room._id, true), "Ready check updated")}
          >
            Ready
          </button>
        )}
        {isHost && !hasDiscord ? (
          <button
            type="button"
            className="btn-secondary py-2"
            disabled={loading === "discord"}
            onClick={() => runAction("discord", () => gameApi.createDiscord(room._id), "Discord voice room ready")}
          >
            Create Discord Voice
          </button>
        ) : null}
        {hasDiscord && (isHost || isMember) ? (
          <>
            <button type="button" className="btn-secondary py-2" onClick={() => window.open(room.discord.inviteUrl, "_blank", "noopener,noreferrer")}>
              Join Voice
            </button>
            <button type="button" className="btn-secondary py-2" onClick={copyInvite}>
              Copy Invite
            </button>
          </>
        ) : null}
        {!isPreview ? (
          <Link to={`/games/${room.gameSlug}/rooms`} className="btn-secondary py-2">
            View Details
          </Link>
        ) : null}
      </div>
    </article>
  );
};

export default GameRoomCard;
