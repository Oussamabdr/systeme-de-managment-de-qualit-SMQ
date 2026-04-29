# Quick Start: Adding Validation to Forms

## TL;DR - 30 Second Setup

To add validation to any form page:

```javascript
// 1. Import the hook and components
import { useFormValidation } from "../hooks/useFormValidation";
import { FormField, FormErrors, SuccessMessage } from "../components/form/FormField";

// 2. Use the hook in your component
const { errors, touched, markFieldTouched, handleApiError, clearErrors } = useFormValidation();
const [successMessage, setSuccessMessage] = useState("");

// 3. Replace Input/TextArea with FormField
<FormField
  label="Field Label"
  name="fieldName"
  value={form.fieldName}
  onChange={(e) => setForm(p => ({ ...p, fieldName: e.target.value }))}
  onBlur={() => markFieldTouched("fieldName")}
  error={errors.fieldName}
  touched={touched.fieldName}
  required
/>

// 4. Wrap form with FormErrors and SuccessMessage
<form onSubmit={onSubmit}>
  <SuccessMessage message={successMessage} />
  <FormErrors errors={errors} />
  {/* form fields here */}
</form>

// 5. Handle API errors in try/catch
try {
  await api.post("/endpoint", payload);
  setSuccessMessage("Succès!");
} catch (err) {
  handleApiError(err.response?.data);
}
```

## Step-by-Step Implementation Guide

### Step 1: Add Validation Hook

```javascript
import { useFormValidation } from "../hooks/useFormValidation";

function MyPage() {
  const { 
    errors,                // { fieldName: "error message" }
    touched,               // { fieldName: true } - tracks user interaction
    markFieldTouched,      // () => trigger validation display
    handleApiError,        // (apiErrorObj) => parse backend errors
    clearErrors            // () => reset all errors
  } = useFormValidation();

  return (...);
}
```

### Step 2: Display Form Errors

At the top of your form:

```jsx
<form onSubmit={onSubmit} className="space-y-3">
  {/* Show all validation errors as a summary */}
  <FormErrors errors={errors} />
  
  {/* Show success message after submission */}
  <SuccessMessage message={successMessage} />

  {/* Form fields here */}
</form>
```

### Step 3: Convert Form Fields

Replace existing Input components:

**Before**:
```jsx
<input 
  type="text"
  value={form.name}
  onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
  placeholder="Enter name"
/>
```

**After**:
```jsx
<FormField
  label="Process Name"
  name="name"
  type="text"
  value={form.name}
  onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
  onBlur={() => markFieldTouched("name")}
  error={errors.name}
  touched={touched.name}
  placeholder="e.g. Quality Control"
  helpText="Name must be 2-100 characters"
  required
/>
```

**FormField Props**:
```javascript
{
  label: string,              // Field label
  name: string,               // Field name (used in errors)
  type: string,               // text, textarea, select, email, number, date, etc
  value: string,              // Current field value
  onChange: (e) => void,      // Change handler
  onBlur: () => void,         // Blur handler - triggers markFieldTouched
  error: string,              // Error message from errors object
  touched: boolean,           // From touched object
  required: boolean,          // Whether field is required
  placeholder: string,        // Placeholder text
  helpText: string,           // Helper text below field
  disabled: boolean,          // Disabled state
  className: string,          // Additional CSS for wrapper
  inputClassName: string      // Additional CSS for input element
}
```

### Step 4: Handle Form Submission

```javascript
const onSubmit = async (event) => {
  event.preventDefault();
  clearErrors();               // Clear previous errors
  setSuccessMessage("");

  try {
    const response = await api.post("/api/endpoint", {
      name: form.name,
      description: form.description,
      // ... other fields
    });

    // Success!
    setForm(initialState);     // Reset form
    setSuccessMessage("Créé avec succès!");
    setTimeout(() => setSuccessMessage(""), 3000);
    
    // Optional: reload data
    loadData();

  } catch (error) {
    // Backend validation errors
    if (error.response?.data?.fieldErrors) {
      handleApiError(error.response.data);
    } else {
      // Generic error
      handleApiError({
        message: "Une erreur est survenue",
        fieldErrors: {}
      });
    }
  }
};
```

## Real Example: Updating a Page

Let's update **ProjectsPage** as an example:

### Current Code
```javascript
function ProjectsPage() {
  const [form, setForm] = useState({ name: "", description: "" });
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/projects", form);
      setForm({ name: "", description: "" });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <form onSubmit={onSubmit}>
      {error && <p>{error}</p>}
      <input value={form.name} onChange={...} />
      <textarea value={form.description} onChange={...} />
      <button>Save</button>
    </form>
  );
}
```

