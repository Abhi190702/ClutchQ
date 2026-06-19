import StatCard from "../common/StatCard";

const AdminStats = ({ totals }) => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    <StatCard label="Total users" value={totals?.totalUsers || 0} />
    <StatCard label="Active lobbies" value={totals?.activeLobbies || 0} accent="green" />
    <StatCard label="Average match score" value={totals?.averageMatchScore || 0} suffix="%" accent="violet" />
    <StatCard label="Pending reports" value={totals?.pendingReports || 0} accent="red" />
    <StatCard label="Total requests" value={totals?.totalRequests || 0} accent="amber" />
    <StatCard label="Average trust" value={totals?.averageTrustScore || 0} suffix="%" accent="green" />
    <StatCard label="Most played game" value={totals?.mostPlayedGame || "None"} />
    <StatCard label="Most active region" value={totals?.mostActiveRegion || "None"} accent="blue" />
  </div>
);

export default AdminStats;
