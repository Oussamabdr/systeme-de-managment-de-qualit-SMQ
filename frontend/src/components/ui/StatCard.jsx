export default function StatCard({ title, value, hint, tone = "slate" }) {
  const tones = {
    teal: "bg-emerald-50 text-emerald-800",
    amber: "bg-amber-50 text-amber-800",
    red: "bg-rose-50 text-rose-800",
    slate: "bg-white text-slate-900",
  };

  return (
    <div className={`saas-card p-5 ${tones[tone] || tones.slate}`}>
      <p className="text-[11px] uppercase tracking-[0.16em] opacity-70">{title}</p>
      <p className="mt-2 text-3xl font-semibold leading-none">{value}</p>
      {hint ? <p className="mt-2 text-sm text-slate-500">{hint}</p> : null}
    </div>
  );
}
