import { Link } from "react-router-dom";
import EmptyState from "../common/EmptyState";
import { getInitials } from "../../utils/formatters";

const FriendCompatibilityStrip = ({ friends = [] }) => (
  <section className="h-full rounded-[28px] border border-white/10 bg-[#18191f] p-5 shadow-2xl shadow-black/10 sm:p-6">
    <div className="flex items-end justify-between gap-4">
      <div>
        <div className="eyebrow mb-3">Squad fit</div>
        <h2 className="text-2xl font-black text-white">Best teammate rhythm</h2>
      </div>
      <Link to="/dashboard" className="hidden rounded-full bg-white/[0.06] px-4 py-2 text-sm font-black text-clutch-blue hover:bg-white/[0.1] hover:text-sky-200 sm:inline">
        Find squad
      </Link>
    </div>

    {friends.length ? (
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {friends.slice(0, 4).map((friend) => (
          <div
            key={friend.userId || friend.id || friend.name}
            className="rounded-[22px] border border-white/10 bg-black/[0.18] p-4 transition hover:border-white/20 hover:bg-white/[0.04]"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-white/[0.08] text-sm font-black text-white">
                {friend.avatar ? <img src={friend.avatar} alt="" className="h-full w-full object-cover" /> : getInitials(friend.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-black text-white">{friend.name}</div>
                <div className="mt-0.5 truncate text-xs text-zinc-500">
                  {(friend.sharedGames?.join(", ") || friend.sharedGame || "Shared rhythm building")} · {friend.reasons?.[0] || friend.role || "Fit signal"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-black text-white">{friend.compatibility}%</div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-600">fit</div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Rhythm match</span>
              <Link to="/dashboard" className="text-sm font-black text-white hover:text-clutch-blue">
                Invite
              </Link>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <EmptyState
        compact
        className="mt-5"
        title="No teammate compatibility yet."
        description="Join lobbies or add teammates to build compatibility history."
      />
    )}
  </section>
);

export default FriendCompatibilityStrip;
