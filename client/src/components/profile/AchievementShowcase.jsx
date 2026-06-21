import { formatDate } from "./profileDisplay";
import ProfileEmptyState from "./ProfileEmptyState";

const AchievementShowcase = ({ summary }) => {
  const total = summary?.total || 0;

  if (!total) {
    return (
      <ProfileEmptyState
        title="No public achievements found yet."
        description="Achievements depend on game support and Steam privacy. Sync again after making Game Details public."
      />
    );
  }

  const recent = (summary.recentUnlocks || []).slice(0, 4);
  const rarest = summary.rarest?.[0];

  return (
    <div className="rounded-md bg-black/15 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-clutch-muted">Achievements</div>
          <h3 className="mt-2 text-xl font-black text-clutch-text">{summary.completionPercentage || 0}% complete</h3>
        </div>
        <div className="text-right text-sm text-clutch-muted">
          <span className="font-black text-clutch-text">{summary.unlocked || 0}</span> / {total} unlocked
        </div>
      </div>

      {rarest && (
        <div className="mt-4 rounded-md border border-white/10 bg-white/[0.03] p-3">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-clutch-muted">Rarest unlock</div>
          <div className="mt-1 line-clamp-1 text-sm font-bold text-clutch-text">{rarest.displayName || rarest.achievementName}</div>
          <div className="mt-1 text-xs text-clutch-muted">{rarest.gameName}</div>
        </div>
      )}

      <div className="mt-4 space-y-3">
        {recent.map((achievement) => (
          <div key={`${achievement.appId}-${achievement.achievementName}`} className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-clutch-panelSoft">
              {achievement.icon ? <img src={achievement.icon} alt="" className="h-full w-full object-cover" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="line-clamp-1 text-sm font-bold text-clutch-text">{achievement.displayName || achievement.achievementName}</div>
              <div className="line-clamp-1 text-xs text-clutch-muted">{achievement.unlockTime ? formatDate(achievement.unlockTime) : achievement.gameName}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AchievementShowcase;
