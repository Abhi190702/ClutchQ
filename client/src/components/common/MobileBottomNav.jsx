import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Discover", icon: "M12 3a9 9 0 100 18 9 9 0 000-18zM15.5 8.5l-2 5-5 2 2-5z", end: true },
  { to: "/dashboard", label: "Home", icon: "M5 5h6v6H5zM13 5h6v4h-6zM13 11h6v8h-6zM5 13h6v6H5z" },
  { to: "/games", label: "Games", icon: "M5 8h14M7 16h10M8 5l-3 6 3 6M16 5l3 6-3 6" },
  { to: "/lobbies", label: "Lobbies", icon: "M7 8h10M7 12h6M5 5h14v10H8l-3 4z" },
  { to: "/requests", label: "Requests", icon: "M5 7h14M5 12h14M5 17h9" },
  { to: "/profile", label: "Profile", icon: "M12 12a4 4 0 100-8 4 4 0 000 8zM5 20a7 7 0 0114 0" }
];

const MobileBottomNav = () => (
  <nav
    className="fixed inset-x-3 bottom-3 z-50 rounded-[24px] border border-white/10 bg-[#0d0f14]/92 p-2 shadow-[0_24px_70px_rgba(0,0,0,0.48)] backdrop-blur-2xl lg:hidden"
    style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    aria-label="Primary mobile navigation"
  >
    <div className="mx-auto grid max-w-md grid-cols-6 gap-1">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          aria-label={item.label}
          className={({ isActive }) =>
            `flex min-h-14 flex-col items-center justify-center gap-1 rounded-[16px] px-1 py-2 text-[9px] font-black transition ${
              isActive ? "bg-clutch-blue text-[#071017] shadow-[0_10px_24px_rgba(61,187,250,0.2)]" : "text-zinc-500 hover:bg-white/[0.06] hover:text-clutch-text"
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
