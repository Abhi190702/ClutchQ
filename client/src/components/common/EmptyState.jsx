const EmptyState = ({
  title = "Nothing here yet",
  description,
  message,
  action,
  actionLabel,
  onAction,
  eyebrow,
  icon,
  compact = false,
  className = ""
}) => (
  <div className={`text-left ${compact ? "py-4" : "py-6"} ${className}`}>
    <div className="flex flex-col items-start gap-4 border-l border-white/10 pl-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        {icon ? <div className="shrink-0 rounded-[16px] border border-white/[0.08] bg-white/[0.04] p-3 text-clutch-text">{icon}</div> : null}
        <div>
          {eyebrow ? <div className="eyebrow mb-2">{eyebrow}</div> : null}
          <h3 className="text-lg font-black text-clutch-text">{title}</h3>
          {description || message ? <p className="mt-2 max-w-2xl text-sm leading-6 text-clutch-muted">{description || message}</p> : null}
        </div>
      </div>
      {action ||
        (actionLabel && onAction ? (
          <button type="button" className="btn-secondary shrink-0" onClick={onAction}>
            {actionLabel}
          </button>
        ) : null)}
    </div>
  </div>
);

export default EmptyState;
