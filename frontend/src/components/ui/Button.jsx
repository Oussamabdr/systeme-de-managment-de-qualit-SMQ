export default function Button({ variant = "primary", size = "default", className = "", ...props }) {
  const variants = {
    primary: "saas-btn saas-btn-primary",
    ghost: "saas-btn saas-btn-ghost",
    subtle: "saas-btn saas-btn-subtle",
    success: "saas-btn saas-btn-success",
    danger: "saas-btn saas-btn-danger",
    warning: "saas-btn saas-btn-warning",
    outline: "saas-btn saas-btn-outline",
  };

  const sizes = {
    default: "",
    sm: "text-sm px-3 py-1.5",
    lg: "text-lg px-5 py-3",
    icon: "h-10 w-10 p-0",
  };

  return (
    <button 
      className={`${variants[variant] || variants.primary} ${sizes[size]} ${className}`} 
      {...props} 
    />
  );
}
