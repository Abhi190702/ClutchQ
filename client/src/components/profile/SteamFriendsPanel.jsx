import { formatDate } from "../../utils/formatters";
import ProfileEmptyState from "./ProfileEmptyState";

const SteamFriendsPanel = ({ friends = [] }) => {
  const onClutchQ = friends.filter((friend) => friend.onClutchQ).length;

  return (
    <section id="friends" className="card p-5 md:p-6">
      <div className="flex flex-col gap-3 border-b border-clutch-border pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="eyebrow">Steam friends</div>
          <h2 className="mt-2 text-2xl font-bold text-clutch-text">Friend graph</h2>
          <p className="mt-2 text-sm text-clutch-muted">Public Steam friends, with ClutchQ matches highlighted when possible.</p>
        </div>
        <div className="text-sm font-semibold text-clutch-muted">{friends.length} synced - {onClutchQ} on ClutchQ</div>
      </div>
      {!friends.length ? (
        <div className="mt-5">
          <ProfileEmptyState title="Steam friends are private or unavailable." description="Steam friend lists must be public before ClutchQ can sync them." />
        </div>
      ) : (
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {friends.slice(0, 9).map((friend, index) => (
            <div key={friend.friendSteamId || friend._id || friend.clutchQUserId || friend.displayName || index} className="rounded-md border border-clutch-border bg-clutch-bg/40 p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-full bg-clutch-panelSoft">
                  {friend.avatar ? <img src={friend.avatar} alt="" className="h-full w-full object-cover" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-1 text-sm font-bold text-clutch-text">{friend.displayName || "Steam friend"}</h3>
                  <p className="mt-1 text-xs text-clutch-muted">{friend.friendSince ? `Friend since ${formatDate(friend.friendSince)}` : "Steam friend"}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {friend.onClutchQ && <span className="rounded-full border border-clutch-green/30 bg-clutch-green/10 px-2.5 py-1 text-xs font-bold text-emerald-200">On ClutchQ</span>}
                {friend.profileUrl && (
                  <a href={friend.profileUrl} target="_blank" rel="noreferrer" className="rounded-full border border-clutch-border px-2.5 py-1 text-xs font-bold text-clutch-muted">
                    Steam profile
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default SteamFriendsPanel;
