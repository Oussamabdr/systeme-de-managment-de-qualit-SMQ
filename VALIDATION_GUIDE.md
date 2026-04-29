# Data Input Validation Guide

## Overview

This ISO 9001 Quality Governance Information System includes comprehensive data input validation at both frontend and backend levels to ensure data integrity, consistency, and compliance.

## Architecture

### Backend Validation (Node.js + Express)

**Location**: `backend/src/utils/validation.js`

The backend uses **Zod** schemas to validate all input data before persistence:

- **Automatic validation** in all controllers (process, project, task, non-conformity, corrective action)
- **Structured error responses** with field-level error messages
- **ISO 9001 context** - validation rules reflect governance requirements

#### Key Validation Rules

##### Process Validation

```javascript
// Name: 2-100 characters
// Description: Optional, max 500 chars
// Responsible Person: Required, min 2 chars
// Objectives: Array of strings, min 5 chars each
// Indicators: Objects with name, target, current (non-negative), unit
```

**Example valid payload**:

```json
{
  "name": "Quality Audit Process",
  "responsiblePerson": "CAQ Manager",
  "objectives": [
    "Verify compliance with ISO standards",
    "Identify improvement opportunities"
  ],
  "indicators": [
    { "name": "Audit Coverage %", "target": 100, "current": 85 },
    { "name": "Finding Closure Rate", "target": 95, "current": 88 }
  ]
}
```

##### Project Validation

```javascript
// Name: 2-150 characters
// Description: Optional, max 500 chars
// Start/End Dates: Must be valid dates; endDate >= startDate
```

##### Task Validation

```javascript
// Title: 3-200 characters
// Status: One of TODO, IN_PROGRESS, DONE
// Due Date: Must be in the future (if provided)
// Planned Hours: Non-negative, max 1000
// Actual Hours: Non-negative, max 1000
// Project & Process: Required (referenced records must exist)
```

##### Non-Conformity Validation

```javascript
// Title: 5-200 characters
// Description: Optional, 10-1000 chars if provided
// Status: One of OPEN, ANALYSIS, CLOSED
// Severity: One of LOW, MEDIUM, HIGH, CRITICAL
```

##### Corrective Action Validation

```javascript
// Title: 5-200 characters
// Root Cause: Optional, 5-500 chars if provided
// Action Type: CORRECTIVE or PREVENTIVE
// Status: One of OPEN, IN_PROGRESS, DONE, CANCELLED
// Due Date: Must be in the future
```

### Error Handling

#### Backend Error Response Format

When validation fails, the API returns a **400 Bad Request** with this structure:

```json
{
  "success": false,
  "message": "Validation échouée avec 2 erreur(s)",
  "fieldErrors": {
    "name": "Le nom du processus doit contenir au moins 2 caractères",
    "indicators.0.target": "La cible doit être positive"
  },
  "errors": [
    {
      "field": "name",
      "message": "Le nom du processus doit contenir au moins 2 caractères"
    },
    {
      "field": "indicators.0.target",
      "message": "La cible doit être positive"
    }
  ]
}
```

### Frontend Validation (React)

**Location**: `frontend/src/hooks/useFormValidation.js`

Custom React hook providing:

- **Real-time field validation**
- **Touch tracking** (error shows only after field is interacted with)
- **API error integration** (automatically parses backend validation errors)
- **Pre-defined validation rules** for common patterns

#### useFormValidation Hook

```javascript
import {
  useFormValidation,
  fieldValidationRules,
} from "../hooks/useFormValidation";

function MyForm() {
  const { errors, touched, markFieldTouched, handleApiError, clearErrors } =
    useFormValidation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/my-endpoint", formData);
    } catch (error) {
      handleApiError(error.response?.data);
    }
  };

  return (
    <input
      name="name"
      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
      onBlur={() => markFieldTouched("name")}
      className={errors.name && touched.name ? "border-red-500" : ""}
    />
  );
}
```

#### Available Validation Rules

```javascript
// Single value validators
fieldValidationRules.required(value); // "Ce champ est obligatoire"
fieldValidationRules.minLength(5)(value); // "Doit contenir au moins 5 caractères"
fieldValidationRules.maxLength(100)(value); // "Ne doit pas dépasser 100 caractères"
fieldValidationRules.email(value); // Email format check
fieldValidationRules.url(value); // URL format check
fieldValidationRules.number(value); // Numeric check
fieldValidationRules.positive(value); // >= 0
fieldValidationRules.date(value); // Valid date
fieldValidationRules.futureDate(value); // Future date only
fieldValidationRules.password(value); // 8+ chars, uppercase, digit, special char

// Combine multiple rules
const rule = fieldValidationRules.combine(
  fieldValidationRules.required,
  fieldValidationRules.minLength(3),
  fieldValidationRules.maxLength(100),
);
```

### Form Components

**Location**: `frontend/src/components/form/FormField.jsx`

Pre-built UI components that handle validation display:

#### FormField Component

