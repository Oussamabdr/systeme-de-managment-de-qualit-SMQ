import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import api from "../api/client";
import PageHeader from "../components/ui/PageHeader";
import { useUiStore } from "../store/uiStore";
import { t } from "../utils/i18n";
import { getErrorMessage } from "../utils/http";
import { Card, CardHeader } from "../components/ui/Card";
import { Input, Select } from "../components/ui/Input";
import { Table } from "../components/ui/Table";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { useAuthStore } from "../store/authStore";

export default function DocumentsPage() {
  const user = useAuthStore((state) => state.user);
  const language = useUiStore((state) => state.language);
  const isTeamMember = user?.role === "TEAM_MEMBER";

  const text = (fr, en) => t(language, fr, en);

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
      setError(text("Les membres de l'equipe doivent joindre un document a une tache assignee.", "Team members must attach a document to one assigned task."));
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
      <PageHeader title={text("Coffre-fort des preuves et registres", "Evidence and Records Hub")} subtitle={text("Controlez, stockez et tracez les preuves de qualite entre les taches et les processus.", "Control, store, and trace quality evidence across tasks and processes.")} />

      <section className="saas-card p-5">
        <CardHeader title={text("Telecharger un document", "Upload Document")} subtitle={text("Joindre les fichiers de preuve a un processus ou a une tache.", "Attach proof files to a process or task.")} />
        {isTeamMember ? <p className="mt-2 text-xs text-slate-500">{text("Les membres de l'equipe ne peuvent telecharger que vers leurs taches assignees.", "Team members can upload only to their assigned tasks.")}</p> : null}
        {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
        <form className="mt-3 grid gap-3 md:grid-cols-3" onSubmit={upload}>
          <div className="field-group">
            <label className="field-label">{text("Fichier de preuve", "Evidence File")}</label>
            <Input type="file" onChange={(e) => setForm((p) => ({ ...p, file: e.target.files?.[0] || null }))} required />
            <p className="field-help">{text("Telecharger les preuves objectives (PDF, image ou document bureau).", "Upload objective evidence (PDF, image, or office document).")}</p>
          </div>
          <div className="field-group">
            <label className="field-label">{text("Tache liee", "Linked Task")}</label>
            <Select value={form.taskId} onChange={(e) => setForm((p) => ({ ...p, taskId: e.target.value }))}>
              <option value="">{isTeamMember ? text("Selectionner la tache assignee (obligatoire)", "Select assigned task (required)") : text("Selectionner une tache (facultatif)", "Select task (optional)")}</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>{task.title}</option>
              ))}
            </Select>
          </div>
          {isTeamMember ? (
            <div className="field-group">
              <label className="field-label">{text("Processus lie", "Linked Process")}</label>
              <Input value={text("Piece jointe du processus non autorisee pour les membres de l'equipe", "Process attachment not allowed for team members")} readOnly />
            </div>
          ) : (
            <div className="field-group">
              <label className="field-label">{text("Processus lie", "Linked Process")}</label>
              <Select value={form.processId} onChange={(e) => setForm((p) => ({ ...p, processId: e.target.value }))}>
                <option value="">{text("Selectionner un processus (facultatif)", "Select process (optional)")}</option>
                {processes.map((process) => (
                  <option key={process.id} value={process.id}>{process.name}</option>
                ))}
              </Select>
            </div>
          )}
          <Button className="md:col-span-3">{text("Telecharger", "Upload")}</Button>
        </form>
      </section>

      <Card className="p-0 overflow-hidden">
        <div className="px-5 pt-5">
          <CardHeader title={text("Fichiers de preuve", "Evidence Files")} subtitle={text("Tracabilite centralisee des documents.", "Centralized document traceability.")} />
        </div>
        <Table headers={[text("Document", "Document"), text("Tache", "Task"), text("Processus", "Process"), text("Telecharge par", "Uploader")]}>
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
