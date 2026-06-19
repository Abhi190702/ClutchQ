import { useEffect, useState } from "react";
import PageShell from "../components/common/PageShell";
import SkeletonCard from "../components/common/SkeletonCard";
import IncomingRequests from "../components/requests/IncomingRequests";
import OutgoingRequests from "../components/requests/OutgoingRequests";
import { useToast } from "../context/ToastContext";
import api, { getErrorMessage } from "../services/api";

const tabs = ["Incoming Requests", "Outgoing Requests", "Lobby Requests", "Teammate Requests"];

const Requests = () => {
  const { showToast } = useToast();
  const [active, setActive] = useState(tabs[0]);
  const [data, setData] = useState({ incoming: [], outgoing: [], history: [] });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.get("/requests");
      setData(response.data.data);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const update = async (request, status) => {
    const previous = data;
    setData({
      incoming: data.incoming.filter((item) => item._id !== request._id),
      outgoing: data.outgoing.filter((item) => item._id !== request._id),
      history: [{ ...request, status }, ...data.history]
    });
    try {
      await api.patch(`/requests/${request._id}`, { status });
      showToast(`Request ${status}`);
      load();
    } catch (error) {
      setData(previous);
      showToast(getErrorMessage(error), "error");
    }
  };

  const incoming = data.incoming.filter((request) => (active === "Lobby Requests" ? request.type === "lobby" : active === "Teammate Requests" ? request.type === "teammate" : true));
  const outgoing = data.outgoing.filter((request) => (active === "Lobby Requests" ? request.type === "lobby" : active === "Teammate Requests" ? request.type === "teammate" : true));

  return (
    <PageShell title="Requests" eyebrow="Inbox">
      <div className="space-y-6">
        <div className="card flex flex-wrap gap-2 p-3">
          {tabs.map((tab) => (
            <button key={tab} type="button" onClick={() => setActive(tab)} className={`rounded-lg px-4 py-2 text-sm font-bold ${active === tab ? "bg-clutch-cyan text-slate-950" : "bg-clutch-panelSoft text-clutch-muted"}`}>
              {tab}
            </button>
          ))}
        </div>
        {loading ? (
          <SkeletonCard rows={8} />
        ) : active === "Outgoing Requests" ? (
          <OutgoingRequests requests={outgoing} onAction={update} />
        ) : (
          <IncomingRequests requests={incoming} onAction={update} />
        )}
      </div>
    </PageShell>
  );
};

export default Requests;
