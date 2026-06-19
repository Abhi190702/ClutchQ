import { shortDateTime } from "../../utils/formatters";

const ReviewCard = ({ review }) => {
  const average = Math.round(((review.communication + review.teamwork + review.skill + review.punctuality + review.behavior) / 5) * 10) / 10;

  return (
    <div className="rounded-lg border border-clutch-border bg-clutch-panelSoft p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="font-semibold text-clutch-text">{review.reviewerId?.name || "Teammate"}</div>
        <div className="rounded-full border border-clutch-green/40 bg-clutch-green/10 px-2 py-1 text-xs font-semibold text-green-200">{average}/5</div>
      </div>
      <p className="mt-3 text-sm leading-6 text-clutch-muted">{review.comment}</p>
      <div className="mt-3 text-xs text-clutch-muted">{shortDateTime(review.createdAt)}</div>
    </div>
  );
};

export default ReviewCard;
