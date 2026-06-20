const ProfileSkeleton = () => (
  <div className="mx-auto grid max-w-[1280px] gap-6 lg:grid-cols-[240px_1fr]">
    <div className="card hidden h-[420px] animate-pulse bg-clutch-panelSoft lg:block" />
    <div className="space-y-6">
      <div className="card h-[260px] animate-pulse bg-clutch-panelSoft" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card h-28 animate-pulse bg-clutch-panelSoft" />
        <div className="card h-28 animate-pulse bg-clutch-panelSoft" />
        <div className="card h-28 animate-pulse bg-clutch-panelSoft" />
      </div>
      <div className="card h-[360px] animate-pulse bg-clutch-panelSoft" />
    </div>
  </div>
);

export default ProfileSkeleton;
