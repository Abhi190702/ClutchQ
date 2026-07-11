import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ProfileAccountMenu from "../navigation/ProfileAccountMenu";

const navLinks = [
  { to: "/", label: "Discover" },
  { to: "/games", label: "Games" },
  { to: "/activity", label: "Activity" },
  { to: "/lobbies", label: "Lobbies" },
  { to: "/leaderboards", label: "Leaderboards" }
];

const Navbar = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
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

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4">
      <div className="mx-auto flex max-w-[1540px] items-center justify-between rounded-[22px] border border-white/[0.09] bg-[#0d0f14]/90 px-4 py-3 shadow-[0_18px_55px_rgba(0,0,0,0.32)] backdrop-blur-2xl md:px-5">
        <Link to="/" className="flex items-center gap-3">
          <img src="/brand/clutchq-logo.png" alt="ClutchQ" className="h-10 w-10 rounded-[13px] object-cover ring-1 ring-white/10" />
          <div className="text-xl font-black tracking-[-0.03em] text-clutch-text">ClutchQ</div>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.025] p-1 text-sm font-semibold text-clutch-muted lg:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `rounded-full px-4 py-2 transition ${isActive ? "bg-white/[0.09] text-white" : "hover:bg-white/[0.045] hover:text-clutch-text"}`}
            >
              {link.label}
            </NavLink>
          ))}
          {user?.role === "admin" && (
            <NavLink to="/admin" className={({ isActive }) => `rounded-full px-4 py-2 transition ${isActive ? "bg-white/[0.09] text-white" : "hover:bg-white/[0.045] hover:text-clutch-text"}`}>
              Admin
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <ProfileAccountMenu
              user={user}
              profile={profile}
              steamSummary={steamSummary}
              steamLinked={Boolean(steamProvider?.steamId)}
              onLogout={handleLogout}
            />
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
