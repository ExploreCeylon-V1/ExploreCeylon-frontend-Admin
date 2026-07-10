// Small colored pill used across admin tables for status/role/verification
// state — one look for "is this thing OK, pending, or a problem" everywhere.
const TONES = {
  green:  "bg-emerald-100 text-emerald-700",
  amber:  "bg-amber-100 text-amber-700",
  red:    "bg-red-100 text-red-600",
  slate:  "bg-slate-100 text-slate-600",
  blue:   "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
};

// Central place to map a raw backend value (booking/user status, role, etc.)
// to a tone — extend here, not per-page, when a new status value shows up.
const STATUS_TONE = {
  CONFIRMED: "green",
  COMPLETED: "green",
  ACTIVE: "green",
  VERIFIED: "green",
  PENDING_PAYMENT: "amber",
  PENDING: "amber",
  UNVERIFIED: "amber",
  CANCELLED: "red",
  INACTIVE: "red",
  ADMIN: "purple",
  TRAVELER: "blue",
};

function labelize(value) {
  if (!value) return "";
  return value
    .toString()
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export default function StatusBadge({ value, tone }) {
  const resolvedTone = tone || STATUS_TONE[value] || "slate";
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${TONES[resolvedTone]}`}>
      {labelize(value)}
    </span>
  );
}
