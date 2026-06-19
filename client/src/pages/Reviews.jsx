import { useEffect, useState } from "react";
import PageShell from "../components/common/PageShell";
import EmptyState from "../components/common/EmptyState";
import ReviewCard from "../components/reviews/ReviewCard";
import ReviewForm from "../components/reviews/ReviewForm";
import { useToast } from "../context/ToastContext";
import api, { getErrorMessage } from "../services/api";

const Reviews = () => {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [reviewResponse, profileResponse] = await Promise.all([api.get("/reviews"), api.get("/profiles")]);
        setReviews(reviewResponse.data.data);
        setPlayers(profileResponse.data.data);
      } catch (error) {
        showToast(getErrorMessage(error), "error");
      }
    };
    load();
  }, []);

  return (
    <PageShell title="Reviews" eyebrow="Trust builder">
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <ReviewForm players={players} onCreated={(review) => setReviews((current) => [review, ...current])} />
        <div className="space-y-3">
          {reviews.length ? reviews.map((review) => <ReviewCard key={review._id} review={review} />) : <EmptyState title="No reviews yet." description="Review completed teammates to improve trust scores and badges." />}
        </div>
      </div>
    </PageShell>
  );
};

export default Reviews;
