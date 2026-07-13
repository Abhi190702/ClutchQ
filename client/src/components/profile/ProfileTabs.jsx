const ProfileTabs = ({ tabs, activeTab, onChange }) => {
  const handleKeyDown = (event, index) => {
    const keyOffsets = { ArrowLeft: -1, ArrowRight: 1 };
    let nextIndex;

    if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else if (Object.hasOwn(keyOffsets, event.key)) nextIndex = (index + keyOffsets[event.key] + tabs.length) % tabs.length;
    else return;

    event.preventDefault();
    onChange(tabs[nextIndex].id);
    event.currentTarget.parentElement?.querySelectorAll('[role="tab"]')[nextIndex]?.focus();
  };

  return (
    <div className="border-b border-white/10">
      <div className="scrollbar-none flex gap-1 overflow-x-auto" role="tablist" aria-label="Profile sections">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`relative shrink-0 px-4 py-4 text-sm font-bold transition ${
              activeTab === tab.id ? "text-clutch-text" : "text-clutch-muted hover:text-clutch-text"
            }`}
          >
            {tab.label}
            <span
              aria-hidden="true"
              className={`absolute inset-x-4 bottom-0 h-0.5 rounded-full transition ${
                activeTab === tab.id ? "bg-clutch-blue opacity-100" : "bg-transparent opacity-0"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProfileTabs;
