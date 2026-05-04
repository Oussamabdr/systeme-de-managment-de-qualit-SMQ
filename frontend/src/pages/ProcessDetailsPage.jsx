import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/client";
import PageHeader from "../components/ui/PageHeader";
import { getErrorMessage } from "../utils/http";
import { Card, CardHeader } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { Table } from "../components/ui/Table";
import { Input, Select, TextArea } from "../components/ui/Input";
import Button from "../components/ui/Button";
import { useAuthStore } from "../store/authStore";

const VERACITY_OPTIONS = [
  { value: "FALSE", label: "Faux" },
  { value: "RATHER_FALSE", label: "Plutôt faux" },
  { value: "RATHER_TRUE", label: "Plutôt vrai" },
  { value: "TRUE", label: "Vrai" },
];

export default function ProcessDetailsPage() {
  const { processId } = useParams();
  const user = useAuthStore((state) => state.user);
  const canEditAssessment = user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER";
  const [state, setState] = useState({ loading: true, data: null, error: "" });
  const [assessment, setAssessment] = useState([]);
  const [assessmentMeta, setAssessmentMeta] = useState({ loading: true, saving: false, error: "", success: "", summary: null });

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [{ data: processData }, { data: assessmentData }] = await Promise.all([
          api.get(`/processes/${processId}`),
          api.get(`/processes/${processId}/assessment`),
        ]);
        if (!mounted) return;
        setState({ loading: false, data: processData.data, error: "" });
        setAssessment(assessmentData.data.requirements || []);
        setAssessmentMeta({
          loading: false,
          saving: false,
          error: "",
          success: "",
          summary: assessmentData.data.summary || null,
        });
      } catch (error) {
        if (!mounted) return;
        setState({ loading: false, data: null, error: getErrorMessage(error) });
        setAssessmentMeta((prev) => ({ ...prev, loading: false, error: getErrorMessage(error) }));
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [processId]);

  const assessmentSummary = useMemo(() => {
    if (!assessment.length) return { overallScore: 0, completedCount: 0, requirementCount: 0 };
    const totalScore = assessment.reduce((sum, item) => sum + Number(item.score || 0), 0);
    return {
      overallScore: Math.round((totalScore / assessment.length) * 10) / 10,
      completedCount: assessment.filter((item) => Number(item.score || 0) > 0).length,
      requirementCount: assessment.length,
    };
  }, [assessment]);
  const process = state.data || {
    name: "",
    description: "",
    responsiblePerson: "",
    indicators: [],
    inputs: [],
    outputs: [],
  };

  if (state.loading) return <div className="saas-card p-6">Loading process...</div>;
  if (state.error) return <div className="saas-card p-6 text-rose-700">{state.error}</div>;

  function updateRequirement(code, field, value) {
    setAssessment((current) =>
      current.map((item) =>
        item.code === code
          ? {
              ...item,
              [field]: 
                field === "score" 
                  ? Math.max(0, Math.min(100, Number(value) || 0))
                  : field === "rate"
                  ? Math.max(0, Math.min(100, Number(value) || 0))
                  : field === "selected"
                  ? !!value
                  : value,
            }
          : item,
      ),
    );
  }

  async function saveAssessment() {
    try {
      setAssessmentMeta((prev) => ({ ...prev, saving: true, error: "", success: "" }));
      const payload = {
        items: assessment.map((item) => ({
          code: item.code,
          name: item.name,
          selected: !!item.selected,
          score: Number(item.score || 0),
          rate: item.rate ? Number(item.rate) : null,
          veracityLevel: item.veracityLevel || "FALSE",
          notes: item.notes || "",
        })),
      };
      const { data } = await api.put(`/processes/${processId}/assessment`, payload);
      setAssessment(data.data.requirements || []);
      setAssessmentMeta({
        loading: false,
        saving: false,
        error: "",
        success: "Fiche d'évaluation enregistrée.",
        summary: data.data.summary || null,
      });
    } catch (error) {
      setAssessmentMeta((prev) => ({
        ...prev,
        saving: false,
        error: getErrorMessage(error),
        success: "",
      }));
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title={process.name} subtitle={process.description || "No description"} />

      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <Card>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Responsible</p>
            <p className="mt-1 text-lg font-medium text-slate-900">{process.responsiblePerson}</p>
          </Card>
        </div>
        <div>
          <Card>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">KPI count</p>
            <p className="mt-1 text-lg font-medium text-slate-900">{Array.isArray(process.indicators) ? process.indicators.length : 0}</p>
          </Card>
        </div>
      </section>

      <section className="saas-card p-5">
        <CardHeader title="Inputs" subtitle="Required artifacts and triggers entering this process." />
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {process.inputs.map((input) => (
            <li key={input}>{input}</li>
          ))}
        </ul>
      </section>

      <section className="saas-card p-5">
        <CardHeader title="Outputs" subtitle="Deliverables and quality records generated." />
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {process.outputs.map((output) => (
            <li key={output}>{output}</li>
          ))}
        </ul>
      </section>

      <section className="saas-card p-5">
        <CardHeader title="Indicators" subtitle="Performance control against target values." />
        <Table headers={["Name", "Current", "Target", "Achievement"]}>
          {(process.indicators || []).map((kpi) => {
            const achievement = kpi.target ? Math.round((kpi.current / kpi.target) * 100) : 0;
            return (
              <tr key={kpi.name}>
                <td className="px-4 py-3 text-slate-900">{kpi.name}</td>
                <td className="px-4 py-3 text-slate-600">{kpi.current}</td>
                <td className="px-4 py-3 text-slate-600">{kpi.target}</td>
                <td className="px-4 py-3">
                  <Badge tone={achievement >= 90 ? "green" : achievement >= 70 ? "amber" : "red"}>
                    {achievement}%
                  </Badge>
                </td>
              </tr>
            );
          })}
        </Table>
      </section>

      <section className="saas-card p-5">
        <CardHeader
          title="Fiche d'évaluation des exigences ISO 9001"
          subtitle="Renseignez le taux de véracité/conformité du processus pour chaque exigence, puis suivez le taux global."
        />
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Card>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Taux global</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">{assessmentSummary.overallScore}%</p>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Exigences renseignées</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">
              {assessmentSummary.completedCount}/{assessmentSummary.requirementCount}
            </p>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Statut</p>
            <div className="mt-2">
              <Badge tone={assessmentSummary.overallScore >= 80 ? "green" : assessmentSummary.overallScore >= 60 ? "amber" : "red"}>
                {assessmentSummary.overallScore >= 80 ? "Maîtrisé" : assessmentSummary.overallScore >= 60 ? "À renforcer" : "Critique"}
              </Badge>
            </div>
          </Card>
        </div>

        {assessmentMeta.error ? <p className="mt-4 text-sm text-rose-700">{assessmentMeta.error}</p> : null}
        {assessmentMeta.success ? <p className="mt-4 text-sm text-emerald-700">{assessmentMeta.success}</p> : null}

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-4 py-3 font-medium w-8">
                  <input 
                    type="checkbox" 
                    disabled={!canEditAssessment}
                    checked={assessment.length > 0 && assessment.every(i => i.selected)}
                    onChange={(e) => {
                      const allSelected = e.target.checked;
                      setAssessment(current => current.map(item => ({ ...item, selected: allSelected })));
                    }}
                  />
                </th>
                <th className="px-4 py-3 font-medium">Exigence</th>
                <th className="px-4 py-3 font-medium">Véracité</th>
                <th className="px-4 py-3 font-medium">Score (%)</th>
                <th className="px-4 py-3 font-medium">Taux (%)</th>
                <th className="px-4 py-3 font-medium">Observation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assessment.map((item) => (
                <tr key={item.code} className={item.selected ? "" : "opacity-60"}>
                  <td className="px-4 py-3 align-top">
                    <input 
                      type="checkbox" 
                      checked={!!item.selected}
                      disabled={!canEditAssessment}
                      onChange={(e) => updateRequirement(item.code, "selected", e.target.checked)}
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <p className="font-medium text-slate-900">{item.code}. {item.name}</p>
                    {item.description && <p className="text-xs text-slate-500 mt-1">{item.description}</p>}
                    {item.clause && <p className="text-xs text-slate-400">Clause: {item.clause}</p>}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Select
                      value={item.veracityLevel || "FALSE"}
                      disabled={!canEditAssessment}
                      onChange={(event) => updateRequirement(item.code, "veracityLevel", event.target.value)}
                    >
                      {VERACITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </Select>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={item.score}
                      disabled={!canEditAssessment}
                      onChange={(event) => updateRequirement(item.code, "score", event.target.value)}
                      className="w-20"
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={item.rate || ""}
                      placeholder="Taux"
                      disabled={!canEditAssessment}
                      onChange={(event) => updateRequirement(item.code, "rate", event.target.value)}
                      className="w-20"
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <TextArea
                      rows="2"
                      value={item.notes || ""}
                      disabled={!canEditAssessment}
                      onChange={(event) => updateRequirement(item.code, "notes", event.target.value)}
                      placeholder="Preuves, écarts, remarques d'audit..."
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {canEditAssessment ? (
          <div className="mt-4 flex justify-end">
            <Button onClick={saveAssessment} disabled={assessmentMeta.saving || assessmentMeta.loading}>
              {assessmentMeta.saving ? "Enregistrement..." : "Enregistrer la fiche"}
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
