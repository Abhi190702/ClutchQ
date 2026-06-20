const ProfileEmptyState = ({ title = "Nothing here yet", description, action }) => (
  <div className="rounded-md border border-dashed border-clutch-border bg-clutch-bg/40 px-5 py-8 text-center">
    <h3 className="text-lg font-semibold text-clutch-text">{title}</h3>
    {description && <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-clutch-muted">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default ProfileEmptyState;
