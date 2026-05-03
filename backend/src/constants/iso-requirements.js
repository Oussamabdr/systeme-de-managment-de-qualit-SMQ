const ISO_REQUIREMENTS = [
  { code: "4", name: "Contexte de l'organisation" },
  { code: "5", name: "Leadership" },
  { code: "6", name: "Planification" },
  { code: "7", name: "Support" },
  { code: "8", name: "Réalisation des activités opérationnelles" },
  { code: "9", name: "Évaluation des performances" },
  { code: "10", name: "Amélioration" },
];

const VERACITY_LEVELS = [
  { value: "FALSE", label: "Faux" },
  { value: "RATHER_FALSE", label: "Plutôt faux" },
  { value: "RATHER_TRUE", label: "Plutôt vrai" },
  { value: "TRUE", label: "Vrai" },
];

module.exports = { ISO_REQUIREMENTS, VERACITY_LEVELS };
