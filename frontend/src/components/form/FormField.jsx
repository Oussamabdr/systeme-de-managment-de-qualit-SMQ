import React from "react";
import { AlertCircle } from "lucide-react";

/**
 * Display field-level validation error
 * Shows error message with icon if present
 */
export function FieldError({ error, touched, className = "" }) {
  if (!error || !touched) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 mt-1 text-red-600 text-sm ${className}`}>
      <AlertCircle size={14} className="flex-shrink-0" />
      <span>{error}</span>
    </div>
  );
}

/**
 * Enhanced form field group with label, input, and error display
 */
export function FormField({
  label,
  name,
  type = "text",
  value = "",
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  placeholder,
  helpText,
  disabled = false,
  className = "",
  inputClassName = "",
  ...rest
}) {
  const hasError = error && touched;

  return (
    <div className={`field-group ${className}`}>
      {label && (
        <label className="field-label">
          {label}
          {required && <span className="text-red-600 font-bold">*</span>}
        </label>
      )}

      {type === "textarea" ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`saas-input w-full resize-none ${inputClassName} ${
            hasError ? "border-red-500 bg-red-50" : ""
          }`}
          rows={4}
          {...rest}
        />
      ) : type === "select" ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className={`saas-input w-full ${inputClassName} ${
            hasError ? "border-red-500 bg-red-50" : ""
          }`}
          {...rest}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`saas-input w-full ${inputClassName} ${
            hasError ? "border-red-500 bg-red-50" : ""
          }`}
          {...rest}
        />
      )}

      {helpText && !hasError && (
        <p className="field-help text-xs text-gray-500 mt-1">{helpText}</p>
      )}

      <FieldError error={error} touched={touched} />
    </div>
  );
}

/**
 * Display summary of all form errors (for form-level feedback)
 */
export function FormErrors({ errors, className = "" }) {
  const errorCount = Object.keys(errors).length;

  if (errorCount === 0) {
    return null;
  }

  return (
    <div
      className={`mb-4 p-3 bg-red-50 border border-red-200 rounded-lg ${className}`}
    >
      <div className="flex items-start gap-2">
        <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-red-800 text-sm">
            Veuillez corriger les {errorCount} erreur(s)
          </p>
          <ul className="mt-2 space-y-1">
            {Object.entries(errors).map(([field, message]) => (
              <li key={field} className="text-red-700 text-sm">
                <strong>{field}:</strong> {message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Success message component
 */
export function SuccessMessage({ message, onDismiss, className = "" }) {
  if (!message) return null;

  return (
    <div className={`p-3 bg-green-50 border border-green-200 rounded-lg ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="text-green-600 text-lg">✓</div>
          <p className="text-green-800 text-sm">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-green-600 hover:text-green-800 text-lg"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
