const ProfileCompleteness = ({ value = 0 }) => (
  <div className="card p-5">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-semibold text-clutch-text">Profile completeness</div>
        <div className="mt-1 text-xs text-clutch-muted">Higher completeness improves match confidence.</div>
      </div>
      <div className="text-2xl font-semibold text-clutch-blue">{Math.round(value)}%</div>
    </div>
    <div className="mt-4 h-2 overflow-hidden rounded-full bg-clutch-panelSoft">
      <div className="h-full rounded-full bg-clutch-blue transition-all duration-700" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  </div>
);

export default ProfileCompleteness;
