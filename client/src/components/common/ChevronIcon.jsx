const rotations = {
  right: "rotate-0",
  down: "rotate-90",
  left: "rotate-180",
  up: "-rotate-90"
};

const ChevronIcon = ({ direction = "right", size = 18, className = "" }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`${rotations[direction] || rotations.right} ${className}`}
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M9 5l7 7-7 7" />
  </svg>
);

export default ChevronIcon;
