const ProfileSkeleton = () => (
  <div className="mx-auto max-w-[1120px] space-y-5">
    <div className="space-y-6">
      <div className="card h-[220px] animate-pulse bg-clutch-panelSoft" />
      <div className="grid gap-4 md:grid-cols-4">
        <div className="card h-28 animate-pulse bg-clutch-panelSoft" />
        <div className="card h-28 animate-pulse bg-clutch-panelSoft" />
        <div className="card h-28 animate-pulse bg-clutch-panelSoft" />
        <div className="card h-28 animate-pulse bg-clutch-panelSoft" />
      </div>
      <div className="card h-[260px] animate-pulse bg-clutch-panelSoft" />
    </div>
  </div>
);

export default ProfileSkeleton;