```javascript
import { FormField } from "../components/form/FormField";

<FormField
  label="Process Name"
  name="name"
  value={form.name}
  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
  onBlur={() => markFieldTouched("name")}
  error={errors.name}
  touched={touched.name}
  placeholder="e.g. Quality Control"
  helpText="Name must be 2-100 characters"
  required
/>;
```

**Features**:

- Auto-renders error with icon when `touched=true`
- Supports text, textarea, select inputs
- Red border on error state
- Help text below field
- Disabled state support

#### FormErrors Component

Display all form errors in a summary box:

```javascript
import { FormErrors } from "../components/form/FormField";

<FormErrors errors={errors} />;
```

Output:

```
⚠ Veuillez corriger les 2 erreur(s)
- name: Le nom doit contenir au moins 2 caractères
- responsiblePerson: Ce champ est obligatoire
```

#### SuccessMessage Component

Show temporary success feedback:

```javascript
import { SuccessMessage } from "../components/form/FormField";

<SuccessMessage
  message="Processus créé avec succès!"
  onDismiss={() => setSuccessMessage("")}
/>;
```

## Implementation Examples

### Example 1: ProcessesPage - Full Validation Pattern

```javascript
import { useFormValidation } from "../hooks/useFormValidation";
import {
  FormField,
  FormErrors,
  SuccessMessage,
} from "../components/form/FormField";

export default function ProcessesPage() {
  const [form, setForm] = useState(initialForm);
  const [successMessage, setSuccessMessage] = useState("");
  const { errors, touched, markFieldTouched, handleApiError, clearErrors } =
    useFormValidation();

  const onSubmit = async (event) => {
    event.preventDefault();
    clearErrors();

    try {
      const response = await api.post("/processes", form);
      setForm(initialForm);
      setSuccessMessage("Processus créé avec succès!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      if (err.response?.data?.fieldErrors) {
        handleApiError(err.response.data);
      }
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <SuccessMessage message={successMessage} />
      <FormErrors errors={errors} />

      <FormField
        label="Process Name"
        name="name"
        value={form.name}
        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
        onBlur={() => markFieldTouched("name")}
        error={errors.name}
        touched={touched.name}
        required
      />

      <button type="submit">Save</button>
    </form>
  );
}
```

### Example 2: Custom Validation in Forms

```javascript
// Validate field only when it becomes "touched"
const validateTaskTitle = (value) => {
  if (!value || value.length < 3) return "Minimum 3 characters";
  if (value.length > 200) return "Maximum 200 characters";
  return null;
};

<FormField
  label="Task Title"
  name="title"
  value={form.title}
  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
  onBlur={() => {
    markFieldTouched("title");
    const error = validateTaskTitle(form.title);
    if (error) setFieldError("title", error);
  }}
  error={errors.title}
  touched={touched.title}
/>;
```

## Testing Validation

### Unit Testing (Backend)

Test schema validation:

```javascript
const { validationSchemas } = require("../utils/validation");

// Valid data passes
const valid = { name: "Process A", responsiblePerson: "Manager" };
validationSchemas.process.parse(valid); // OK

// Invalid data throws ZodError
validationSchemas.process.parse({ name: "P" }); // Error: min 2 chars
```

### Integration Testing (API)

```bash
# Test invalid process submission
curl -X POST http://localhost:5000/api/processes \
  -H "Content-Type: application/json" \
  -d '{"name":"A"}'

# Response:
# {
#   "success": false,
#   "message": "Validation échouée avec 1 erreur(s)",
#   "fieldErrors": {
#     "name": "Le nom du processus doit contenir au moins 2 caractères"
#   }
# }
```

### Manual Testing (Frontend)

1. Open ProcessesPage
2. Leave "Process Name" blank and click Save → Error displays
3. Enter 1 character and blur field → Error message appears
4. Enter valid name (2+ chars) → Error clears
5. Fill remaining required fields and submit
6. Invalid backend response → Errors mapped to fields automatically

## Best Practices

### Backend

✅ Always validate in controllers before calling services
✅ Use Zod schemas for consistent validation rules
✅ Return field-level errors, not generic messages
✅ Log validation failures for audit trail

### Frontend

✅ Show errors only after user interacts with field (use `touched` state)
✅ Provide helpful error messages in user's language (français)
✅ Disable submit button while validation errors exist
✅ Show success message on successful submission

### Data Quality

✅ Enforce length limits (names 2-150 chars, descriptions max 500)
✅ Validate date relationships (endDate >= startDate)
✅ Require critical fields (name, responsible, project, process)
✅ Normalize enum values (TODO, IN_PROGRESS, DONE)

## Future Enhancements

- [ ] Real-time backend validation via API (debounced field validation)
- [ ] Custom validation rules per ISO clause
- [ ] Multi-language error messages (currently français)
- [ ] Client-side caching of validation results
- [ ] Accessibility improvements (ARIA labels for errors)

## References

- **Zod Documentation**: https://zod.dev
- **React Form Patterns**: Modern React Hook Form integration planned
- **ISO 9001:2015**: Clause-specific validation rules alignment
