const ErrorState = ({ title = "Something went wrong", message, onRetry, retryLabel = "Try again", className = "" }) => (
  <div className={`rounded-[22px] border border-clutch-red/30 bg-clutch-red/[0.08] p-5 text-left shadow-[0_18px_50px_rgba(0,0,0,0.2)] ${className}`}>
    <h3 className="text-lg font-bold text-red-100">{title}</h3>
    {message ? <p className="mt-2 text-sm leading-6 text-red-100/80">{message}</p> : null}
    {onRetry ? (
      <button type="button" className="btn-secondary mt-4 border-clutch-red/35 text-red-50 hover:border-clutch-red/60" onClick={onRetry}>
        {retryLabel}
      </button>
    ) : null}
  </div>
);

export default ErrorState;
