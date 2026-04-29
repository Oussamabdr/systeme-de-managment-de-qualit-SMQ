const { z } = require("zod");

/**
 * Enhanced Zod schemas with ISO 9001 governance context
 * All schemas include custom error messages for better UX
 */

const validationSchemas = {
  // ===== PROCESS SCHEMA =====
  process: z.object({
    name: z
      .string()
      .min(2, "Le nom du processus doit contenir au moins 2 caractères")
      .max(100, "Le nom ne doit pas dépasser 100 caractères"),
    description: z
      .string()
      .max(500, "La description ne doit pas dépasser 500 caractères")
      .optional()
      .nullable(),
    responsiblePerson: z
      .string()
      .min(2, "Le responsable doit être spécifié (au moins 2 caractères)"),
    objectives: z
      .array(z.string().min(5, "Chaque objectif doit contenir au moins 5 caractères"))
      .default([]),
    inputs: z
      .array(z.string().min(2, "Chaque entrée doit contenir au moins 2 caractères"))
      .default([]),
    outputs: z
      .array(z.string().min(2, "Chaque sortie doit contenir au moins 2 caractères"))
      .default([]),
    knowledgeItems: z
      .array(z.string().min(5, "Chaque item doit contenir au moins 5 caractères"))
      .default([]),
    indicators: z
      .array(
        z.object({
          name: z
            .string()
            .min(2, "Le nom de l'indicateur est obligatoire")
            .max(100, "Le nom est trop long"),
          target: z
            .number()
            .nonnegative("La cible doit être positive")
            .max(10000, "Valeur trop grande pour une cible"),
          current: z
            .number()
            .nonnegative("La valeur actuelle doit être positive")
            .max(10000, "Valeur trop grande"),
          unit: z
            .string()
            .max(20, "L'unité est trop longue")
            .optional(),
        })
      )
      .default([]),
  }),

  // ===== PROJECT SCHEMA =====
  project: z.object({
    name: z
      .string()
      .min(2, "Le nom du projet doit contenir au moins 2 caractères")
      .max(150, "Le nom ne doit pas dépasser 150 caractères"),
    description: z
      .string()
      .max(500, "La description ne doit pas dépasser 500 caractères")
      .optional()
      .nullable(),
    ownerId: z.string().optional().nullable(),
    startDate: z
      .coerce.date()
      .optional()
      .nullable()
      .refine(
        (date) => !date || date <= new Date(date.getTime() + 1000 * 60 * 60 * 24 * 365 * 5),
        "La date de début ne doit pas être plus de 5 ans à partir d'aujourd'hui"
      ),
    endDate: z.coerce.date().optional().nullable(),
  }).refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    { message: "La date de fin doit être après la date de début", path: ["endDate"] }
  ),

  // ===== TASK SCHEMA =====
  task: z.object({
    title: z
      .string()
      .min(3, "Le titre doit contenir au least 3 caractères")
      .max(200, "Le titre ne doit pas dépasser 200 caractères"),
    description: z
      .string()
      .max(1000, "La description ne doit pas dépasser 1000 caractères")
      .optional()
      .nullable(),
    status: z
      .enum(["TODO", "IN_PROGRESS", "DONE"], {
        errorMap: () => ({ message: "Le statut doit être TODO, IN_PROGRESS ou DONE" }),
      })
      .default("TODO"),
    dueDate: z
      .coerce.date()
      .optional()
      .nullable()
      .refine(
        (date) => !date || date >= new Date(),
        "La date limite doit être dans le futur"
      ),
    plannedHours: z
      .coerce.number()
      .nonnegative("Les heures planifiées ne peuvent pas être négatives")
      .max(1000, "Valeur déraisonnablement haute")
      .optional()
      .nullable(),
    actualHours: z
      .coerce.number()
      .nonnegative("Les heures réelles ne peuvent pas être négatives")
      .max(1000, "Valeur déraisonnablement haute")
      .optional()
      .nullable(),
    projectId: z.string().min(1, "Un projet doit être sélectionné"),
    processId: z.string().min(1, "Un processus doit être sélectionné"),
    assigneeId: z.string().optional().nullable(),
  }),

  // ===== NON-CONFORMITY SCHEMA =====
  nonConformity: z.object({
    title: z
      .string()
      .min(5, "Le titre doit contenir au moins 5 caractères")
      .max(200, "Le titre ne doit pas dépasser 200 caractères"),
    description: z
      .string()
      .min(10, "La description doit contenir au moins 10 caractères")
      .max(1000, "La description ne doit pas dépasser 1000 caractères")
      .optional()
      .nullable(),
    status: z
      .enum(["OPEN", "ANALYSIS", "CLOSED"], {
        errorMap: () => ({ message: "Le statut doit être OPEN, ANALYSIS ou CLOSED" }),
      })
      .default("OPEN"),
    severity: z
      .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"], {
        errorMap: () => ({ message: "La sévérité doit être LOW, MEDIUM, HIGH ou CRITICAL" }),
      })
      .default("MEDIUM"),
    detectedAt: z.coerce.date().optional(),
    processId: z.string().optional().nullable(),
  }),

  // ===== CORRECTIVE ACTION SCHEMA =====
  correctiveAction: z.object({
    title: z
      .string()
      .min(5, "Le titre doit contenir au moins 5 caractères")
      .max(200, "Le titre ne doit pas dépasser 200 caractères"),
    description: z
      .string()
      .max(1000, "La description ne doit pas dépasser 1000 caractères")
      .optional()
      .nullable(),
    recommendation: z
      .string()
      .max(500, "La recommandation ne doit pas dépasser 500 caractères")
      .optional()
      .nullable(),
    actionType: z
      .enum(["CORRECTIVE", "PREVENTIVE"], {
        errorMap: () => ({ message: "Le type doit être CORRECTIVE ou PREVENTIVE" }),
      })
      .default("CORRECTIVE"),
    status: z
      .enum(["OPEN", "IN_PROGRESS", "DONE", "CANCELLED"], {
        errorMap: () => ({ message: "Le statut invalide" }),
      })
      .default("OPEN"),
    severity: z
      .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
      .default("MEDIUM"),
    rootCause: z
      .string()
      .min(5, "La cause racine doit être décrite (au moins 5 caractères)")
      .max(500, "Trop long")
      .optional()
      .nullable(),
    containmentAction: z
      .string()
      .max(500, "Action de containment trop longue")
      .optional()
      .nullable(),
    effectivenessCriteria: z
      .string()
      .max(500, "Critères trop longs")
      .optional()
      .nullable(),
    dueDate: z.coerce.date().optional().nullable(),
    nonConformityId: z.string().optional().nullable(),
  }),

  // ===== DOCUMENT SCHEMA (FOR UPLOAD) =====
  document: z.object({
    taskId: z.string().optional().nullable(),
    processId: z.string().optional().nullable(),
  }).refine(
    (data) => data.taskId || data.processId,
    { message: "Un document doit être attaché à une tâche ou à un processus" }
  ),

  // ===== AUTH SCHEMA =====
  auth: z.object({
    email: z
      .string()
      .email("L'email doit être valide")
      .max(255, "L'email est trop long"),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères")
      .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
      .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
      .regex(/[!@#$%^&*]/, "Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*)")
      .max(128, "Le mot de passe est trop long"),
  }),
};

/**
 * Parse Zod errors into a user-friendly format
 * @param {z.ZodError} zodError - The Zod validation error
 * @returns {Object} Formatted error object with field-level messages
 */
function formatZodErrors(zodError) {
  const fieldErrors = {};
  const allErrors = [];

  zodError.errors.forEach((error) => {
    const path = error.path.join(".");
    const message = error.message;

    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }
    fieldErrors[path].push(message);
    allErrors.push({ field: path, message });
  });

  return {
    fieldErrors,
    allErrors,
    summary: `Validation échouée avec ${zodError.errors.length} erreur(s)`,
  };
}

module.exports = {
  validationSchemas,
  formatZodErrors,
};
