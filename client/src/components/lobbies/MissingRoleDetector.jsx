import Badge from "../common/Badge";

const MissingRoleDetector = ({ missing = [] }) => (
  <div className="card p-5">
    <h3 className="text-lg font-semibold">Missing roles</h3>
    <p className="mt-2 text-sm text-clutch-muted">Role gaps to fill before the squad is balanced.</p>
    <div className="mt-4 flex flex-wrap gap-2">
      {missing.length ? missing.map((role) => <Badge key={role} tone="border-clutch-amber/40 bg-clutch-amber/10 text-amber-100">Need {role}</Badge>) : <Badge tone="border-clutch-green/40 bg-clutch-green/10 text-green-200">Role coverage complete</Badge>}
    </div>
  </div>
);

export default MissingRoleDetector;
