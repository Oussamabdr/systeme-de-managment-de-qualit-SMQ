import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/client";
import { getErrorMessage } from "../utils/http";
import BpmnModeler from "../components/BpmnModeler";
import Button from "../components/ui/Button";

export default function BpmnModelerPage() {
  const { processId } = useParams();
  const navigate = useNavigate();
  const [process, setProcess] = useState(null);
  const [bpmnXml, setBpmnXml] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const { data: processData } = await api.get(`/processes/${processId}`);
        if (!mounted) return;
        setProcess(processData.data);

        const { data: bpmnData } = await api.get(`/processes/${processId}/bpmn`);
        if (!mounted) return;
        setBpmnXml(bpmnData.data);
      } catch (err) {
        if (!mounted) return;
        setError(getErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [processId]);

  const handleSave = useCallback(async (xml) => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await api.put(`/processes/${processId}/bpmn`, { xml });
      setSuccess("Diagram saved successfully.");
      setBpmnXml(xml);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }, [processId]);

  if (loading) return <div className="saas-card p-6">Loading BPMN editor...</div>;
  if (error && !process) return <div className="saas-card p-6 text-rose-700">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link to={`/processes/${processId}`} className="text-sm text-slate-500 hover:text-slate-700 underline mb-1 inline-block">
            &larr; Back to process
          </Link>
          <h1 className="text-xl font-semibold text-slate-900">
            BPMN Editor - {process?.name || "Process"}
          </h1>
        </div>
        <Button variant="subtle" onClick={() => navigate(`/processes/${processId}`)}>
          Close Editor
        </Button>
      </div>

      {error && <p className="text-sm text-rose-700">{error}</p>}
      {success && <p className="text-sm text-emerald-700">{success}</p>}
      {saving && <p className="text-sm text-slate-500">Saving...</p>}

      {bpmnXml ? (
        <BpmnModeler xml={bpmnXml} onSave={handleSave} height="650px" />
      ) : (
        <p className="text-sm text-slate-500">No BPMN diagram data available.</p>
      )}
    </div>
  );
}
