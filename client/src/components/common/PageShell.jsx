import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const PageShell = ({ children, title, eyebrow, actions, fullWidth = false }) => (
  <div className="noise-bg min-h-screen text-clutch-text">
    <Navbar />
    <div className="flex">
      <Sidebar />
      <main className={`mx-auto min-w-0 flex-1 ${fullWidth ? "" : "max-w-6xl"} px-4 py-5 md:px-6`}>
        {(title || eyebrow || actions) && (
          <div className="mb-5 flex flex-col gap-3 border-b border-clutch-border pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
              {title && <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>}
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
