const SectionHeader = ({ eyebrow, title, description, actions, compact = false, className = "" }) => (
  <div className={`flex flex-col gap-6 md:flex-row md:items-end md:justify-between ${className}`}>
    <div className="min-w-0">
      {eyebrow ? <div className="eyebrow mb-2">{eyebrow}</div> : null}
      {title ? (
        <h2 className={`${compact ? "text-2xl md:text-3xl" : "text-4xl md:text-5xl"} font-black tracking-[-0.04em] text-clutch-text`}>
          {title}
        </h2>
      ) : null}
      {description ? <p className="mt-4 max-w-3xl text-sm leading-6 text-clutch-muted md:text-base md:leading-7">{description}</p> : null}
    </div>
    {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
  </div>
);

export default SectionHeader;
