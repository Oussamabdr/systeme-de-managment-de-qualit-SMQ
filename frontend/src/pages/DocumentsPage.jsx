import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import api from "../api/client";
import PageHeader from "../components/ui/PageHeader";
import { getErrorMessage } from "../utils/http";
import { Card, CardHeader } from "../components/ui/Card";
import { Input, Select } from "../components/ui/Input";
import { Table } from "../components/ui/Table";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { useAuthStore } from "../store/authStore";

export default function DocumentsPage() {
  const user = useAuthStore((state) => state.user);
  const isTeamMember = user?.role === "TEAM_MEMBER";

  const [documents, setDocuments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [form, setForm] = useState({ file: null, taskId: "", processId: "" });
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [docRes, taskRes, processRes] = await Promise.all([
        api.get("/documents"),
        api.get("/tasks"),
        api.get("/processes"),
      ]);
      setDocuments(docRes.data.data);
      setTasks(taskRes.data.data);
      setProcesses(isTeamMember ? [] : processRes.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    load();
  }, [isTeamMember]);

  const upload = async (event) => {
    event.preventDefault();
    if (!form.file) return;
    if (isTeamMember && !form.taskId) {
      setError("Team members must attach a document to one assigned task.");
      return;
    }

    try {
      const body = new FormData();
      body.append("file", form.file);
      if (form.taskId) body.append("taskId", form.taskId);
      if (!isTeamMember && form.processId) body.append("processId", form.processId);

      await api.post("/documents/upload", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm({ file: null, taskId: "", processId: "" });
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Document Management" subtitle="Upload and link evidence files to tasks or processes." />

      <section className="saas-card p-5">
        <CardHeader title="Upload Document" subtitle="Attach proof files to a process or task." />
        {isTeamMember ? <p className="mt-2 text-xs text-slate-500">Team members can upload only to their assigned tasks.</p> : null}
        {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
        <form className="mt-3 grid gap-3 md:grid-cols-3" onSubmit={upload}>
          <Input type="file" onChange={(e) => setForm((p) => ({ ...p, file: e.target.files?.[0] || null }))} required />
          <Select value={form.taskId} onChange={(e) => setForm((p) => ({ ...p, taskId: e.target.value }))}>
            <option value="">{isTeamMember ? "Attach to task (required)" : "Attach to task (optional)"}</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>{task.title}</option>
            ))}
          </Select>
          {isTeamMember ? (
            <Input value="Process attachment not allowed for team members" readOnly />
          ) : (
            <Select value={form.processId} onChange={(e) => setForm((p) => ({ ...p, processId: e.target.value }))}>
              <option value="">Attach to process (optional)</option>
              {processes.map((process) => (
                <option key={process.id} value={process.id}>{process.name}</option>
              ))}
            </Select>
          )}
          <Button className="md:col-span-3">Upload</Button>
        </form>
      </section>

      <Card className="p-0 overflow-hidden">
        <div className="px-5 pt-5">
          <CardHeader title="Evidence Files" subtitle="Centralized document traceability." />
        </div>
        <Table headers={["Document", "Task", "Process", "Uploader"]}>
          {documents.map((doc) => (
            <tr key={doc.id}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 text-slate-900">
                  <FileText size={14} className="text-slate-400" />
                  {doc.name}
                </div>
              </td>
              <td className="px-4 py-3">{doc.task?.title ? <Badge tone="blue">{doc.task.title}</Badge> : "-"}</td>
              <td className="px-4 py-3">{doc.process?.name ? <Badge tone="slate">{doc.process.name}</Badge> : "-"}</td>
              <td className="px-4 py-3 text-slate-600">{doc.uploadedBy?.fullName}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
