import { AlertTriangle } from "lucide-react";

const toneClasses = {
  "On Track": "badge-green",
  "At Risk": "badge-amber",
  Delayed: "badge-red",
  Completed: "badge-blue",
};

export default function StatusBadge({ status = "On Track" }) {
  const isAtRisk = status === "At Risk";

  return (
    <span className={`badge inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${toneClasses[status] || toneClasses["On Track"]}`}>
      {isAtRisk ? <AlertTriangle size={12} /> : null}
      <span>{status}</span>
    </span>
  );
}
