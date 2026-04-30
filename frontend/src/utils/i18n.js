export const languageLabels = {
  fr: "FR",
  en: "EN",
  bi: "FR/EN",
};

export function t(language, fr, en) {
  if (language === "fr") return fr;
  if (language === "en") return en;
  return `${fr} / ${en}`;
}
