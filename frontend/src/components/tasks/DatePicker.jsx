import { Input } from "../ui/Input";

export default function DatePicker({ className = "", ...props }) {
  return <Input type="date" className={`h-9 py-1 text-sm transition-all duration-200 ${className}`} {...props} />;
}
