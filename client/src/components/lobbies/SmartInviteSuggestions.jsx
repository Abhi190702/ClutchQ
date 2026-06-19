import Badge from "../common/Badge";

const SmartInviteSuggestions = ({ chemistry }) => (
  <div className="card p-5">
    <h3 className="text-lg font-semibold">Invite suggestions</h3>
    <p className="mt-2 text-sm text-clutch-muted">
      Invite a player who fills {chemistry?.roleBalance?.missing?.[0] || "the highest-impact role"} and improves availability overlap.
    </p>
    <div className="mt-4 flex flex-wrap gap-2">
      {chemistry?.commonLanguages?.map((language) => <Badge key={language}>Language: {language}</Badge>)}
      {chemistry?.warnings?.map((warning) => <Badge key={warning} tone="border-clutch-amber/40 bg-clutch-amber/10 text-amber-100">{warning}</Badge>)}
    </div>
  </div>
);

export default SmartInviteSuggestions;
