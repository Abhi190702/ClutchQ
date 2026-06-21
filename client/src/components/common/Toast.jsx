const tone = {
  success: "border-clutch-green/40 bg-clutch-green/15 text-green-100",
  error: "border-clutch-red/40 bg-clutch-red/15 text-red-100",
  info: "border-clutch-cyan/40 bg-clutch-cyan/15 text-cyan-100"
};

const Toast = ({ message, type = "success", onClose }) => (
  <div className={`flex items-start justify-between gap-4 rounded-lg border px-4 py-3 text-sm shadow-card ${tone[type] || tone.info}`}>
    <span className="leading-5">{message}</span>
    {onClose ? (
      <button type="button" className="-mr-1 rounded px-1 text-lg leading-none opacity-70 transition hover:opacity-100" onClick={onClose} aria-label="Dismiss notification">
        x
      </button>
    ) : null}
  </div>
);

export default Toast;
