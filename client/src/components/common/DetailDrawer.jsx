import { useEffect, useRef } from "react";

const DetailDrawer = ({ open, title, subtitle, children, onClose }) => {
  const closeButtonRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;

    const previousActiveElement = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onCloseRef.current?.();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActiveElement?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-drawer-title"
      aria-describedby={subtitle ? "detail-drawer-subtitle" : undefined}
    >
      <button
        type="button"
        aria-label="Close details"
        className="absolute inset-0 h-full w-full cursor-default bg-black/65 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="absolute bottom-0 right-0 flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-[28px] border border-white/10 bg-[#14161c]/98 shadow-[0_30px_100px_rgba(0,0,0,0.6)] backdrop-blur-2xl md:bottom-auto md:top-0 md:h-full md:max-h-none md:w-[440px] md:rounded-l-[28px] md:rounded-tr-none">
        <header className="border-b border-white/[0.08] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="detail-drawer-title" className="text-xl font-black tracking-tight text-clutch-text">{title}</h2>
              {subtitle ? <p id="detail-drawer-subtitle" className="mt-1 text-sm leading-6 text-clutch-muted">{subtitle}</p> : null}
            </div>
            <button ref={closeButtonRef} type="button" aria-label="Close details" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-[14px] border border-white/[0.08] text-xl leading-none text-zinc-500 transition hover:bg-white/[0.06] hover:text-white">
              x
            </button>
          </div>
        </header>
        <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
      </aside>
    </div>
  );
};

export default DetailDrawer;
