import PageShell from "../common/PageShell";

const ProfileShell = ({ children, actions }) => (
  <PageShell actions={actions} fullWidth>
    <div className="mx-auto min-w-0 space-y-8">
      {children}
    </div>
  </PageShell>
);

export default ProfileShell;
