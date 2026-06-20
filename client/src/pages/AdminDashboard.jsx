import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../components/common/PageShell";
import SkeletonCard from "../components/common/SkeletonCard";
import AdminStats from "../components/admin/AdminStats";
import DiscordSetupStatus from "../components/admin/DiscordSetupStatus";
import GamePopularityChart from "../components/admin/GamePopularityChart";
import LobbyHealthChart from "../components/admin/LobbyHealthChart";
import AdminUsersTable from "../components/admin/AdminUsersTable";
import AdminReportsTable from "../components/admin/AdminReportsTable";
import { useToast } from "../context/ToastContext";
import api, { getErrorMessage } from "../services/api";

const AdminDashboard = () => {
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsResponse, usersResponse] = await Promise.all([api.get("/admin/stats"), api.get("/admin/users")]);
        setStats(statsResponse.data.data);
        setUsers(usersResponse.data.data);
      } catch (error) {
        showToast(getErrorMessage(error), "error");
      }
    };
    load();
  }, []);

  if (!stats) {
    return (
      <PageShell title="Admin Dashboard" eyebrow="Safety analytics">
        <SkeletonCard rows={8} />
      </PageShell>
    );
  }

  return (
    <PageShell title="Admin Dashboard" eyebrow="Safety analytics" actions={<Link to="/admin/reports" className="btn-primary">Moderate reports</Link>}>
      <div className="space-y-6">
        <AdminStats totals={stats.totals} />
        <DiscordSetupStatus />
        <div className="grid gap-6 xl:grid-cols-2">
          <GamePopularityChart data={stats.gamePopularity} />
          <LobbyHealthChart data={stats.lobbyHealth} />
        </div>
        <AdminReportsTable reports={stats.recentReports} onAction={() => {}} />
        <AdminUsersTable users={users.slice(0, 12)} />
      </div>
    </PageShell>
  );
};

export default AdminDashboard;
