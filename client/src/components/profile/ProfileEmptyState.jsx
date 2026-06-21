const ProfileEmptyState = ({ title = "Nothing here yet", description, action }) => (
  <div className="rounded-md border border-white/10 bg-black/15 px-5 py-5">
    <h3 className="text-base font-black text-clutch-text">{title}</h3>
    {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-clutch-muted">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default ProfileEmptyState;
