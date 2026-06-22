import { useCallback, useEffect, useState } from "react";
import PageShell from "../components/common/PageShell";
import ErrorState from "../components/common/ErrorState";
import SkeletonCard from "../components/common/SkeletonCard";
import AdminReportsTable from "../components/admin/AdminReportsTable";
import { useToast } from "../context/ToastContext";
import api, { getErrorMessage } from "../services/api";

const AdminReports = () => {
  const { showToast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/admin/reports");
      setReports(response.data.data);
    } catch (error) {
      const message = getErrorMessage(error);
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const action = async (report, status) => {
    const previous = reports;
    setReports((current) => current.map((item) => (item._id === report._id ? { ...item, status } : item)));
    try {
      await api.patch(`/admin/reports/${report._id}`, { status, adminNote: `Marked ${status} from ClutchQ admin dashboard.` });
      showToast(`Report ${status}`);
      load();
    } catch (error) {
      setReports(previous);
      showToast(getErrorMessage(error), "error");
    }
  };

  return (
    <PageShell title="Admin Reports" eyebrow="Moderation queue">
      {error ? <ErrorState message={error} onRetry={load} /> : loading ? <SkeletonCard rows={8} /> : <AdminReportsTable reports={reports} onAction={action} />}
    </PageShell>
  );
};

export default AdminReports;
