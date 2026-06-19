const EmptyState = ({ title, description, action }) => (
  <div className="card flex flex-col items-start gap-4 p-8 text-left">
    <div className="rounded-lg border border-clutch-border bg-clutch-panelSoft px-3 py-2 text-sm font-bold text-clutch-cyan">No data</div>
    <div>
      <h3 className="text-xl font-black text-clutch-text">{title}</h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-clutch-muted">{description}</p>
    </div>
    {action}
  </div>
);

export default EmptyState;
