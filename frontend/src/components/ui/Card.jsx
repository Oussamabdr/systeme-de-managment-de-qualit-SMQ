import { forwardRef } from "react";

export const Card = forwardRef(function Card({ className = "", children }, ref) {
  return <section ref={ref} className={`saas-card ${className}`}>{children}</section>;
});

export function CardHeader({ title, subtitle, action }) {
  return (
    <header className="mb-5 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </header>
  );
}
