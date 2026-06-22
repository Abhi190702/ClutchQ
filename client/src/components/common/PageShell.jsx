import Sidebar from "./Sidebar";
import MobileBottomNav from "./MobileBottomNav";

const PageShell = ({ children, title, eyebrow, actions, fullWidth = false, hideSidebar = false }) => {
  return (
    <div className="noise-bg min-h-screen text-clutch-text">
      <div className="flex min-h-screen">
        {!hideSidebar && <Sidebar />}
        <div className="min-w-0 flex-1">
          <main className="min-w-0 flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-8 lg:pt-7">
            <div className={`mx-auto w-full ${fullWidth ? "max-w-[1520px]" : "max-w-[1240px]"}`}>
              {(title || eyebrow || actions) && (
                <div className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
                  <div>
                    {eyebrow && <div className="eyebrow mb-3">{eyebrow}</div>}
                    {title && <h1 className="text-3xl font-black tracking-tight md:text-4xl">{title}</h1>}
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
