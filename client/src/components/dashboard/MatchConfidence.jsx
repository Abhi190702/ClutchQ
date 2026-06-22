const tone = {
  High: "bg-clutch-green/10 text-green-200",
  Medium: "bg-clutch-cyan/10 text-cyan-100",
  Low: "bg-clutch-amber/10 text-amber-100"
};

const MatchConfidence = ({ confidence }) => (
  <div className={`rounded-full px-3 py-1 text-xs font-bold ${tone[confidence?.level] || tone.Medium}`}>
    {confidence?.level || "Medium"} Confidence
  </div>
);

export default MatchConfidence;
