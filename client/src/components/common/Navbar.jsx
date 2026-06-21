import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { initials } from "../../utils/formatters";

const navLinks = [
  { to: "/games", label: "Games" },
  { to: "/activity", label: "Activity" },
  { to: "/leaderboards", label: "Leaderboards" },
  { to: "/lobbies", label: "Lobbies" },
  { to: "/requests", label: "Requests" }
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/");
  };

  const goTo = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-clutch-border bg-clutch-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between px-4 py-3 md:px-6">
        <Link to="/" className="flex items-center gap-3">
          <img src="/clutchq-logo.svg" alt="ClutchQ" className="h-8 w-8 rounded-md bg-black" />
          <div className="text-xl font-black tracking-tight text-clutch-text">ClutchQ</div>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-semibold text-clutch-muted lg:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? "text-clutch-text" : "hover:text-clutch-text")}
            >
              {link.label}
            </NavLink>
          ))}
          {user?.role === "admin" && (
            <NavLink to="/admin" className={({ isActive }) => (isActive ? "text-clutch-text" : "hover:text-clutch-text")}>
              Admin
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative flex items-center gap-3" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((current) => !current)}
                className="flex items-center gap-2 rounded-full bg-clutch-panel px-2.5 py-2 text-left transition hover:bg-clutch-panelSoft"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <div className="grid h-8 w-8 place-items-center rounded-full bg-[#3a3a42] text-xs font-semibold text-clutch-text">
                  {initials(user.name)}
                </div>
                <span className="max-w-28 truncate text-sm font-semibold text-clutch-text">{user.name}</span>
                <span className="hidden text-xs text-clutch-muted sm:inline">{menuOpen ? "Close" : "Menu"}</span>
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-md border border-clutch-border bg-[#242428] shadow-2xl"
                  role="menu"
                >
                  <div className="border-b border-clutch-border px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-full bg-[#3a3a42] text-sm font-bold text-clutch-text">
                        {initials(user.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-clutch-text">{user.name}</div>
                        <div className="truncate text-xs text-clutch-muted">{user.email}</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <button type="button" onClick={() => goTo("/profile")} className="w-full rounded-md px-3 py-2.5 text-left text-sm font-semibold text-clutch-text hover:bg-clutch-panelSoft">
                      Profile overview
                    </button>
                    <button type="button" onClick={() => goTo("/profile?tab=steam")} className="w-full rounded-md px-3 py-2.5 text-left text-sm font-semibold text-clutch-muted hover:bg-clutch-panelSoft hover:text-clutch-text">
                      Steam and library
                    </button>
                    <button type="button" onClick={() => goTo("/profile?tab=settings")} className="w-full rounded-md px-3 py-2.5 text-left text-sm font-semibold text-clutch-muted hover:bg-clutch-panelSoft hover:text-clutch-text">
                      Account settings
                    </button>
                    <button type="button" onClick={() => goTo("/dashboard")} className="w-full rounded-md px-3 py-2.5 text-left text-sm font-semibold text-clutch-muted hover:bg-clutch-panelSoft hover:text-clutch-text">
                      Dashboard
                    </button>
                    <button type="button" onClick={() => goTo("/requests")} className="w-full rounded-md px-3 py-2.5 text-left text-sm font-semibold text-clutch-muted hover:bg-clutch-panelSoft hover:text-clutch-text">
                      Requests
                    </button>
                  </div>
                  <div className="border-t border-clutch-border p-2">
                    <button type="button" onClick={handleLogout} className="w-full rounded-md px-3 py-2.5 text-left text-sm font-semibold text-red-100 hover:bg-clutch-red/10">
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-secondary py-2">
                Login
              </Link>
              <Link to="/register" className="btn-primary py-2">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
