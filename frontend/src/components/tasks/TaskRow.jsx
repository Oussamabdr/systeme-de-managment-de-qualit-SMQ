import { format } from "date-fns";
import Badge from "../ui/Badge";
import EditableField from "./EditableField";
import InlineSelect from "./InlineSelect";
import DatePicker from "./DatePicker";
import TaskStatusDropdown from "./TaskStatusDropdown";
import { t } from "../../utils/i18n";

export default function TaskRow({ task, processes, users, language, canManageAssignment, canEditStatus, onInlineChange, onStatusChange }) {
  const text = (fr, en) => t(language, fr, en);
  const isDelayed = task.dueDate && task.status !== "DONE" && new Date(task.dueDate) < new Date();

  return (
    <tr className={`border-t align-top transition-colors duration-200 hover:bg-slate-50/60 ${isDelayed ? "border-rose-200 bg-rose-50/30" : "border-slate-200/80"}`}>
      <td className="px-4 py-3">
        <p className="font-medium text-slate-900">{task.title}</p>
        {task.description ? <p className="mt-1 text-xs text-slate-500">{task.description}</p> : null}
      </td>
      <td className="px-4 py-3">
        {canEditStatus ? (
          <TaskStatusDropdown value={task.status} onChange={(status) => onStatusChange(task.id, status)} />
        ) : (
          <Badge tone={task.status === "DONE" ? "green" : task.status === "IN_PROGRESS" ? "blue" : "amber"}>
            {task.status.replaceAll("_", " ")}
          </Badge>
        )}
      </td>
      <td className="px-4 py-3 min-w-44">
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
      </td>
      <td className="px-4 py-3 min-w-44">
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
      </td>
      <td className="px-4 py-3 min-w-40">
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
      </td>
    </tr>
  );
}
