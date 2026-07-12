import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import Toast from "../components/common/Toast";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = "success") => {
    const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => {
      dismissToast(id);
    }, 3200);
  }, [dismissToast]);

  useEffect(() => {
    const handleToast = (event) => {
      if (!event.detail?.message) return;
      showToast(event.detail.message, event.detail.type || "info");
    };
    window.addEventListener("clutchq:toast", handleToast);
    return () => window.removeEventListener("clutchq:toast", handleToast);
  }, [showToast]);

  const value = useMemo(
    () => ({ showToast }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={() => dismissToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
