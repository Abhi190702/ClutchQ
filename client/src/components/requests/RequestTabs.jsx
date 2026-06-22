const RequestTabs = ({ tabs = [], active, counts = {}, onChange }) => (
  <div className="flex flex-wrap gap-5 border-b border-white/10">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        type="button"
        aria-label={`${tab.label} ${counts[tab.id] || 0}`}
        aria-pressed={active === tab.id}
        onClick={() => onChange(tab.id)}
        className={`relative pb-3 text-sm font-black transition ${
          active === tab.id ? "text-white" : "text-zinc-500 hover:text-white"
        }`}
      >
        {tab.label}
        <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${active === tab.id ? "bg-clutch-blue text-black" : "bg-white/[0.06] text-zinc-400"}`}>
          {counts[tab.id] || 0}
        </span>
        <span className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full ${active === tab.id ? "bg-clutch-blue" : "bg-transparent"}`} />
      </button>
    ))}
  </div>
);

export default RequestTabs;
