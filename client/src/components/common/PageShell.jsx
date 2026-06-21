import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ProfileAccountMenu from "../navigation/ProfileAccountMenu";
import Sidebar from "./Sidebar";
import MobileBottomNav from "./MobileBottomNav";

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
    <div className="noise-bg min-h-screen text-clutch-text">
      <div className="flex min-h-screen">
        {!hideSidebar && <Sidebar />}
        <div className="min-w-0 flex-1">
          {!hideSidebar && (
            <header className="sticky top-0 z-30 hidden border-b border-white/10 bg-clutch-bg/80 px-6 py-3 backdrop-blur lg:block">
              <div className="ml-auto flex max-w-[1520px] items-center justify-end">
                {user ? (
                  <ProfileAccountMenu
                    user={user}
                    profile={profile}
                    steamSummary={steamSummary}
                    steamLinked={Boolean(steamProvider?.steamId)}
                    onLogout={handleLogout}
                  />
                ) : null}
              </div>
            </header>
          )}
          <main className="min-w-0 flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-8">
            <div className={`mx-auto w-full ${fullWidth ? "max-w-[1520px]" : "max-w-[1240px]"}`}>
              {(title || eyebrow || actions) && (
                <div className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
                  <div>
                    {eyebrow && <div className="eyebrow mb-3">{eyebrow}</div>}
                    {title && <h1 className="text-3xl font-black tracking-tight md:text-5xl">{title}</h1>}
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
