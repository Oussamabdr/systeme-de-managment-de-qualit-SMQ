const options = [
  { value: "TODO", label: "Todo" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
];

export default function TaskStatusDropdown({ value, onChange, disabled = false }) {
  return (
    <select
      className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
