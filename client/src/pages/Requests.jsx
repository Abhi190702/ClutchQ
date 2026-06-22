import { useEffect, useState } from "react";
import PageShell from "../components/common/PageShell";
import ErrorState from "../components/common/ErrorState";
import SkeletonCard from "../components/common/SkeletonCard";
import RequestsInbox from "../components/requests/RequestsInbox";
import RequestTabs from "../components/requests/RequestTabs";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api, { getErrorMessage } from "../services/api";

const tabs = [
  { id: "incoming", label: "Incoming" },
  { id: "outgoing", label: "Outgoing" },
  { id: "lobby", label: "Lobby" },
  { id: "teammate", label: "Teammate" }
];

const Requests = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [active, setActive] = useState("incoming");
  const [data, setData] = useState({ incoming: [], outgoing: [], history: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/requests");
      setData(response.data.data);
    } catch (error) {
      const message = getErrorMessage(error);
      setError(message);
      showToast(message, "error");
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

  const withDirection = [
    ...data.incoming.map((request) => ({ ...request, direction: "incoming" })),
    ...data.outgoing.map((request) => ({ ...request, direction: "outgoing" }))
  ];
  const visible =
    active === "incoming"
      ? data.incoming.map((request) => ({ ...request, direction: "incoming" }))
      : active === "outgoing"
        ? data.outgoing.map((request) => ({ ...request, direction: "outgoing" }))
        : withDirection.filter((request) => request.type === active);
  const counts = {
    incoming: data.incoming.length,
    outgoing: data.outgoing.length,
    lobby: withDirection.filter((request) => request.type === "lobby").length,
    teammate: withDirection.filter((request) => request.type === "teammate").length
  };
  const inferredDirection = (request) =>
    request.direction || (String(request.toUser?._id || request.toUser) === String(user?._id) ? "incoming" : "outgoing");

  return (
    <PageShell fullWidth>
      <div className="space-y-7">
        <section className="border-b border-white/10 pb-8">
          <div className="eyebrow mb-3">Inbox</div>
          <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">Requests</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
            Manage teammate invites, lobby applications, and squad responses.
          </p>
        </section>

        <RequestTabs tabs={tabs} active={active} counts={counts} onChange={setActive} />
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : loading ? (
          <SkeletonCard rows={8} />
        ) : (
          <RequestsInbox
            requests={visible}
            direction={visible[0] ? inferredDirection(visible[0]) : active === "outgoing" ? "outgoing" : "incoming"}
            onAction={update}
            emptyTitle={active === "incoming" ? "No incoming requests." : active === "outgoing" ? "No outgoing requests." : `No ${active} requests.`}
            emptyDescription={
              active === "incoming"
                ? "When players or lobby applicants reach out, they will appear here."
                : "Send teammate requests from the dashboard or request to join a lobby."
            }
          />
        )}
      </div>
    </PageShell>
  );
};

export default Requests;