### Updated Code
```javascript
import { useFormValidation } from "../hooks/useFormValidation";
import { FormField, FormErrors, SuccessMessage } from "../components/form/FormField";

function ProjectsPage() {
  const [form, setForm] = useState({ name: "", description: "", startDate: "", endDate: "" });
  const [successMessage, setSuccessMessage] = useState("");
  const { errors, touched, markFieldTouched, handleApiError, clearErrors } = useFormValidation();

  const onSubmit = async (e) => {
    e.preventDefault();
    clearErrors();
    setSuccessMessage("");

    try {
      await api.post("/projects", form);
      setForm({ name: "", description: "", startDate: "", endDate: "" });
      setSuccessMessage("Projet créé avec succès!");
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
        label="Project Name"
        name="name"
        value={form.name}
        onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
        onBlur={() => markFieldTouched("name")}
        error={errors.name}
        touched={touched.name}
        required
      />

      <FormField
        label="Description"
        name="description"
        type="textarea"
        value={form.description}
        onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
        onBlur={() => markFieldTouched("description")}
        error={errors.description}
        touched={touched.description}
      />

      <FormField
        label="Start Date"
        name="startDate"
        type="date"
        value={form.startDate}
        onChange={(e) => setForm(p => ({ ...p, startDate: e.target.value }))}
        onBlur={() => markFieldTouched("startDate")}
        error={errors.startDate}
        touched={touched.startDate}
      />

      <FormField
        label="End Date"
        name="endDate"
        type="date"
        value={form.endDate}
        onChange={(e) => setForm(p => ({ ...p, endDate: e.target.value }))}
        onBlur={() => markFieldTouched("endDate")}
        error={errors.endDate}
        touched={touched.endDate}
      />

      <button type="submit">Save Project</button>
    </form>
  );
}
```

## Backend Validation Details

### Error Response Format

Your backend API automatically validates and returns errors like:

```json
{
  "success": false,
  "message": "Validation échouée avec 2 erreur(s)",
  "fieldErrors": {
    "name": "Le nom doit contenir au moins 2 caractères",
    "startDate": "La date de début doit être...",
    "endDate": "La date de fin doit être après la date de début"
  },
  "errors": [
    { "field": "name", "message": "..." },
    { "field": "startDate", "message": "..." }
  ]
}
```

The `handleApiError()` function automatically maps these to the form's `errors` object.

## Validation Rules by Entity

### Process
- **name**: 2-100 chars, required
- **responsiblePerson**: 2+ chars, required
- **description**: optional, max 500 chars
- **inputs/outputs**: lists of 2+ char items
- **indicators**: objects with name, target (>=0), current (>=0)

### Project
- **name**: 2-150 chars, required
- **description**: optional, max 500 chars
- **startDate**: valid date, optional
- **endDate**: must be >= startDate

### Task
- **title**: 3-200 chars, required
- **description**: optional, max 1000 chars
- **status**: TODO, IN_PROGRESS, or DONE
- **dueDate**: must be future date
- **plannedHours**: non-negative number
- **actualHours**: non-negative number
- **projectId**: required
- **processId**: required

### Non-Conformity
- **title**: 5-200 chars, required
- **description**: optional, 10-1000 chars
- **status**: OPEN, ANALYSIS, or CLOSED
- **severity**: LOW, MEDIUM, HIGH, or CRITICAL

### Corrective Action
- **title**: 5-200 chars, required
- **description**: optional, max 1000 chars
- **rootCause**: optional, 5-500 chars
- **dueDate**: must be future date
- **actionType**: CORRECTIVE or PREVENTIVE
- **status**: OPEN, IN_PROGRESS, DONE, or CANCELLED

## Common Patterns

### Optional Field with Validation
```jsx
<FormField
  label="Email (optional)"
  name="email"
  type="email"
  value={form.email}
  onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
  onBlur={() => markFieldTouched("email")}
  error={errors.email}
  touched={touched.email}
  helpText="Leave blank or provide a valid email"
/>
```

### Field with Custom Help Text
```jsx
<FormField
  label="KPI Target"
  name="target"
  type="number"
  value={form.target}
  onChange={(e) => setForm(p => ({ ...p, target: e.target.value }))}
  onBlur={() => markFieldTouched("target")}
  error={errors.target}
  touched={touched.target}
  helpText="Must be between 0 and 10000"
  required
/>
```

### Disabled Field
```jsx
<FormField
  label="Approved By"
  name="approvedBy"
  value={form.approvedBy}
  disabled={true}
  error={errors.approvedBy}
  touched={touched.approvedBy}
/>
```

## Testing Your Implementation

### Manual Test
1. Open form page
2. Try to submit without filling required fields → See "Ce champ est obligatoire"
3. Enter invalid data (e.g., 1 char for name) → See specific error
4. Enter valid data and submit → See success message
5. Try date validation (end before start) → See relationship error

### Browser Console Check
```javascript
// In React DevTools, check hook state:
// errors = { fieldName: "error message" or undefined }
// touched = { fieldName: true or false }
```

## Questions?

Refer to:
- `VALIDATION_GUIDE.md` - Complete validation reference
- `frontend/src/hooks/useFormValidation.js` - Hook implementation
- `frontend/src/components/form/FormField.jsx` - Component props
- `backend/src/utils/validation.js` - Zod schemas
