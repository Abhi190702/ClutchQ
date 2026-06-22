import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Home", icon: "M5 5h6v6H5zM13 5h6v4h-6zM13 11h6v8h-6zM5 13h6v6H5z" },
  { to: "/games", label: "Games", icon: "M5 8h14M7 16h10M8 5l-3 6 3 6M16 5l3 6-3 6" },
  { to: "/lobbies", label: "Lobbies", icon: "M7 8h10M7 12h6M5 5h14v10H8l-3 4z" },
  { to: "/requests", label: "Requests", icon: "M5 7h14M5 12h14M5 17h9" },
  { to: "/profile", label: "Profile", icon: "M12 12a4 4 0 100-8 4 4 0 000 8zM5 20a7 7 0 0114 0" }
];

const MobileBottomNav = () => (
  <nav
    className="fixed inset-x-0 bottom-0 z-50 border-t border-clutch-border bg-clutch-bg/95 px-2 pt-2 backdrop-blur lg:hidden"
    style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
    aria-label="Primary mobile navigation"
  >
    <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          aria-label={item.label}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 rounded-md px-2 py-2 text-[11px] font-bold transition ${
              isActive ? "bg-clutch-blue text-black" : "text-clutch-muted hover:bg-white/[0.06] hover:text-clutch-text"
            }`
          }
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" aria-hidden="true">
            <path d={item.icon} />
          </svg>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </div>
  </nav>
);

export default MobileBottomNav;
