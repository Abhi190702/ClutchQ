const tone = {
  success: "border-clutch-green/40 bg-clutch-green/15 text-green-100",
  error: "border-clutch-red/40 bg-clutch-red/15 text-red-100",
  info: "border-clutch-cyan/40 bg-clutch-cyan/15 text-cyan-100"
};

const Toast = ({ message, type = "success" }) => (
  <div className={`rounded-lg border px-4 py-3 text-sm shadow-card ${tone[type] || tone.info}`}>
    {message}
  </div>
);

export default Toast;
