import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ChevronIcon from "./ChevronIcon";
import ProfileAccountMenu from "../navigation/ProfileAccountMenu";

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
  const { isAdmin, user, profile, logout } = useAuth();
  const navigate = useNavigate();
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
  const steamProvider = user?.authProviders?.steam;
  const steamSummary = steamProvider
    ? {
        connected: true,
        displayName: steamProvider.displayName,
        avatar: steamProvider.avatar,
        profileUrl: steamProvider.profileUrl,
        steamId: steamProvider.steamId
      }
    : null;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  useEffect(() => {
    try {
      localStorage.setItem("clutchq-sidebar-collapsed", String(collapsed));
    } catch {
      // Ignore storage failures in private browsing.
    }
  }, [collapsed]);

  return (
    <aside className={`hidden shrink-0 border-r border-white/[0.07] bg-[#0b0d12]/94 shadow-[18px_0_60px_rgba(0,0,0,0.14)] backdrop-blur-2xl transition-all duration-300 lg:block ${collapsed ? "w-[88px]" : "w-[288px]"}`}>
      <div className="sticky top-0 flex h-screen flex-col px-4 py-5">
        <div className={`mb-9 flex items-center ${collapsed ? "flex-col justify-center gap-4" : "justify-between"}`}>
          <div className={`flex min-w-0 items-center ${collapsed ? "justify-center" : "gap-3"}`}>
            <img src="/brand/clutchq-logo.png" alt="ClutchQ" className="h-11 w-11 shrink-0 rounded-[15px] object-cover shadow-[0_12px_28px_rgba(0,0,0,0.3)] ring-1 ring-white/10" />
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-[11px] font-black uppercase tracking-[0.24em] text-clutch-blue">ClutchQ</div>
                <div className="mt-1 truncate text-sm font-black text-zinc-100">Squad Console</div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((current) => !current)}
            className="grid h-10 w-10 place-items-center rounded-[14px] border border-white/[0.08] bg-white/[0.025] text-zinc-500 transition hover:border-white/15 hover:bg-white/[0.065] hover:text-white"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronIcon direction={collapsed ? "right" : "left"} size={18} />
          </button>
        </div>

        <nav className="thin-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
          {Object.entries(groups).map(([group, groupLinks]) => (
            <div key={group} className="mb-7">
              {!collapsed && <div className="mb-2.5 px-3 text-[10px] font-black uppercase tracking-[0.24em] text-zinc-600">{group}</div>}
              <div className="space-y-1.5">
                {groupLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    title={collapsed ? link.label : undefined}
                    className={({ isActive }) =>
                      `group relative flex h-12 items-center rounded-[16px] text-sm font-bold transition duration-200 ${
                        collapsed ? "justify-center px-0" : "gap-3 px-3"
                      } ${
                        isActive
                          ? "bg-[linear-gradient(90deg,rgba(61,187,250,0.16),rgba(61,187,250,0.055))] text-white ring-1 ring-clutch-blue/20"
                          : "text-zinc-500 hover:bg-white/[0.045] hover:text-white"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className={`flex min-w-0 items-center ${collapsed ? "justify-center" : "gap-3"}`}>
                          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-[11px] transition ${isActive ? "bg-clutch-blue/15 text-clutch-blue" : "text-zinc-600 group-hover:bg-white/[0.04] group-hover:text-zinc-200"}`}>
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

        <div className={`${collapsed ? "mt-4 flex justify-center" : "mt-4 border-t border-white/[0.07] pt-4"}`}>
          {user ? (
            <ProfileAccountMenu
              user={user}
              profile={profile}
              steamSummary={steamSummary}
              steamLinked={Boolean(steamProvider?.steamId)}
              onLogout={handleLogout}
              placement="sidebar"
              compact={collapsed}
            />
          ) : null}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
