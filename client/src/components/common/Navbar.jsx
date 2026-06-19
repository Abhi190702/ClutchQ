import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { initials } from "../../utils/formatters";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-clutch-border bg-clutch-bg/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img src="/clutchq-logo.svg" alt="ClutchQ" className="h-9 w-9 rounded-lg" />
          <div>
            <div className="text-sm font-black tracking-wide text-clutch-text">ClutchQ</div>
            <div className="hidden text-xs text-clutch-muted sm:block">Squad intelligence system</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-5 text-sm text-clutch-muted md:flex">
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "text-clutch-cyan" : "hover:text-clutch-text")}>
            Dashboard
          </NavLink>
          <NavLink to="/lobbies" className={({ isActive }) => (isActive ? "text-clutch-cyan" : "hover:text-clutch-text")}>
            Lobbies
          </NavLink>
          <NavLink to="/requests" className={({ isActive }) => (isActive ? "text-clutch-cyan" : "hover:text-clutch-text")}>
            Requests
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => (isActive ? "text-clutch-cyan" : "hover:text-clutch-text")}>
            Profile
          </NavLink>
          {user?.role === "admin" && (
            <NavLink to="/admin" className={({ isActive }) => (isActive ? "text-clutch-cyan" : "hover:text-clutch-text")}>
              Admin
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden items-center gap-2 rounded-lg border border-clutch-border bg-clutch-panelSoft px-3 py-2 sm:flex">
                <div className="grid h-7 w-7 place-items-center rounded-md bg-clutch-cyan/15 text-xs font-black text-clutch-cyan">
                  {initials(user.name)}
                </div>
                <span className="max-w-28 truncate text-sm font-semibold text-clutch-text">{user.name}</span>
              </div>
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
