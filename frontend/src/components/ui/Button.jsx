export default function Button({ variant = "primary", className = "", ...props }) {
  const variants = {
    primary: "saas-btn saas-btn-primary",
    ghost: "saas-btn saas-btn-ghost",
    subtle: "saas-btn saas-btn-subtle",
  };

  return <button className={`${variants[variant] || variants.primary} ${className}`} {...props} />;
}
