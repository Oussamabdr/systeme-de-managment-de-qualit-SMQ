import ProgressBar from "../ui/ProgressBar";
import StatusBadge from "../ui/StatusBadge";

const toneByStatus = {
  "On Track": "emerald",
  "At Risk": "amber",
  Delayed: "rose",
  Completed: "sky",
};

export default function ProjectProgress({ progress = 0, status = "On Track", completedTasks, totalTasks }) {
  const safeProgress = Math.max(0, Math.min(100, Number(progress) || 0));

  return (
    <div className="flex items-center gap-3" title={`${safeProgress}% - ${status}`}>
      <div className="w-40">
        <ProgressBar value={safeProgress} tone={toneByStatus[status] || "emerald"} />
      </div>
      <span className="text-xs font-medium text-slate-600">{safeProgress}%</span>
      <StatusBadge status={status} />
      {typeof completedTasks === "number" && typeof totalTasks === "number" ? (
        <span className="text-[11px] text-slate-500">{completedTasks}/{totalTasks}</span>
      ) : null}
    </div>
  );
}
