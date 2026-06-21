import { Link } from "react-router-dom";
import ProfileAvatarUploader from "./ProfileAvatarUploader";

const SettingRow = ({ title, description, action }) => (
  <div className="flex flex-col gap-3 border-b border-white/10 py-5 last:border-b-0 md:flex-row md:items-center md:justify-between">
    <div>
      <h3 className="font-black text-clutch-text">{title}</h3>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-clutch-muted">{description}</p>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

const ProfileSettingsPanel = ({ bundle, onAvatarUpload, onAvatarRemove }) => {
  const { user, profile, steamSummary } = bundle;

  return (
    <section className="border-b border-white/10 py-8 md:py-10">
      <div className="grid gap-7 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div>
          <div className="eyebrow">Settings</div>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-clutch-text md:text-4xl">Profile controls</h2>
          <p className="mt-3 text-base leading-7 text-clutch-muted">
            Keep high-friction controls here so the public profile stays clean.
          </p>
          <div className="mt-6">
            <ProfileAvatarUploader
              user={user}
              profile={profile}
              steamSummary={steamSummary}
              onUpload={onAvatarUpload}
              onRemove={onAvatarRemove}
            />
          </div>
        </div>

        <div className="px-0 lg:px-4">
          <SettingRow
            title="Identity and matchmaking basics"
            description="Edit display name, bio, region, main game, roles, availability, and mic status from the onboarding editor."
            action={<Link to="/onboarding" className="btn-primary">Edit profile</Link>}
          />
          <SettingRow
            title="Profile visibility"
            description="Your public profile uses only ClutchQ identity data and synced platform summaries. API keys and auth secrets stay on the backend."
            action={<span className="rounded-full border border-clutch-green/30 bg-clutch-green/10 px-3 py-1.5 text-xs font-bold text-emerald-200">Safe</span>}
          />
          <SettingRow
            title="Steam privacy"
            description="If the library looks empty, set Steam Profile and Game Details to Public, then return to the Steam tab and sync again."
            action={steamSummary?.profileUrl ? <a href={steamSummary.profileUrl} target="_blank" rel="noreferrer" className="btn-secondary">Open Steam</a> : null}
          />
        </div>
      </div>
    </section>
  );
};

export default ProfileSettingsPanel;
