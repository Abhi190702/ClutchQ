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

export const calculateTrustScore = ({ profile, reviews = [], reviewCount = reviews.length, ratingSummary: suppliedRatingSummary, validReports = 0 } = {}) => {
  const ratingSummary = suppliedRatingSummary || summarizeReviewRatings(reviews);
  const reviewAverage = average(Object.values(ratingSummary));
  const reviewEvidence = Math.min(1, reviewCount / 5);
  const reviewSignal = reviewCount ? reviewAverage * 20 : 70;
  const blendedReviewSignal = 70 * (1 - reviewEvidence) + reviewSignal * reviewEvidence;
  const reliabilityScore = Number.isFinite(Number(profile?.reliabilityScore)) ? Number(profile.reliabilityScore) : 70;
  const baseTrust = blendedReviewSignal * 0.7 + reliabilityScore * 0.3;
  const noShowPenalty = (profile?.noShows || 0) * 3;
  const reportPenalty = validReports * 5;
  const completedBoost = Math.min((profile?.completedSessions || 0) * 0.3, 6);
  const finalScore = clamp(Math.round(baseTrust + completedBoost - noShowPenalty - reportPenalty));

  return {
    trustScore: finalScore,
    ratingSummary,
    inputs: {
      reviewAverage: Number(reviewAverage.toFixed(2)),
      reviewEvidence: Number(reviewEvidence.toFixed(2)),
      reliabilityScore,
      noShowPenalty,
      reportPenalty,
      completedBoost
    }
  };
};

export default calculateTrustScore;
