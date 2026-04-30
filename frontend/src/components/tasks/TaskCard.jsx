import { format } from "date-fns";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import Badge from "../ui/Badge";
import EditableField from "./EditableField";
import InlineSelect from "./InlineSelect";
import DatePicker from "./DatePicker";
import TaskStatusDropdown from "./TaskStatusDropdown";
import { t } from "../../utils/i18n";

export default function TaskCard({
  task,
  processes,
  users,
  language,
  canManageAssignment,
  canEditStatus,
  onStatusChange,
  onInlineChange,
}) {
  const text = (fr, en) => t(language, fr, en);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task:${task.id}`,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.65 : 1,
  };

  const isDelayed = task.dueDate && task.status !== "DONE" && new Date(task.dueDate) < new Date();

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`rounded-xl border bg-white p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${isDelayed ? "border-rose-300 bg-rose-50/40" : "border-slate-200/80"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-slate-900">{task.title}</p>
          {task.description ? <p className="mt-1 text-xs text-slate-500">{task.description}</p> : null}
        </div>
        <Badge tone={task.status === "DONE" ? "green" : task.status === "IN_PROGRESS" ? "blue" : "amber"}>
          {task.status.replaceAll("_", " ")}
        </Badge>
      </div>

      <div className="mt-3 space-y-3">
        <EditableField label={text("Processus", "Process")}>
          {canManageAssignment ? (
            <InlineSelect value={task.processId || ""} onChange={(event) => onInlineChange(task.id, { processId: event.target.value })}>
              {processes.map((process) => (
                <option key={process.id} value={process.id}>{process.name}</option>
              ))}
            </InlineSelect>
          ) : (
            <p className="text-sm text-slate-700">{task.process?.name || "N/A"}</p>
          )}
        </EditableField>

        <EditableField label={text("Responsable", "Assignee")}>
          {canManageAssignment ? (
            <InlineSelect value={task.assigneeId || ""} onChange={(event) => onInlineChange(task.id, { assigneeId: event.target.value || null })}>
              <option value="">{text("Non affecte", "Unassigned")}</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.fullName}</option>
              ))}
            </InlineSelect>
          ) : (
            <p className="text-sm text-slate-700">{task.assignee?.fullName || text("Non affecte", "Unassigned")}</p>
          )}
        </EditableField>

        <EditableField label={text("Date limite", "Deadline")}>
          {canManageAssignment ? (
            <DatePicker
              value={task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : ""}
              onChange={(event) => onInlineChange(task.id, { dueDate: event.target.value || null })}
            />
          ) : (
            <p className="text-sm text-slate-700">{task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : text("Pas de date limite", "No deadline")}</p>
          )}
        </EditableField>
      </div>

      {canEditStatus ? (
        <div className="mt-3">
          <TaskStatusDropdown value={task.status} onChange={(status) => onStatusChange(task.id, status)} />
        </div>
      ) : null}
    </article>
  );
}
