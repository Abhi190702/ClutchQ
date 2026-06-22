const toneClasses = {
  default: "bg-white/[0.035]",
  soft: "bg-white/[0.025]",
  transparent: "bg-transparent"
};

const Surface = ({ as: Component = "section", tone = "default", divided = false, className = "", children }) => (
  <Component
    className={`${toneClasses[tone] || toneClasses.default} ${divided ? "border-y border-white/10" : ""} ${className}`}
  >
    {children}
  </Component>
);

export default Surface;
