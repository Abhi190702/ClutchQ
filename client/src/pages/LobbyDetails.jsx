import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageShell from "../components/common/PageShell";
import SkeletonCard from "../components/common/SkeletonCard";
import Badge from "../components/common/Badge";
import DiscordVoiceRoom from "../components/lobbies/DiscordVoiceRoom";
import LobbyCompatibility from "../components/lobbies/LobbyCompatibility";
import MissingRoleDetector from "../components/lobbies/MissingRoleDetector";
import SmartInviteSuggestions from "../components/lobbies/SmartInviteSuggestions";
import SquadChemistryGraph from "../components/lobbies/SquadChemistryGraph";
import SquadRoleBalance from "../components/lobbies/SquadRoleBalance";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api, { getErrorMessage } from "../services/api";
import { shortDateTime } from "../utils/formatters";

const LobbyDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requested, setRequested] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/lobbies/${id}`);
      setData(response.data.data);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const join = async () => {
    setRequested(true);
    try {
      await api.post("/requests", { type: "lobby", lobbyId: id, message: "Requesting to join based on lobby compatibility." });
      showToast("Join request sent");
    } catch (error) {
      setRequested(false);
      showToast(getErrorMessage(error), "error");
    }
  };

  const closeLobby = async () => {
    try {
      const response = await api.patch(`/lobbies/${id}/close`);
      setData({ ...data, lobby: response.data.data });
      showToast("Lobby closed", "info");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  if (loading || !data) {
    return (
      <PageShell title="Lobby Details" eyebrow="Lobby details">
        <SkeletonCard rows={8} />
      </PageShell>
    );
  }

  const { lobby, chemistry, compatibility, memberProfiles } = data;
  const isOwner = String(lobby.ownerId?._id || lobby.ownerId) === String(user?._id);
  const isMember = lobby.currentMembers?.some((member) => String(member.userId?._id || member.userId) === String(user?._id));

  return (
    <PageShell
      title={lobby.title}
      eyebrow="Lobby details"
      actions={
        <>
          <Link to={`/squad/${lobby._id}`} className="btn-secondary">Open squad room</Link>
          {isOwner ? <button onClick={closeLobby} className="btn-danger" type="button">Close lobby</button> : <button onClick={join} disabled={requested} className="btn-primary" type="button">{requested ? "Requested" : "Join request"}</button>}
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex flex-wrap gap-2">
              <Badge>{lobby.game}</Badge>
              <Badge>{lobby.rankMin} - {lobby.rankMax}</Badge>
              <Badge>{lobby.region}</Badge>
              <Badge>{lobby.language}</Badge>
              <Badge>{lobby.micRequired ? "Mic Required" : "Mic Optional"}</Badge>
              <Badge>{shortDateTime(lobby.startTime)}</Badge>
            </div>
            <p className="mt-5 text-sm leading-6 text-clutch-muted">{lobby.description}</p>
          </div>
          <DiscordVoiceRoom lobby={lobby} isOwner={isOwner} isMember={isMember} onUpdated={load} />
          <SquadChemistryGraph members={memberProfiles} pairwiseScores={chemistry.pairwiseScores} />
          <SmartInviteSuggestions chemistry={chemistry} />
        </div>
        <div className="space-y-6">
          <LobbyCompatibility compatibility={compatibility} />
          <SquadRoleBalance roleBalance={chemistry.roleBalance} />
          <MissingRoleDetector missing={chemistry.roleBalance.missing} />
          <div className="card p-5">
            <h3 className="mb-4 text-lg font-semibold">Current members</h3>
            <div className="space-y-3">
              {lobby.currentMembers?.map((member) => (
                <div key={member.userId?._id || member.userId} className="rounded-lg border border-clutch-border bg-clutch-panelSoft p-3">
                  <div className="font-bold">{member.userId?.name || "Member"}</div>
                  <div className="text-sm text-clutch-muted">{member.role} - {member.ready ? "Ready" : "Waiting"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default LobbyDetails;
