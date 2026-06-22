const ratingFields = [
  ["communication", "Communication"],
  ["teamwork", "Teamwork"],
  ["reliability", "Reliability"],
  ["skill", "Skill"],
  ["behavior", "Behavior"]
];

const TeammateFeedbackForm = ({ teammates = [], value, onChange }) => {
  const update = (patch) => onChange?.({ ...value, ...patch });
  const ratings = value.ratings || {};

  return (
    <div className="rounded-[10px] border border-white/10 bg-white/[0.025] p-4">
      <div className="text-sm font-black text-white">Teammate feedback</div>
      <p className="mt-1 text-sm text-zinc-400">Optional. Helps the graph understand squad fit and reliability.</p>

      {teammates.length ? (
        <div className="mt-4 grid gap-3">
          <label>
            <span className="form-label">Teammate</span>
            <select className="form-input" value={value.toUserId || ""} onChange={(event) => update({ toUserId: event.target.value })}>
              <option value="">Skip teammate feedback</option>
              {teammates.map((teammate) => (
                <option key={teammate.userId || teammate.id} value={teammate.userId || teammate.id}>
                  {teammate.name}
                </option>
              ))}
            </select>
          </label>
          {value.toUserId ? (
            <>
              <div className="grid gap-3 sm:grid-cols-5">
                {ratingFields.map(([key, label]) => (
                  <label key={key}>
                    <span className="form-label">{label}</span>
                    <input
                      className="form-input"
                      type="number"
                      min="1"
                      max="5"
                      value={ratings[key] || 4}
                      onChange={(event) => update({ ratings: { ...ratings, [key]: Number(event.target.value) } })}
                    />
                  </label>
                ))}
              </div>
              <label>
                <span className="form-label">Would play again?</span>
                <select className="form-input" value={value.wouldPlayAgain || "yes"} onChange={(event) => update({ wouldPlayAgain: event.target.value })}>
                  <option value="yes">Yes</option>
                  <option value="maybe">Maybe</option>
                  <option value="no">No</option>
                </select>
              </label>
              <label>
                <span className="form-label">Comment</span>
                <textarea className="form-input min-h-20" maxLength={500} value={value.comment || ""} onChange={(event) => update({ comment: event.target.value })} />
              </label>
            </>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 rounded-md border border-white/10 bg-black/10 p-3 text-sm text-zinc-400">
          No teammate candidates yet. You can skip this step.
        </div>
      )}
    </div>
  );
};

export default TeammateFeedbackForm;
