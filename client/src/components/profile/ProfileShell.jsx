import PageShell from "../common/PageShell";

const ProfileShell = ({ children, actions }) => (
  <PageShell actions={actions} fullWidth hideSidebar>
    <div className="mx-auto max-w-[1440px] min-w-0 space-y-6 px-0">
      {children}
    </div>
  </PageShell>
);

export default ProfileShell;
