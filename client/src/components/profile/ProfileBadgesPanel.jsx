import ProfileEmptyState from "./ProfileEmptyState";

const ratingLabels = {
  communication: "Communication",
  teamwork: "Teamwork",
  skill: "Skill",
  punctuality: "Punctuality",
  behavior: "Behavior"
};

const ProfileBadgesPanel = ({ profile }) => {
  const badges = profile?.badges || [];
  const ratings = profile?.averageRatings || {};

  return (
    <section id="badges" className="card p-5 md:p-6">
      <div>
        <div className="eyebrow">ClutchQ trust</div>
        <h2 className="mt-2 text-2xl font-bold text-clutch-text">Badges and teammate ratings</h2>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          {!badges.length ? (
            <ProfileEmptyState title="No badges yet." description="Finish sessions, earn reviews, and keep lobbies reliable to unlock badges." />
          ) : (
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => (
                <span key={badge} className="rounded-full border border-clutch-border bg-clutch-bg/40 px-3 py-2 text-sm font-bold text-clutch-text">{badge}</span>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-3">
          {Object.entries(ratingLabels).map(([key, label]) => {
            const value = Number(ratings[key] || 0);
            return (
              <div key={key} className="rounded-md border border-clutch-border bg-clutch-bg/40 p-3">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-clutch-text">{label}</span>
                  <span className="font-bold text-clutch-text">{value ? value.toFixed(1) : "--"}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-clutch-panelSoft">
                  <div className="h-full rounded-full bg-clutch-blue" style={{ width: `${Math.min(100, value * 20)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProfileBadgesPanel;
