import { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
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
  const canUpload = user?.role !== "AUDITEUR_EXTERNE";

  const text = (fr, en) => t(language, fr, en);

  const [documents, setDocuments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [form, setForm] = useState({ file: null, taskId: "", processId: "" });
  const [error, setError] = useState("");

  const handleDownload = async (doc) => {
    try {
      const token = localStorage.getItem("qms_token");
      const response = await fetch(`/api/documents/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

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
      <PageHeader title={text("Documents qualite", "Quality documents")} subtitle={text("Documents rattaches aux taches et aux processus.", "Documents linked to tasks and processes.")} />

      {canUpload ? (
      <section className="saas-card p-5">
        <CardHeader title={text("Ajouter un document", "Add document")} subtitle={text("Joindre un fichier a une tache ou a un processus.", "Attach a file to a task or process.")} />
        {isTeamMember ? <p className="mt-2 text-xs text-slate-500">{text("Les membres de l'equipe ne peuvent telecharger que vers leurs taches assignees.", "Team members can upload only to their assigned tasks.")}</p> : null}
        {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
        <form className="mt-3 grid gap-3 md:grid-cols-3" onSubmit={upload}>
          <div className="field-group">
            <label className="field-label">{text("Fichier", "File")}</label>
            <Input type="file" onChange={(e) => setForm((p) => ({ ...p, file: e.target.files?.[0] || null }))} required />
            <p className="field-help">{text("PDF, image ou document bureautique.", "PDF, image, or office document.")}</p>
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
      ) : null}

      <Card className="p-0 overflow-hidden">
        <div className="px-5 pt-5">
          <CardHeader title={text("Documents", "Documents")} subtitle={text("Liste des fichiers enregistres.", "List of uploaded files.")} />
        </div>
        <Table headers={[text("Document", "Document"), text("Tache", "Task"), text("Processus", "Process"), text("Telecharge par", "Uploader"), ""]}>
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
              <td className="px-4 py-3">
                <button
                  onClick={() => handleDownload(doc)}
                  className="saas-btn saas-btn-subtle inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
                >
                  <Download size={12} />
                  {text("Telecharger", "Download")}
                </button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
