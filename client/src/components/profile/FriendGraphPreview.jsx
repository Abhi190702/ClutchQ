import { formatDate, getInitials } from "../../utils/formatters";
import ProfileEmptyState from "./ProfileEmptyState";

const FriendGraphPreview = ({ friends = [] }) => {
  if (!friends.length) {
    return (
      <ProfileEmptyState
        title="Steam friends are private or unavailable."
        description="Steam friend lists must be public before ClutchQ can sync them."
      />
    );
  }

  const onClutchQ = friends.filter((friend) => friend.onClutchQ).length;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-clutch-muted">Friend graph</div>
          <h3 className="mt-2 text-2xl font-black text-clutch-text">{friends.length} synced friends</h3>
        </div>
        <div className="rounded-full border border-clutch-green/30 bg-clutch-green/10 px-3 py-1 text-xs font-bold text-emerald-200">
          {onClutchQ} on ClutchQ
        </div>
      </div>

      <div className="mt-5 divide-y divide-white/10">
        {friends.slice(0, 5).map((friend) => (
          <div key={friend.friendSteamId || friend.displayName} className="flex items-center gap-3 py-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-clutch-panelSoft text-xs font-black text-clutch-muted">
              {friend.avatar ? <img src={friend.avatar} alt="" className="h-full w-full object-cover" /> : getInitials(friend.displayName || "Steam Friend")}
            </div>
            <div className="min-w-0 flex-1">
              <div className="line-clamp-1 text-sm font-bold text-clutch-text">{friend.displayName || "Steam friend"}</div>
              <div className="line-clamp-1 text-xs text-clutch-muted">{friend.friendSince ? `Friend since ${formatDate(friend.friendSince)}` : "Steam friend"}</div>
            </div>
            {friend.profileUrl && (
              <a href={friend.profileUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-clutch-blue">
                View
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FriendGraphPreview;
