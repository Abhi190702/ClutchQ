import { useState } from "react";
import { useToast } from "../../context/ToastContext";
import api, { getErrorMessage } from "../../services/api";

const DiscordSetupStatus = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const checkSetup = async () => {
    setLoading(true);

    try {
      const response = await api.get("/discord/health");
      setResult(response.data);
      showToast(response.data.success ? "Discord setup looks ready." : "Discord setup needs attention.", response.data.success ? "success" : "error");
    } catch (error) {
      const message = getErrorMessage(error);
      setResult({
        success: false,
        checks: [{ key: "request", success: false, message }]
      });
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-clutch-text">Discord Setup Status</h3>
          <p className="mt-1 text-sm text-clutch-muted">Checks bot access, server/category config, and required voice-room permissions.</p>
        </div>
        <button type="button" className="btn-primary w-full md:w-auto" onClick={checkSetup} disabled={loading}>
          {loading ? "Checking..." : "Check Discord Setup"}
        </button>
      </div>

      {result ? (
        <div className="mt-5 space-y-3">
          <div className={`rounded-md border p-3 text-sm font-semibold ${result.success ? "border-clutch-green/30 bg-clutch-green/10 text-green-100" : "border-clutch-red/30 bg-clutch-red/10 text-red-100"}`}>
            {result.success ? "Discord setup is ready." : "Discord setup needs attention."}
          </div>
          <div className="grid gap-2">
            {result.checks?.map((check) => (
              <div key={check.key} className="flex gap-3 rounded-md border border-clutch-border bg-clutch-panelSoft p-3 text-sm">
                <span className={check.success ? "text-green-200" : "text-red-200"}>{check.success ? "Pass" : "Fix"}</span>
                <span className="text-clutch-muted">{check.message}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DiscordSetupStatus;
