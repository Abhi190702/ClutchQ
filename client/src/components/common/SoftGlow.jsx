const SoftGlow = ({ className = "" }) => (
  <div
    aria-hidden="true"
    className={`pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(56,189,248,0.10),transparent_32%),radial-gradient(circle_at_82%_4%,rgba(167,139,250,0.08),transparent_28%)] ${className}`}
  />
);

export default SoftGlow;
