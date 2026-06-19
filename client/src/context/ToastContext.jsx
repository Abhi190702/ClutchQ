import { createContext, useContext, useMemo, useState } from "react";
import Toast from "../components/common/Toast";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const value = useMemo(
    () => ({
      showToast: (message, type = "success") => {
        const id = crypto.randomUUID();
        setToasts((current) => [...current, { id, message, type }]);
        window.setTimeout(() => {
          setToasts((current) => current.filter((toast) => toast.id !== id));
        }, 3200);
      }
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
