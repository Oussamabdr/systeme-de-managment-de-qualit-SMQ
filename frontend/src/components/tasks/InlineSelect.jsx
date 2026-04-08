import { Select } from "../ui/Input";

export default function InlineSelect({ className = "", ...props }) {
  return <Select className={`h-9 py-1 text-sm transition-all duration-200 ${className}`} {...props} />;
}
