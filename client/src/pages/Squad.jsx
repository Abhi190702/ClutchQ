import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageShell from "../components/common/PageShell";
import SkeletonCard from "../components/common/SkeletonCard";
import SquadRoom from "../components/lobbies/SquadRoom";
import { useToast } from "../context/ToastContext";
import api, { getErrorMessage } from "../services/api";

const Squad = () => {
  const { id } = useParams();
  const { showToast } = useToast();
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get(`/lobbies/${id}`);
        setData(response.data.data);
      } catch (error) {
        showToast(getErrorMessage(error), "error");
      }
    };
    load();
  }, [id]);

  if (!data) {
    return (
      <PageShell title="Squad Room" eyebrow="Ready check">
        <SkeletonCard rows={8} />
      </PageShell>
    );
  }

  return (
    <PageShell title="Squad Room" eyebrow="Ready check">
      <SquadRoom data={data} onLobbyUpdate={(lobby) => setData({ ...data, lobby })} />
    </PageShell>
  );
};

export default Squad;
