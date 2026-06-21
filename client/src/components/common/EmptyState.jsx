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
  <div className={`rounded-md border border-dashed border-clutch-border bg-clutch-panel/70 text-left ${compact ? "p-5" : "p-8"} ${className}`}>
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        {icon ? <div className="shrink-0 rounded-md border border-clutch-border bg-clutch-panelSoft p-3 text-clutch-text">{icon}</div> : null}
        <div>
          {eyebrow ? <div className="eyebrow mb-2">{eyebrow}</div> : null}
          <h3 className="text-xl font-bold text-clutch-text">{title}</h3>
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
