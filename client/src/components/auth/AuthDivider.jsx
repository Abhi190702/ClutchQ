const AuthDivider = ({ label }) => (
  <div className="flex items-center gap-4 py-1">
    <div className="h-px flex-1 bg-[#34343a]" />
    {label && <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7d7d86]">{label}</div>}
    <div className="h-px flex-1 bg-[#34343a]" />
  </div>
);

export default AuthDivider;
