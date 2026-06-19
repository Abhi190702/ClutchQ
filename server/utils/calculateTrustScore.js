const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const average = (values) => {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return 0;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
};

export const summarizeReviewRatings = (reviews = []) => {
  const fields = ["communication", "teamwork", "skill", "punctuality", "behavior"];
  return fields.reduce((summary, field) => {
    summary[field] = Number(average(reviews.map((review) => Number(review[field]))).toFixed(1));
    return summary;
  }, {});
};

export const calculateTrustScore = ({ profile, reviews = [], validReports = 0 } = {}) => {
  const ratingSummary = summarizeReviewRatings(reviews);
  const reviewAverage = average(Object.values(ratingSummary));
  const baseTrust = reviews.length ? reviewAverage * 20 : profile?.trustScore || 70;
  const reliabilityBonus = (profile?.reliabilityScore || 80) * 0.2;
  const noShowPenalty = (profile?.noShows || 0) * 3;
  const reportPenalty = validReports * 5;
  const completedBoost = Math.min((profile?.completedSessions || 0) * 0.4, 8);
  const finalScore = clamp(Math.round(baseTrust + reliabilityBonus + completedBoost - noShowPenalty - reportPenalty));

  return {
    trustScore: finalScore,
    ratingSummary,
    inputs: {
      reviewAverage: Number(reviewAverage.toFixed(2)),
      reliabilityBonus,
      noShowPenalty,
      reportPenalty,
      completedBoost
    }
  };
};

export default calculateTrustScore;
