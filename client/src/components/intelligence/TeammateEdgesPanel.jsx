import { Link } from "react-router-dom";
import { getInitials } from "../../utils/formatters";

const TeammateEdgesPanel = ({ edges = [] }) => (
  <section className="border-b border-white/10 py-6">
    <div className="flex items-end justify-between gap-4">
      <div>
        <div className="eyebrow mb-3">Teammate fit</div>
        <h2 className="text-2xl font-black text-white">Graph edges</h2>
      </div>
      <Link to="/dashboard" className="text-sm font-bold text-clutch-blue hover:text-sky-300">Find squad</Link>
    </div>

    {edges.length ? (
      <div className="mt-5 divide-y divide-white/10">
        {edges.slice(0, 5).map((edge) => {
          const sharedGames = edge.sharedGames?.length ? edge.sharedGames.join(", ") : edge.sharedGame || "Shared rhythm building";
          return (
          <div key={edge.userId || edge.name} className="grid gap-3 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:items-center">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/[0.07] text-sm font-black text-white">
              {getInitials(edge.name)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-black text-white">{edge.name}</div>
              <div className="mt-0.5 truncate text-xs text-zinc-500">{sharedGames} · {edge.reason || "Compatible play rhythm"}</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-black text-white">{edge.compatibility}%</div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-600">fit</div>
            </div>
            <Link to="/dashboard" className="btn-secondary py-2 text-sm">View</Link>
          </div>
          );
        })}
      </div>
    ) : (
      <p className="mt-4 text-sm leading-6 text-zinc-400">Join rooms and collect feedback to build teammate graph edges.</p>
    )}
  </section>
);

export default TeammateEdgesPanel;
