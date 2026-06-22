import { Link } from "react-router-dom";
import EmptyState from "../common/EmptyState";
import { getInitials } from "../../utils/formatters";

const FriendCompatibilityStrip = ({ friends = [] }) => (
  <section className="border-b border-white/10 pb-6">
    <div className="flex items-end justify-between gap-4">
      <div>
        <div className="eyebrow mb-3">Squad fit</div>
        <h2 className="text-2xl font-black text-white">Best teammate rhythm</h2>
      </div>
      <Link to="/dashboard" className="hidden text-sm font-bold text-clutch-blue hover:text-sky-300 sm:inline">
        Find squad
      </Link>
    </div>

    {friends.length ? (
      <div className="mt-6 grid gap-x-6 lg:grid-cols-3">
        {friends.slice(0, 6).map((friend) => (
          <div key={friend.id} className="flex items-center gap-3 border-b border-white/10 py-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-white/[0.08] text-sm font-black text-white">
              {friend.avatar ? <img src={friend.avatar} alt="" className="h-full w-full object-cover" /> : getInitials(friend.name)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-black text-white">{friend.name}</div>
              <div className="mt-0.5 truncate text-xs text-zinc-500">{friend.sharedGame} · {friend.role}</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-black text-white">{friend.compatibility}%</div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-600">fit</div>
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
