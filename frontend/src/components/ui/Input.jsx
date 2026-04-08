export function Input({ className = "", ...props }) {
  return <input className={`saas-input ${className}`} {...props} />;
}

export function Select({ className = "", children, ...props }) {
  return (
    <select className={`saas-input ${className}`} {...props}>
      {children}
    </select>
  );
}

export function TextArea({ className = "", ...props }) {
  return <textarea className={`saas-input ${className}`} {...props} />;
}
