import { useEffect, useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import PageShell from "../components/common/PageShell";
import SkeletonCard from "../components/common/SkeletonCard";
import DiscordVoiceRoom from "../components/lobbies/DiscordVoiceRoom";
import SquadRoom from "../components/lobbies/SquadRoom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api, { getErrorMessage } from "../services/api";

const Squad = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    try {
      const response = await api.get(`/lobbies/${id}`);
      setData(response.data.data);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  }, [id, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) {
    return (
      <PageShell title="Squad Room" eyebrow="Ready check">
        <SkeletonCard rows={8} />
      </PageShell>
    );
  }

  const { lobby } = data;
  const isOwner = String(lobby.ownerId?._id || lobby.ownerId) === String(user?._id);
  const isMember = lobby.currentMembers?.some((member) => String(member.userId?._id || member.userId) === String(user?._id));

  return (
    <PageShell title="Squad Room" eyebrow="Ready check">
      <div className="space-y-6">
        <DiscordVoiceRoom lobby={lobby} isOwner={isOwner} isMember={isMember} onUpdated={load} />
        <SquadRoom data={data} onLobbyUpdate={(nextLobby) => setData({ ...data, lobby: nextLobby })} />
      </div>
    </PageShell>
  );
};

export default Squad;
