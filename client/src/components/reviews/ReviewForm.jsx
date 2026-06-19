import { useState } from "react";
import api, { getErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const fields = ["communication", "teamwork", "skill", "punctuality", "behavior"];

const ReviewForm = ({ players = [], onCreated }) => {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    reviewedUserId: "",
    communication: 5,
    teamwork: 5,
    skill: 4,
    punctuality: 5,
    behavior: 5,
    comment: "Good comms, role clarity, and reliable queue timing."
  });

  const submit = async (event) => {
    event.preventDefault();
    try {
      const response = await api.post("/reviews", form);
      showToast("Review submitted");
      onCreated?.(response.data.data.review);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <h3 className="text-lg font-black">Review completed teammate</h3>
      <label>
        <span className="form-label">Player</span>
        <select className="form-input" value={form.reviewedUserId} onChange={(event) => setForm({ ...form, reviewedUserId: event.target.value })}>
          <option value="">Select player</option>
          {players.map((player) => <option key={player.userId?._id || player.userId} value={player.userId?._id || player.userId}>{player.displayName}</option>)}
        </select>
      </label>
      <div className="grid gap-4 md:grid-cols-5">
        {fields.map((field) => (
          <label key={field}>
            <span className="form-label capitalize">{field}</span>
            <input className="form-input" type="number" min="1" max="5" value={form[field]} onChange={(event) => setForm({ ...form, [field]: Number(event.target.value) })} />
          </label>
        ))}
      </div>
      <label>
        <span className="form-label">Comment</span>
        <textarea className="form-input min-h-24" value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} />
      </label>
      <button className="btn-primary" type="submit">Submit review</button>
    </form>
  );
};

export default ReviewForm;
