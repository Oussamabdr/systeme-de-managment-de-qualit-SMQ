import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/client";
import PageHeader from "../components/ui/PageHeader";
import { getErrorMessage } from "../utils/http";
import { Card, CardHeader } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { Table } from "../components/ui/Table";

export default function ProcessDetailsPage() {
  const { processId } = useParams();
  const [state, setState] = useState({ loading: true, data: null, error: "" });

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const { data } = await api.get(`/processes/${processId}`);
        if (mounted) setState({ loading: false, data: data.data, error: "" });
      } catch (error) {
        if (mounted) setState({ loading: false, data: null, error: getErrorMessage(error) });
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [processId]);

  if (state.loading) return <div className="saas-card p-6">Loading process...</div>;
  if (state.error) return <div className="saas-card p-6 text-rose-700">{state.error}</div>;

  const process = state.data;

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
    </div>
  );
}
