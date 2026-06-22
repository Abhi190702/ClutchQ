import TrustBadge from "../common/TrustBadge";

const AdminUsersTable = ({ users = [] }) => (
  <div className="card overflow-hidden">
    <div className="border-b border-clutch-border p-5 text-lg font-semibold">Users</div>
    <div className="thin-scrollbar overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-clutch-panelSoft text-xs uppercase tracking-[0.16em] text-clutch-muted">
          <tr>
            <th className="p-4">Name</th>
            <th className="p-4">Email</th>
            <th className="p-4">Role</th>
            <th className="p-4">Region</th>
            <th className="p-4">Trust</th>
            <th className="p-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id} className="border-t border-clutch-border">
              <td className="p-4 font-bold text-clutch-text">{user.name}</td>
              <td className="p-4 text-clutch-muted">{user.email}</td>
              <td className="p-4 text-clutch-muted">{user.role}</td>
              <td className="p-4 text-clutch-muted">{user.profile?.region || "None"}</td>
              <td className="p-4"><TrustBadge score={user.profile?.trustScore} /></td>
              <td className="p-4 text-clutch-muted">{user.isSuspended ? "Suspended" : "Active"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default AdminUsersTable;
