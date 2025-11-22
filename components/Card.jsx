export default function Card({ title, children, actions }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        {title && <h3 className="text-lg font-semibold">{title}</h3>}
        {actions}
      </div>
      <div className="space-y-2 text-sm text-slate-700">{children}</div>
    </div>
  );
}
