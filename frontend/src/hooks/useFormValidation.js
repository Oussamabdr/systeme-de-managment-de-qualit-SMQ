import { useState, useCallback } from "react";

/**
 * Custom hook for form validation with real-time error handling
 * Supports field-level and form-level validation
 */
export function useFormValidation(onValidationFail = null) {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Mark field as touched for error display
   */
  const markFieldTouched = useCallback((fieldName) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
  }, []);

  /**
   * Set error for a specific field
   */
  const setFieldError = useCallback((fieldName, errorMessage) => {
    setErrors((prev) => ({
      ...prev,
      [fieldName]: errorMessage,
    }));
  }, []);

  /**
   * Clear error for a specific field
   */
  const clearFieldError = useCallback((fieldName) => {
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated[fieldName];
      return updated;
    });
  }, []);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Validate a single field based on custom rules
   */
  const validateField = useCallback((fieldName, value, rules) => {
    if (!rules || typeof rules !== "function") {
      return null;
    }

    const error = rules(value);
    if (error) {
      setFieldError(fieldName, error);
      return error;
    } else {
      clearFieldError(fieldName);
      return null;
    }
  }, [setFieldError, clearFieldError]);

  /**
   * Handle validation error response from API
   */
  const handleApiError = useCallback((apiError) => {
    if (apiError.fieldErrors) {
      // fieldErrors is { field: [errors...] } or { field: error }
      const newErrors = {};
      Object.entries(apiError.fieldErrors).forEach(([field, msgs]) => {
        newErrors[field] = Array.isArray(msgs) ? msgs[0] : msgs;
      });
      setErrors(newErrors);
    } else if (apiError.errors && Array.isArray(apiError.errors)) {
      // errors is [{ field, message }, ...]
      const newErrors = {};
      apiError.errors.forEach((err) => {
        newErrors[err.field] = err.message;
      });
      setErrors(newErrors);
    }

    if (onValidationFail) {
      onValidationFail(apiError.message || "Validation error");
    }
  }, [onValidationFail]);

  /**
   * Check if form has any errors
   */
  const hasErrors = useCallback(() => {
    return Object.keys(errors).length > 0;
  }, [errors]);

  return {
    errors,
    touched,
    isSubmitting,
    setIsSubmitting,
    markFieldTouched,
    setFieldError,
    clearFieldError,
    clearErrors,
    validateField,
    handleApiError,
    hasErrors,
  };
}

/**
 * Collection of common field validation rules (return error message or null)
 */
export const fieldValidationRules = {
  required: (value) => {
    if (!value || value.toString().trim() === "") {
      return "Ce champ est obligatoire";
    }
    return null;
  },

  minLength: (min) => (value) => {
    if (value && value.toString().length < min) {
      return `Doit contenir au moins ${min} caractères`;
    }
    return null;
  },

  maxLength: (max) => (value) => {
    if (value && value.toString().length > max) {
      return `Ne doit pas dépasser ${max} caractères`;
    }
    return null;
  },

  email: (value) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "Email invalide";
    }
    return null;
  },

  url: (value) => {
    if (value) {
      try {
        new URL(value);
      } catch {
        return "URL invalide";
      }
    }
    return null;
  },

  number: (value) => {
    if (value !== "" && value !== null && value !== undefined && isNaN(value)) {
      return "Doit être un nombre";
    }
    return null;
  },

  positive: (value) => {
    if (value !== "" && value !== null && value !== undefined && Number(value) < 0) {
      return "Doit être positif";
    }
    return null;
  },

  date: (value) => {
    if (value && isNaN(new Date(value).getTime())) {
      return "Date invalide";
    }
    return null;
  },

  futureDate: (value) => {
    if (value && new Date(value) < new Date()) {
      return "La date doit être dans le futur";
    }
    return null;
  },

  password: (value) => {
    if (!value) return null;
    if (value.length < 8) return "Au moins 8 caractères";
    if (!/[A-Z]/.test(value)) return "Au moins une majuscule";
    if (!/[0-9]/.test(value)) return "Au moins un chiffre";
    if (!/[!@#$%^&*]/.test(value))
      return "Au moins un caractère spécial (!@#$%^&*)";
    return null;
  },

  // Combine multiple rules
  combine:
    (...rules) =>
    (value) => {
      for (const rule of rules) {
        const error = rule(value);
        if (error) return error;
      }
      return null;
    },
};
