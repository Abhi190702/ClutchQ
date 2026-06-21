const RequestTabs = ({ tabs = [], active, counts = {}, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        type="button"
        aria-label={`${tab.label} ${counts[tab.id] || 0}`}
        aria-pressed={active === tab.id}
        onClick={() => onChange(tab.id)}
        className={`rounded-full px-4 py-2 text-sm font-black transition ${
          active === tab.id ? "bg-white text-black" : "bg-white/[0.06] text-zinc-400 hover:bg-white/[0.1] hover:text-white"
        }`}
      >
        {tab.label}
        <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${active === tab.id ? "bg-black/10 text-black" : "bg-black/20 text-zinc-400"}`}>
          {counts[tab.id] || 0}
        </span>
      </button>
    ))}
  </div>
);

export default RequestTabs;
