import Badge from "../common/Badge";

const SquadRoleBalance = ({ roleBalance }) => {
  const required = roleBalance?.required || [];
  const filled = roleBalance?.filled || [];

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Squad role balance</h3>
        <Badge>{roleBalance?.score || 0}% Balance</Badge>
      </div>
      <div className="space-y-2">
        {required.map((role) => {
          const count = filled.filter((item) => item === role).length;
          return (
            <div key={role} className="flex items-center justify-between rounded-lg border border-clutch-border bg-clutch-panelSoft p-3 text-sm">
              <span className="font-bold text-clutch-text">{role}</span>
              <span className={count ? "text-green-200" : "text-amber-100"}>{count}/1 {count ? "Filled" : "Missing"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SquadRoleBalance;
