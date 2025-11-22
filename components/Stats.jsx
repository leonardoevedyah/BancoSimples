export default function Stats({ items = [] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        >
          <p className="text-sm text-slate-600">{item.label}</p>
          <p className="text-2xl font-bold text-blue-700">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
