const MetricStrip = ({ metrics = [], className = "", variant = "default" }) => {
  const quiet = variant === "quiet";

  return (
    <div
      className={
        quiet
          ? `grid gap-5 sm:grid-cols-2 xl:grid-cols-5 ${className}`
          : `flex flex-col divide-y divide-white/10 border-y border-white/10 md:flex-row md:divide-x md:divide-y-0 ${className}`
      }
    >
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className={
            quiet
              ? "min-w-0 border-t border-white/10 pt-4"
              : "min-w-0 flex-1 py-4 md:px-5 first:md:pl-0 last:md:pr-0"
          }
        >
          <div className="truncate text-2xl font-black tracking-tight text-clutch-text md:text-3xl">{metric.value}</div>
          <div className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-clutch-muted">{metric.label}</div>
          {metric.helper ? <div className="mt-1 line-clamp-1 text-sm text-zinc-500">{metric.helper}</div> : null}
        </div>
      ))}
    </div>
  );
};

export default MetricStrip;
