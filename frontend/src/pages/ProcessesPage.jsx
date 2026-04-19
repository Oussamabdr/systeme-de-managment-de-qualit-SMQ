import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import PageHeader from "../components/ui/PageHeader";
import { getErrorMessage } from "../utils/http";
import { Card, CardHeader } from "../components/ui/Card";
import { Input, TextArea } from "../components/ui/Input";
import Button from "../components/ui/Button";
import { Table } from "../components/ui/Table";
import ProjectProgress from "../components/projects/ProjectProgress";
import StatusBadge from "../components/ui/StatusBadge";

const initialForm = {
  name: "",
  description: "",
  responsiblePerson: "",
  inputs: "",
  outputs: "",
  indicators: "",
};

function parseListInput(value) {
  return value
    .split(/[;,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseIndicatorsInput(raw) {
  const value = raw.trim();
  if (!value) return [];

  if (value.startsWith("[")) {
    return JSON.parse(value);
  }

  // Support simple comma/semicolon/newline-separated KPI names for faster entry.
  return parseListInput(value).map((name) => ({
    name,
    target: 100,
    current: 0,
  }));
}

export default function ProcessesPage() {
  const [processes, setProcesses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  const loadProcesses = async () => {
    try {
      const [processRes, tasksRes] = await Promise.all([api.get("/processes"), api.get("/tasks")]);
      setProcesses(processRes.data.data);
      setTasks(tasksRes.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    loadProcesses();
  }, []);

  const totalTasks = useMemo(
    () => processes.reduce((sum, process) => sum + (process?._count?.tasks || 0), 0),
    [processes],
  );

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const payload = {
        name: form.name,
        description: form.description,
        responsiblePerson: form.responsiblePerson,
        inputs: parseListInput(form.inputs),
        outputs: parseListInput(form.outputs),
        indicators: parseIndicatorsInput(form.indicators),
      };

      await api.post("/processes", payload);
      setForm(initialForm);
      loadProcesses();
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError("Indicators format is invalid. Use JSON array or plain list like: closure rate, on-time delivery");
      } else {
        setError(getErrorMessage(err));
      }
    }
  };

  const applyProcessTemplate = (template) => {
    if (template === "procurement") {
      setForm({
        name: "Procurement Control",
        description: "Control supplier selection, purchase validation, and reception acceptance criteria.",
        responsiblePerson: "Quality Manager",
        inputs: "Purchase request, Specification, Budget",
        outputs: "Approved order, Delivery record, Acceptance report",
        indicators: "On-time delivery, Supplier conformity rate",
      });
      return;
    }

    if (template === "audit") {
      setForm({
        name: "Internal Audit Process",
        description: "Plan and execute internal audits, consolidate findings, and monitor action closure.",
        responsiblePerson: "CAQ",
        inputs: "Audit plan, Previous findings, Process documentation",
        outputs: "Audit report, Non-conformity log, CAPA requests",
        indicators: "Audit completion rate, Finding closure rate",
      });
      return;
    }

    setForm(initialForm);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Process Architecture"
        subtitle={`Governed process map with ${totalTasks} linked execution tasks.`}
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Card className="p-0 overflow-hidden">
          <div className="px-5 pt-5">
            <CardHeader title="Process Library" subtitle="Owner, workload and drill-down access." />
          </div>
          {error ? <p className="px-5 pb-4 text-sm text-rose-700">{error}</p> : null}
          <Table headers={["Name", "Responsible", "Tasks", "Progress", "Status", "Related Tasks", "Action"]}>
            {processes.map((process) => (
              <tr key={process.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{process.name}</td>
                <td className="px-4 py-3 text-slate-600">{process.responsiblePerson}</td>
                <td className="px-4 py-3 text-slate-600">{process?._count?.tasks || 0}</td>
                <td className="px-4 py-3 text-slate-600">
                  <ProjectProgress
                    progress={process.progress || 0}
                    status={process.computedStatus || "On Track"}
                    completedTasks={process.completedTasks || 0}
                    totalTasks={process.totalTasks || 0}
                  />
                </td>
                <td className="px-4 py-3 text-slate-600">
                  <StatusBadge status={process.computedStatus || "On Track"} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {tasks
                      .filter((task) => task.processId === process.id)
                      .slice(0, 3)
                      .map((task) => (
                        <span key={task.id} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                          {task.title}
                        </span>
                      ))}
                    {tasks.filter((task) => task.processId === process.id).length > 3 ? (
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                        +{tasks.filter((task) => task.processId === process.id).length - 3} more
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link className="text-sm font-medium text-emerald-700 hover:text-emerald-800" to={`/processes/${process.id}`}>
                      Open
                    </Link>
                    <Link className="text-sm font-medium text-slate-700 hover:text-slate-900" to={`/tasks?processId=${process.id}`}>
                      View tasks
                    </Link>
                    <Link className="text-sm font-medium text-slate-700 hover:text-slate-900" to={`/tasks?processId=${process.id}&quickAssign=1`}>
                      Quick assign
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card className="p-5">
          <CardHeader title="Create Process" subtitle="Add a controlled ISO process definition." />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="subtle" className="px-3 py-1.5 text-xs" onClick={() => applyProcessTemplate("procurement")}>
              Use Procurement Template
            </Button>
            <Button type="button" variant="subtle" className="px-3 py-1.5 text-xs" onClick={() => applyProcessTemplate("audit")}>
              Use Audit Template
            </Button>
            <Button type="button" variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => applyProcessTemplate("reset")}>
              Reset
            </Button>
          </div>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Indicators accept JSON array or plain list (comma, semicolon, or line-separated).
          </p>
          <form className="mt-3 space-y-3" onSubmit={onSubmit}>
            <div className="field-group">
              <label className="field-label">Process Name</label>
              <Input placeholder="e.g. Procurement Control" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="field-group">
              <label className="field-label">Responsible Person</label>
              <Input placeholder="e.g. Quality Manager" value={form.responsiblePerson} onChange={(e) => setForm((p) => ({ ...p, responsiblePerson: e.target.value }))} required />
            </div>
            <div className="field-group">
              <label className="field-label">Description</label>
              <TextArea placeholder="Describe scope, controls, and expected outcomes." value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} />
            </div>
            <div className="field-group">
              <label className="field-label">Inputs</label>
              <Input placeholder="e.g. Request, Specification, Budget" value={form.inputs} onChange={(e) => setForm((p) => ({ ...p, inputs: e.target.value }))} />
            </div>
            <div className="field-group">
              <label className="field-label">Outputs</label>
              <Input placeholder="e.g. Approved order, Delivery, Acceptance report" value={form.outputs} onChange={(e) => setForm((p) => ({ ...p, outputs: e.target.value }))} />
            </div>
            <div className="field-group">
              <label className="field-label">KPI Indicators (JSON)</label>
              <TextArea placeholder="e.g. Closure rate, On-time delivery" value={form.indicators} onChange={(e) => setForm((p) => ({ ...p, indicators: e.target.value }))} rows={4} />
              <p className="field-help">If you type plain KPI names, defaults are auto-created (target 100, current 0).</p>
            </div>
            <Button className="w-full">Save Process</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
