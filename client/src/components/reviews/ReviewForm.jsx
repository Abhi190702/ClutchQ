import { useState } from "react";
import api, { getErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const fields = ["communication", "teamwork", "skill", "punctuality", "behavior"];

const ReviewForm = ({ players = [], onCreated }) => {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    reviewedUserId: "",
    communication: 5,
    teamwork: 5,
    skill: 4,
    punctuality: 5,
    behavior: 5,
    comment: ""
  });

  const submit = async (event) => {
    event.preventDefault();
    if (!form.reviewedUserId) {
      showToast("Select a teammate before submitting a review.", "error");
      return;
    }

    setSaving(true);
    try {
      const response = await api.post("/reviews", { ...form, comment: form.comment.trim() });
      showToast("Review submitted");
      onCreated?.(response.data.data.review);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <h3 className="text-lg font-semibold">Review completed teammate</h3>
      <label>
        <span className="form-label">Player</span>
        <select className="form-input" required value={form.reviewedUserId} onChange={(event) => setForm({ ...form, reviewedUserId: event.target.value })}>
          <option value="">Select player</option>
          {players.map((player) => <option key={player.userId?._id || player.userId} value={player.userId?._id || player.userId}>{player.displayName}</option>)}
        </select>
      </label>
      <div className="grid gap-4 md:grid-cols-5">
        {fields.map((field) => (
          <label key={field}>
            <span className="form-label capitalize">{field}</span>
            <input className="form-input" type="number" min="1" max="5" value={form[field]} onChange={(event) => setForm({ ...form, [field]: Math.max(1, Math.min(5, Number(event.target.value) || 1)) })} />
          </label>
        ))}
      </div>
      <label>
        <span className="form-label">Comment</span>
        <textarea className="form-input min-h-24" maxLength="500" placeholder="Optional: what made this teammate good to queue with?" value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} />
      </label>
      <button className="btn-primary" type="submit" disabled={saving}>{saving ? "Submitting..." : "Submit review"}</button>
    </form>
  );
};

export default ReviewForm;
