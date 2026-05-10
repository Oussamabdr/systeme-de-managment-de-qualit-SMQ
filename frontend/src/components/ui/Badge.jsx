export default function Badge({ tone = "slate", children }) {
  const tones = {
    slate: "badge-slate",
    green: "badge-green",
    amber: "badge-amber",
    red: "badge-red",
    blue: "badge-blue",
  };

  return (
    <span className={`badge inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone] || tones.slate}`}>
      {children}
    </span>
  );
}
