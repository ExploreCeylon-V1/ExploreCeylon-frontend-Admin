export default function EmptyState({ icon = "📭", title = "Nothing here yet", subtitle }) {
  return (
    <div className="p-12 text-center text-slate-400">
      <p className="text-3xl mb-2">{icon}</p>
      <p className="font-medium text-slate-500">{title}</p>
      {subtitle && <p className="text-sm mt-1">{subtitle}</p>}
    </div>
  );
}
