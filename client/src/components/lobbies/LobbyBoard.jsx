import { Link } from "react-router-dom";
import EmptyState from "../common/EmptyState";
import LobbyRow from "./LobbyRow";

const LobbyBoard = ({ items = [], loading, onJoin, requested = [], onClearFilters }) => {
  if (loading) {
    return (
      <section className="rounded-3xl bg-white/[0.035] p-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="grid animate-pulse gap-4 border-b border-white/10 py-5 last:border-b-0 lg:grid-cols-[76px_1fr_190px_120px_90px_270px]">
            <div className="h-24 rounded-2xl bg-white/[0.06]" />
            <div className="space-y-3">
              <div className="h-5 w-1/3 rounded bg-white/[0.08]" />
              <div className="h-3 w-2/3 rounded bg-white/[0.06]" />
              <div className="h-8 w-1/2 rounded bg-white/[0.05]" />
            </div>
          </div>
        ))}
      </section>
    );
  }

  if (!items.length) {
    return (
      <EmptyState
        compact
        className="border-white/10 bg-white/[0.035]"
        title="No lobbies match your filters."
        description="Try clearing filters or create a lobby for tonight."
        action={
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-secondary" onClick={onClearFilters}>Clear filters</button>
            <Link to="/lobbies/create" className="btn-primary">Create lobby</Link>
          </div>
        }
      />
    );
  }

  return (
    <section className="rounded-3xl bg-white/[0.035] px-5">
      {items.map((item) => (
        <LobbyRow key={item.lobby._id} item={item} onJoin={onJoin} requested={requested.includes(item.lobby._id)} />
      ))}
    </section>
  );
};

export default LobbyBoard;
