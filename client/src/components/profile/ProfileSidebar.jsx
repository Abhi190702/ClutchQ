const sidebarSections = [
  { group: "Account", items: [
    { label: "Overview", href: "#overview" },
    { label: "Linked Accounts", href: "#accounts" },
    { label: "Privacy", href: "#privacy" }
  ] },
  { group: "Gaming", items: [
    { label: "Steam Library", href: "#library" },
    { label: "Achievements", href: "#achievements" },
    { label: "Friends", href: "#friends" },
    { label: "Activity Heatmap", href: "#heatmap" },
    { label: "Match Analytics", href: "#analytics" }
  ] },
  { group: "ClutchQ", items: [
    { label: "Badges", href: "#badges" },
    { label: "Lobbies", href: "/lobbies" },
    { label: "Requests", href: "/requests" }
  ] }
];

const ProfileSidebar = () => (
  <aside className="lg:sticky lg:top-24 lg:self-start">
    <div className="card hidden p-4 lg:block">
      {sidebarSections.map((section) => (
        <div key={section.group} className="mb-5 last:mb-0">
          <div className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-clutch-muted">{section.group}</div>
          <div className="space-y-1">
            {section.items.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm font-semibold text-clutch-muted transition hover:bg-clutch-panelSoft hover:text-clutch-text"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
    <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
      {sidebarSections.flatMap((section) => section.items).slice(0, 8).map((item) => (
        <a
          key={item.label}
          href={item.href}
          className="shrink-0 rounded-full border border-clutch-border bg-clutch-panel px-4 py-2 text-xs font-semibold text-clutch-muted"
        >
          {item.label}
        </a>
      ))}
    </div>
  </aside>
);

export default ProfileSidebar;
