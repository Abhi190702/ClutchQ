import { Link } from "react-router-dom";
import EmptyState from "../common/EmptyState";
import { getInitials } from "../../utils/formatters";

const FriendCompatibilityStrip = ({ friends = [] }) => (
  <section className="rounded-[28px] border border-white/10 bg-[#18191f] p-5 shadow-2xl shadow-black/10 sm:p-6">
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="eyebrow mb-3">Squad fit</div>
        <h2 className="text-2xl font-black text-white">Best teammate rhythm</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-500">Players with the strongest game overlap, session timing, and role fit.</p>
      </div>
      <Link to="/dashboard" className="shrink-0 text-sm font-black text-clutch-blue hover:text-sky-200">
        Find squad
      </Link>
    </div>

    {friends.length ? (
      <div className="mt-6 divide-y divide-white/10">
        {friends.slice(0, 6).map((friend) => (
          <div
            key={friend.userId || friend.id || friend.name}
            className="py-4 first:pt-0 last:pb-0"
          >
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-white/[0.08] text-sm font-black text-white ring-1 ring-white/10">
                {friend.avatar ? <img src={friend.avatar} alt="" className="h-full w-full object-cover" /> : getInitials(friend.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-black text-white">{friend.name}</div>
                <div className="mt-1 line-clamp-1 text-sm text-zinc-500">
                  {(friend.sharedGames?.join(", ") || friend.sharedGame || "Shared rhythm building")} · {friend.reasons?.[0] || friend.role || "Fit signal"}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-2xl font-black text-white">{friend.compatibility}%</div>
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-600">fit</div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between pl-16">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-600">Rhythm match</span>
              <Link to="/dashboard" className="text-sm font-black text-white transition hover:text-clutch-blue">
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
