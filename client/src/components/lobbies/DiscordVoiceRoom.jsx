import { useEffect, useRef, useState } from "react";
import { useToast } from "../../context/ToastContext";
import api, { getErrorMessage } from "../../services/api";
import { copyText } from "../../utils/clipboard";

const hasInvite = (room) => Boolean(room?.inviteUrl);

const DiscordVoiceRoom = ({ lobby, isOwner, isMember, onUpdated }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [discordRoom, setDiscordRoom] = useState(hasInvite(lobby?.discord) ? lobby.discord : null);
  const [copied, setCopied] = useState(false);
  const justCreatedRef = useRef(false);
  const canAccess = Boolean(isOwner || isMember);

  useEffect(() => {
    const lobbyRoom = hasInvite(lobby?.discord) ? lobby.discord : null;
    setError("");
    setCopied(false);
    setDiscordRoom(lobbyRoom);

    if (!lobby?._id || !canAccess) return undefined;
    if (justCreatedRef.current) {
      justCreatedRef.current = false;
      return undefined;
    }
    if (lobbyRoom?.inviteUrl) return undefined;

    let active = true;

    const loadRoom = async () => {
      setChecking(true);
      try {
        const response = await api.get(`/lobbies/${lobby._id}/discord`);
        if (active) setDiscordRoom(response.data.data.discord);
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError));
      } finally {
        if (active) setChecking(false);
      }
    };

    loadRoom();

    return () => {
      active = false;
    };
  }, [lobby?._id, lobby?.discord?.channelId, lobby?.discord?.inviteUrl, canAccess]);

  const refreshParent = async () => {
    if (onUpdated) await onUpdated();
  };

  const createRoom = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.post(`/lobbies/${lobby._id}/discord/create`);
      justCreatedRef.current = true;
      setDiscordRoom(response.data.data.discord);
      showToast("Discord voice room ready.");
      await refreshParent();
    } catch (requestError) {
      const message = getErrorMessage(requestError);
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteRoom = async () => {
    setLoading(true);
    setError("");

    try {
      await api.delete(`/lobbies/${lobby._id}/discord`);
      setDiscordRoom(null);
      showToast("Discord voice room removed.", "info");
      await refreshParent();
    } catch (requestError) {
      const message = getErrorMessage(requestError);
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = () => {
    if (!discordRoom?.inviteUrl) return;
    window.open(discordRoom.inviteUrl, "_blank", "noopener,noreferrer");
  };

  const copyInvite = async () => {
    if (!discordRoom?.inviteUrl) return;

    const copiedInvite = await copyText(discordRoom.inviteUrl);
    if (copiedInvite) {
      setCopied(true);
      showToast("Discord invite copied.");
      window.setTimeout(() => setCopied(false), 1800);
    } else {
      setError("Could not copy invite. Open the room and copy it from Discord.");
      showToast("Could not copy invite. Select and copy manually.", "error");
    }
  };

  const renderBody = () => {
    if (checking && canAccess && !discordRoom) {
      return <p className="text-sm text-clutch-muted">Checking Discord room status...</p>;
    }

    if (hasInvite(discordRoom) && canAccess) {
      return (
        <div className="space-y-4">
          <div className="rounded-md border border-clutch-green/30 bg-clutch-green/10 p-3">
            <div className="text-sm font-semibold text-green-100">Discord Voice Room Active</div>
            <div className="mt-1 text-sm text-clutch-muted">{discordRoom.channelName || "ClutchQ voice room"}</div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-primary" onClick={joinRoom}>
              Join Voice Room
            </button>
            <button type="button" className="btn-secondary" onClick={copyInvite}>
              {copied ? "Copied" : "Copy Invite"}
            </button>
            {isOwner ? (
              <button type="button" className="btn-danger" onClick={deleteRoom} disabled={loading}>
                Remove Room
              </button>
            ) : null}
          </div>
        </div>
      );
    }

    if (isOwner) {
      return (
        <div className="space-y-4">
          <p className="text-sm leading-6 text-clutch-muted">Create a private Discord voice room for this squad.</p>
          <button type="button" className="btn-primary" onClick={createRoom} disabled={loading || checking}>
            {loading ? "Creating..." : "Create Discord Voice Room"}
          </button>
        </div>
      );
    }

    if (isMember) {
      return <p className="text-sm leading-6 text-clutch-muted">Waiting for lobby owner to create Discord voice room.</p>;
    }

    return <p className="text-sm leading-6 text-clutch-muted">Join this lobby to access the Discord voice room.</p>;
  };

  return (
    <div className="card p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-clutch-text">Discord Voice Room</h3>
          <p className="mt-1 text-sm text-clutch-muted">Voice access is shared only with accepted squad members.</p>
        </div>
        <span className="w-fit rounded-full border border-clutch-border bg-clutch-panelSoft px-3 py-1 text-xs font-semibold text-clutch-muted">
          {hasInvite(discordRoom) && canAccess ? "Active" : "Private"}
        </span>
      </div>

      {error ? (
        <div className="mb-4 rounded-md border border-clutch-red/30 bg-clutch-red/10 p-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {renderBody()}
    </div>
  );
};

export default DiscordVoiceRoom;
