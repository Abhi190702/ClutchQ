import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ChevronIcon from "./ChevronIcon";

const baseLinks = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard", group: "Play" },
  { to: "/games", label: "Games", icon: "games", group: "Play" },
  { to: "/activity", label: "Activity", icon: "activity", group: "Play" },
  { to: "/leaderboards", label: "Leaderboards", icon: "leaders", group: "Play" },
  { to: "/lobbies", label: "Lobbies", icon: "lobbies", group: "Squad" },
  { to: "/requests", label: "Requests", icon: "requests", group: "Squad" },
  { to: "/reviews", label: "Reviews", icon: "reviews", group: "Account" },
  { to: "/profile", label: "Profile", icon: "profile", group: "Account" }
];

const iconPaths = {
  games: "M5 8h14M7 16h10M8 5l-3 6 3 6M16 5l3 6-3 6",
  activity: "M4 15h3l3-8 4 10 3-6h3",
  leaders: "M6 18V9m6 9V5m6 13v-6",
  dashboard: "M5 5h6v6H5zM13 5h6v4h-6zM13 11h6v8h-6zM5 13h6v6H5z",
  lobbies: "M7 8h10M7 12h6M5 5h14v10H8l-3 4z",
  requests: "M5 7h14M5 12h14M5 17h9",
  reviews: "M12 4l2.2 4.5 4.8.7-3.5 3.4.8 4.8L12 15.2 7.7 17.4l.8-4.8L5 9.2l4.8-.7z",
  profile: "M12 12a4 4 0 100-8 4 4 0 000 8zM5 20a7 7 0 0114 0",
  admin: "M12 3l7 3v5c0 4.2-2.8 7.8-7 9-4.2-1.2-7-4.8-7-9V6z"
};

const SidebarIcon = ({ name }) => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" aria-hidden="true">
    <path d={iconPaths[name] || iconPaths.dashboard} />
  </svg>
);

const Sidebar = () => {
  const { isAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("clutchq-sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });
  const links = isAdmin ? [...baseLinks, { to: "/admin", label: "Admin", icon: "admin", group: "Account" }] : baseLinks;
  const groups = links.reduce((map, link) => {
    map[link.group] = [...(map[link.group] || []), link];
    return map;
  }, {});

  useEffect(() => {
    try {
      localStorage.setItem("clutchq-sidebar-collapsed", String(collapsed));
    } catch {
      // Ignore storage failures in private browsing.
    }
  }, [collapsed]);

  return (
    <aside className={`hidden shrink-0 border-r border-white/10 bg-[#101014]/95 transition-all duration-300 lg:block ${collapsed ? "w-[76px]" : "w-[276px]"}`}>
      <div className="sticky top-0 flex h-screen flex-col px-3 py-4">
        <div className={`mb-8 flex items-center ${collapsed ? "flex-col justify-center gap-3" : "justify-between"}`}>
          <div className={`flex min-w-0 items-center ${collapsed ? "justify-center" : "gap-3"}`}>
            <img src="/brand/clutchq-logo.png" alt="ClutchQ" className="h-10 w-10 shrink-0 rounded-xl object-cover" />
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-500">ClutchQ</div>
                <div className="mt-1 truncate text-sm font-bold text-zinc-100">Squad Console</div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((current) => !current)}
            className="grid h-10 w-10 place-items-center rounded-md border border-white/10 text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronIcon direction={collapsed ? "right" : "left"} size={18} />
          </button>
        </div>

        <nav className="thin-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
          {Object.entries(groups).map(([group, groupLinks]) => (
            <div key={group} className="mb-6">
              {!collapsed && <div className="mb-2 px-3 text-[11px] font-black uppercase tracking-[0.24em] text-zinc-600">{group}</div>}
              <div className="space-y-1">
                {groupLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    title={collapsed ? link.label : undefined}
                    className={({ isActive }) =>
                      `group relative flex h-11 items-center rounded-xl text-sm font-bold transition ${
                        collapsed ? "justify-center px-0" : "gap-3 px-3"
                      } ${
                        isActive
                          ? "bg-white/[0.09] text-white"
                          : "text-zinc-500 hover:bg-white/[0.055] hover:text-white"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive ? <span className="absolute left-0 top-2 h-7 w-1 rounded-r-full bg-clutch-blue" /> : null}
                        <span className={`flex min-w-0 items-center ${collapsed ? "justify-center" : "gap-3"}`}>
                          <span className={isActive ? "text-clutch-blue" : "text-zinc-600 group-hover:text-zinc-200"}>
                            <SidebarIcon name={link.icon} />
                          </span>
                          {!collapsed && <span className="truncate">{link.label}</span>}
                        </span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {!collapsed && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-600">Live Demo</div>
            <p className="mt-2 text-sm leading-5 text-zinc-400">Use seeded accounts for judge-ready rooms, requests, and activity.</p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
