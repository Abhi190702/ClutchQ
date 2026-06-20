import { formatDate } from "./profileDisplay";
import ProfileEmptyState from "./ProfileEmptyState";

const AchievementRow = ({ achievement }) => (
  <div className="flex gap-3 rounded-md border border-clutch-border bg-clutch-bg/40 p-3">
    <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-md bg-clutch-panelSoft">
      {achievement.icon ? <img src={achievement.icon} alt="" className="h-full w-full object-cover" /> : <span className="font-bold">A</span>}
    </div>
    <div className="min-w-0">
      <h3 className="line-clamp-1 text-sm font-bold text-clutch-text">{achievement.displayName || achievement.achievementName}</h3>
      <p className="mt-1 line-clamp-1 text-xs text-clutch-muted">{achievement.gameName}</p>
      <p className="mt-1 text-xs text-clutch-muted">{achievement.unlockTime ? formatDate(achievement.unlockTime) : "Locked or unknown"}</p>
    </div>
  </div>
);

const SteamAchievementsPanel = ({ summary }) => {
  const total = summary?.total || 0;

  return (
    <section id="achievements" className="card p-5 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="eyebrow">Steam achievements</div>
          <h2 className="mt-2 text-2xl font-bold text-clutch-text">Achievement profile</h2>
          <p className="mt-2 text-sm text-clutch-muted">Tracked from synced public Steam achievements for your top games.</p>
        </div>
        <div className="rounded-md border border-clutch-border px-4 py-3 text-right">
          <div className="text-2xl font-bold text-clutch-text">{summary?.completionPercentage || 0}%</div>
          <div className="text-xs text-clutch-muted">Completion</div>
        </div>
      </div>
      {!total ? (
        <div className="mt-5">
          <ProfileEmptyState title="No Steam achievements found yet." description="Sync Steam or play supported public games to fill this panel." />
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-clutch-border bg-clutch-bg/40 p-4">
              <div className="text-2xl font-bold">{total}</div>
              <div className="text-sm text-clutch-muted">Tracked</div>
            </div>
            <div className="rounded-md border border-clutch-border bg-clutch-bg/40 p-4">
              <div className="text-2xl font-bold">{summary.unlocked || 0}</div>
              <div className="text-sm text-clutch-muted">Unlocked</div>
            </div>
            <div className="rounded-md border border-clutch-border bg-clutch-bg/40 p-4">
              <div className="text-2xl font-bold">{summary.locked || 0}</div>
              <div className="text-sm text-clutch-muted">Remaining</div>
            </div>
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-clutch-muted">Recent unlocks</h3>
              <div className="space-y-3">
                {(summary.recentUnlocks || []).slice(0, 5).map((achievement) => (
                  <AchievementRow key={`${achievement.appId}-${achievement.achievementName}`} achievement={achievement} />
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-clutch-muted">Top completion games</h3>
              <div className="space-y-3">
                {(summary.byGame || []).slice(0, 5).map((game) => (
                  <div key={game.gameName} className="rounded-md border border-clutch-border bg-clutch-bg/40 p-3">
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="font-bold text-clutch-text">{game.gameName}</span>
                      <span className="text-clutch-muted">{game.unlocked}/{game.total}</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-clutch-panelSoft">
                      <div className="h-full rounded-full bg-clutch-blue" style={{ width: `${game.completionPercentage || 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default SteamAchievementsPanel;
