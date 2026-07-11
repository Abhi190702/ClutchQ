import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "./Sidebar";
import MobileBottomNav from "./MobileBottomNav";
import ProfileAccountMenu from "../navigation/ProfileAccountMenu";
import EmailVerificationBanner from "../auth/EmailVerificationBanner";

const PageShell = ({ children, title, eyebrow, actions, fullWidth = false, hideSidebar = false }) => {
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
    <div className="noise-bg relative min-h-screen text-clutch-text">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-72 bg-[linear-gradient(180deg,rgba(61,187,250,0.045),transparent)]" />
      {!hideSidebar && user ? (
        <div className="fixed inset-x-3 top-3 z-40 flex items-center justify-between rounded-[22px] border border-white/10 bg-[#0d0f14]/90 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-2xl lg:hidden">
          <Link to="/dashboard" className="flex items-center gap-2.5 px-1">
            <img src="/brand/clutchq-logo.png" alt="ClutchQ" className="h-10 w-10 rounded-[13px] object-cover ring-1 ring-white/10" />
            <span className="text-base font-black tracking-[-0.02em] text-white">ClutchQ</span>
          </Link>
          <ProfileAccountMenu
            user={user}
            profile={profile}
            steamSummary={steamSummary}
            steamLinked={Boolean(steamProvider?.steamId)}
            onLogout={handleLogout}
            compact
          />
        </div>
      ) : null}
      <div className="relative z-10 flex min-h-screen">
        {!hideSidebar && <Sidebar />}
        <div className="min-w-0 flex-1">
          <main className="min-w-0 flex-1 px-4 pb-32 pt-24 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10 2xl:px-12">
            <div className={`mx-auto w-full ${fullWidth ? "max-w-[1600px]" : "max-w-[1320px]"}`}>
              <EmailVerificationBanner />
              {(title || eyebrow || actions) && (
                <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                  <div>
                    {eyebrow && <div className="eyebrow mb-3">{eyebrow}</div>}
                    {title && <h1 className="text-4xl font-black tracking-[-0.04em] text-white md:text-5xl">{title}</h1>}
                  </div>
                  {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
                </div>
              )}
              {children}
            </div>
          </main>
        </div>
      </div>
      {!hideSidebar && <MobileBottomNav />}
    </div>
  );
};

export default PageShell;
