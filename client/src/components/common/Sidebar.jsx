import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const links = [
  { to: "/games", label: "Games", hint: "Browse" },
  { to: "/activity", label: "Activity", hint: "Stats" },
  { to: "/leaderboards", label: "Leaders", hint: "Ranks" },
  { to: "/dashboard", label: "Dashboard", hint: "Home" },
  { to: "/lobbies", label: "Lobbies", hint: "Classic" },
  { to: "/requests", label: "Requests", hint: "Inbox" },
  { to: "/reviews", label: "Reviews", hint: "Trust" },
  { to: "/profile", label: "Profile", hint: "Identity" }
];

const Sidebar = () => {
  const { isAdmin } = useAuth();
  const allLinks = isAdmin ? [...links, { to: "/admin", label: "Admin", hint: "Safety" }] : links;

  return (
    <aside className="hidden w-56 shrink-0 border-r border-clutch-border bg-clutch-bg p-3 lg:block">
      <div className="sticky top-20 space-y-2">
        {allLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center justify-between rounded-md border px-3 py-2.5 text-sm transition ${
                isActive
                  ? "border-clutch-border bg-clutch-panelSoft text-clutch-text"
                  : "border-transparent text-clutch-muted hover:border-clutch-border hover:bg-clutch-panel hover:text-clutch-text"
              }`
            }
          >
            <span className="font-semibold">{link.label}</span>
            <span className="text-xs">{link.hint}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
