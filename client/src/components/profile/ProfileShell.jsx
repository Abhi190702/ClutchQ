import PageShell from "../common/PageShell";
import ProfileSidebar from "./ProfileSidebar";

const ProfileShell = ({ children, actions }) => (
  <PageShell title="Profile" eyebrow="Gaming identity" actions={actions} fullWidth>
    <div className="mx-auto grid max-w-[1280px] gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <ProfileSidebar />
      <div className="min-w-0 space-y-6">{children}</div>
    </div>
  </PageShell>
);

export default ProfileShell;
