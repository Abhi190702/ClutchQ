import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const PageShell = ({ children, title, eyebrow, actions, fullWidth = false }) => (
  <div className="noise-bg min-h-screen text-clutch-text">
    <Navbar />
    <div className="flex">
      <Sidebar />
      <main className={`mx-auto w-full ${fullWidth ? "" : "max-w-7xl"} px-4 py-6 md:px-6`}>
        {(title || eyebrow || actions) && (
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
              {title && <h1 className="text-3xl font-black tracking-tight md:text-4xl">{title}</h1>}
            </div>
            {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
          </div>
        )}
        {children}
      </main>
    </div>
  </div>
);

export default PageShell;
