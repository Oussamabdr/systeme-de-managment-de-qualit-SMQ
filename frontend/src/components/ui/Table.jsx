export function Table({ headers = [], children }) {
  return (
    <div className="overflow-x-auto">
      <table className="saas-table w-full text-left">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
