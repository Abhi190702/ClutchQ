import { useToast } from "../../context/ToastContext";
import { getServerBaseUrl } from "../../utils/constants";
import { AUTH_PROVIDERS } from "../../utils/authProviders";

const profileProviders = ["google", "discord", "steam", "epic", "microsoft", "psn", "nintendo"];

const statusForProvider = (provider, authProviders = {}) => {
  if (provider.id === "google" && authProviders.google?.id) return "Connected";
  if (provider.id === "discord" && authProviders.discord?.id) return "Connected";
  if (provider.status === "oauth") return "Ready";
  if (provider.status === "manual") return "Manual soon";
  return "Coming next";
};

const detailForProvider = (provider, authProviders = {}, status) => {
  if (provider.id === "discord" && authProviders.discord?.id) {
    const discordName = authProviders.discord.globalName || authProviders.discord.username;
    return discordName ? `Discord Connected - ${discordName}` : "Discord Connected";
  }

  if (provider.id === "google" && authProviders.google?.id) {
    return authProviders.google.email ? `Connected - ${authProviders.google.email}` : "Google Connected";
  }

  return status;
};

const ConnectedAccounts = ({ user }) => {
  const { showToast } = useToast();
  const authProviders = user?.authProviders || {};
  const providers = profileProviders.map((id) => AUTH_PROVIDERS.find((provider) => provider.id === id)).filter(Boolean);

  const connect = (provider) => {
    if (provider.status === "oauth" && provider.route) {
      window.location.href = `${getServerBaseUrl()}${provider.route}`;
      return;
    }

    if (provider.status === "manual") {
      showToast(`Manual ${provider.label} linking is coming next.`, "info");
      return;
    }

    showToast(`${provider.label} integration is coming next.`, "info");
  };

  return (
    <div className="card p-5">
      <h3 className="mb-4 text-lg font-semibold text-clutch-text">Connected Accounts</h3>
      <div className="grid gap-3">
        {providers.map((provider) => {
          const status = statusForProvider(provider, authProviders);
          const connected = status === "Connected";

          return (
            <div key={provider.id} className="flex items-center justify-between gap-3 rounded-md border border-clutch-border bg-clutch-panelSoft p-3">
              <div className="min-w-0">
                <div className="font-semibold text-clutch-text">{provider.label}</div>
                <div className="mt-1 text-xs text-clutch-muted">{detailForProvider(provider, authProviders, status)}</div>
              </div>
              <button type="button" className={connected ? "btn-secondary py-2 text-xs" : "btn-primary py-2 text-xs"} disabled={connected} onClick={() => connect(provider)}>
                {connected ? "Connected" : provider.status === "oauth" ? "Connect" : "Soon"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConnectedAccounts;
