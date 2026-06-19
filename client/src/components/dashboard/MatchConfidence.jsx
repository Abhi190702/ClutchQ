const tone = {
  High: "border-clutch-green/40 bg-clutch-green/10 text-green-200",
  Medium: "border-clutch-cyan/40 bg-clutch-cyan/10 text-cyan-100",
  Low: "border-clutch-amber/40 bg-clutch-amber/10 text-amber-100"
};

const MatchConfidence = ({ confidence }) => (
  <div className={`rounded-lg border px-3 py-2 text-xs font-bold ${tone[confidence?.level] || tone.Medium}`}>
    {confidence?.level || "Medium"} Confidence
  </div>
);

export default MatchConfidence;
