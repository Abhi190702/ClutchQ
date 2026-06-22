import { useEffect } from "react";

const DetailDrawer = ({ open, title, subtitle, children, onClose }) => {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="detail-drawer-title">
      <button
        type="button"
        aria-label="Close details"
        className="absolute inset-0 h-full w-full cursor-default bg-black/65 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="absolute bottom-0 right-0 flex max-h-[86vh] w-full flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[#18181d] shadow-2xl md:bottom-auto md:top-0 md:h-full md:max-h-none md:w-[420px] md:rounded-l-2xl md:rounded-tr-none">
        <header className="border-b border-white/10 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="detail-drawer-title" className="text-xl font-black tracking-tight text-clutch-text">{title}</h2>
              {subtitle ? <p className="mt-1 text-sm leading-6 text-clutch-muted">{subtitle}</p> : null}
            </div>
            <button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-xl leading-none text-zinc-500 transition hover:bg-white/[0.06] hover:text-white">
              x
            </button>
          </div>
        </header>
        <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
      </aside>
    </div>
  );
};

export default DetailDrawer;
