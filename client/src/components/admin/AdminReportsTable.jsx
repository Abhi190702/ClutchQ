const AdminReportsTable = ({ reports = [], onAction }) => (
  <div className="card overflow-hidden">
    <div className="border-b border-clutch-border p-5 text-lg font-semibold">Reports</div>
    <div className="thin-scrollbar overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="bg-clutch-panelSoft text-xs uppercase tracking-[0.16em] text-clutch-muted">
          <tr>
            <th className="p-4">Reported user</th>
            <th className="p-4">Reporter</th>
            <th className="p-4">Reason</th>
            <th className="p-4">Status</th>
            <th className="p-4">Action</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report._id} className="border-t border-clutch-border">
              <td className="p-4 font-bold text-clutch-text">{report.reportedUserId?.name}</td>
              <td className="p-4 text-clutch-muted">{report.reporterId?.name}</td>
              <td className="p-4 text-clutch-muted">{report.reason}</td>
              <td className="p-4 text-clutch-muted">{report.status}</td>
              <td className="p-4">
                <div className="flex flex-wrap gap-2">
                  {["warned", "suspended", "dismissed", "reviewed"].map((action) => (
                    <button key={action} onClick={() => onAction(report, action)} className="btn-secondary py-2 text-xs" type="button">{action}</button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default AdminReportsTable;
