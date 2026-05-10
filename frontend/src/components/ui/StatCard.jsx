export default function StatCard({ title, value, hint, tone = "slate" }) {
  const tones = {
    teal: "stat-teal",
    amber: "stat-amber",
    red: "stat-red",
    slate: "stat-slate",
  };

  return (
    <div className={`saas-card p-5 ${tones[tone] || tones.slate}`}>
      <p className="text-[11px] uppercase tracking-[0.16em] opacity-70">{title}</p>
      <p className="mt-2 text-3xl font-semibold leading-none">{value}</p>
      {hint ? <p className="mt-2 text-sm text-slate-500">{hint}</p> : null}
    </div>
  );
}
