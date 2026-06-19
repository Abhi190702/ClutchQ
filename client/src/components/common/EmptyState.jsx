const EmptyState = ({ title, description, action }) => (
  <div className="card flex flex-col items-start gap-4 p-8 text-left">
    <div className="rounded-md border border-clutch-border bg-clutch-panelSoft px-3 py-2 text-sm font-semibold text-clutch-blue">No data</div>
    <div>
      <h3 className="text-xl font-semibold text-clutch-text">{title}</h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-clutch-muted">{description}</p>
    </div>
    {action}
  </div>
);

export default EmptyState;
