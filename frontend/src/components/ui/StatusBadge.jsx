import { AlertTriangle } from "lucide-react";

const toneClasses = {
  "On Track": "bg-emerald-100 text-emerald-700",
  "At Risk": "bg-amber-100 text-amber-700",
  Delayed: "bg-rose-100 text-rose-700",
  Completed: "bg-sky-100 text-sky-700",
};

export default function StatusBadge({ status = "On Track" }) {
  const isAtRisk = status === "At Risk";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${toneClasses[status] || toneClasses["On Track"]}`}>
      {isAtRisk ? <AlertTriangle size={12} /> : null}
      <span>{status}</span>
    </span>
  );
}
