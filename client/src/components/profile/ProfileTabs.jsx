const ProfileTabs = ({ tabs, activeTab, onChange }) => (
  <div className="border-b border-white/10">
    <div className="flex gap-1 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`relative shrink-0 px-4 py-4 text-sm font-bold transition ${
            activeTab === tab.id ? "text-clutch-text" : "text-clutch-muted hover:text-clutch-text"
          }`}
        >
          {tab.label}
          <span
            className={`absolute inset-x-4 bottom-0 h-0.5 rounded-full transition ${
              activeTab === tab.id ? "bg-clutch-blue opacity-100" : "bg-transparent opacity-0"
            }`}
          />
        </button>
      ))}
    </div>
  </div>
);

export default ProfileTabs;
