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

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

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
            <>
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="hidden items-center gap-2 rounded-full bg-clutch-panel px-2.5 py-2 text-left transition hover:bg-clutch-panelSoft sm:flex"
              >
                <div className="grid h-8 w-8 place-items-center rounded-full bg-[#3a3a42] text-xs font-semibold text-clutch-text">
                  {initials(user.name)}
                </div>
                <span className="max-w-28 truncate text-sm font-semibold text-clutch-text">{user.name}</span>
              </button>
              <button onClick={handleLogout} className="btn-secondary py-2">
                Logout
              </button>
            </>
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
