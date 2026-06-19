import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const links = [
  { to: "/dashboard", label: "Dashboard", hint: "Matches" },
  { to: "/lobbies", label: "Lobbies", hint: "Squads" },
  { to: "/requests", label: "Requests", hint: "Inbox" },
  { to: "/reviews", label: "Reviews", hint: "Trust" },
  { to: "/profile", label: "Profile", hint: "Identity" }
];

const Sidebar = () => {
  const { isAdmin } = useAuth();
  const allLinks = isAdmin ? [...links, { to: "/admin", label: "Admin", hint: "Safety" }] : links;

  return (
    <aside className="hidden w-64 shrink-0 border-r border-clutch-border bg-clutch-bg/70 p-4 lg:block">
      <div className="sticky top-20 space-y-2">
        {allLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition ${
                isActive
                  ? "border-clutch-cyan/50 bg-clutch-cyan/10 text-clutch-cyan"
                  : "border-transparent text-clutch-muted hover:border-clutch-border hover:bg-clutch-panelSoft hover:text-clutch-text"
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
