// Compact stat tile for dense dashboard grids — distinct from the larger
// hero cards used for the 4 headline metrics, so a 12-card stat grid
// doesn't read as 12 equally-loud hero cards.
export default function StatTile({ icon, label, value, loading }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
      <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400">
        <span className="text-sm sm:text-base shrink-0">{icon}</span>
        <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wide leading-tight line-clamp-2">{label}</span>
      </div>
      <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-semibold text-slate-950">{loading ? "…" : value}</p>
    </div>
  );
}
