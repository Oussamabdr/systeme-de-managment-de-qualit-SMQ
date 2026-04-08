export default function ProgressBar({ value = 0, tone = "emerald", className = "", heightClass = "h-2.5" }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));

  const tones = {
    emerald: "from-emerald-500 to-emerald-400",
    amber: "from-amber-500 to-amber-400",
    rose: "from-rose-500 to-rose-400",
    sky: "from-sky-500 to-sky-400",
  };

  return (
    <div className={`w-full overflow-hidden rounded-full bg-slate-100 ${heightClass} ${className}`}>
      <div
        className={`h-full rounded-full bg-linear-to-r ${tones[tone] || tones.emerald} transition-all duration-300`}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
