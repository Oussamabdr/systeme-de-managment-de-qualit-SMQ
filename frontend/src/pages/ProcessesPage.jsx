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
        inputs: form.inputs.split(",").map((v) => v.trim()).filter(Boolean),
        outputs: form.outputs.split(",").map((v) => v.trim()).filter(Boolean),
        indicators: form.indicators
          ? JSON.parse(form.indicators)
          : [],
      };

      await api.post("/processes", payload);
      setForm(initialForm);
      loadProcesses();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Processes"
        subtitle={`Structured process map with ${totalTasks} linked tasks.`}
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
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Indicators field expects JSON array, e.g. <code>{'[{"name":"Closure rate","target":95,"current":80}]'}</code>
          </p>
          <form className="mt-3 space-y-3" onSubmit={onSubmit}>
            <Input placeholder="Process name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            <Input placeholder="Responsible person" value={form.responsiblePerson} onChange={(e) => setForm((p) => ({ ...p, responsiblePerson: e.target.value }))} required />
            <TextArea placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} />
            <Input placeholder="Inputs (comma separated)" value={form.inputs} onChange={(e) => setForm((p) => ({ ...p, inputs: e.target.value }))} />
            <Input placeholder="Outputs (comma separated)" value={form.outputs} onChange={(e) => setForm((p) => ({ ...p, outputs: e.target.value }))} />
            <TextArea placeholder="Indicators JSON" value={form.indicators} onChange={(e) => setForm((p) => ({ ...p, indicators: e.target.value }))} rows={4} />
            <Button className="w-full">Save Process</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
