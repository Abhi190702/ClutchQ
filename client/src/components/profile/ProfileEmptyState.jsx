const ProfileEmptyState = ({ title = "Nothing here yet", description, action }) => (
  <div className="border-l-2 border-white/15 pl-5">
    <h3 className="text-xl font-black text-clutch-text">{title}</h3>
    {description && <p className="mt-2 max-w-2xl text-base leading-7 text-clutch-muted">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default ProfileEmptyState;
