export default function PageHeader({ title, subtitle, actions }) {
  return (
    <header className="saas-card p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-[28px] font-semibold text-slate-950">{title}</h2>
          {subtitle ? <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
