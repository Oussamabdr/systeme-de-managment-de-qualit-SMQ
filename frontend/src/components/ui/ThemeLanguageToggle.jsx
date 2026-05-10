import { Moon, Sun, Globe } from "lucide-react";
import { languageLabels, t } from "../../utils/i18n";

export default function ThemeLanguageToggle({ 
  theme, 
  setTheme, 
  language, 
  setLanguage,
  variant = "compact" 
}) {
  const text = (fr, en) => t(language, fr, en);

  if (variant === "compact") {
    // Compact floating buttons - ideal for login page
    return (
      <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 backdrop-blur-sm px-1 py-1 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80">
        {/* Theme Toggle */}
        <div className="flex items-center rounded-full bg-slate-100/50 p-0.5 dark:bg-slate-800/50">
          <button
            type="button"
            aria-label={text("Theme clair", "Light theme")}
            onClick={() => setTheme("light")}
            className={`p-2 rounded-full transition-all duration-200 ${
              theme === "light"
                ? "bg-white text-yellow-500 shadow-sm dark:bg-slate-700 dark:text-yellow-400"
                : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            }`}
          >
            <Sun size={16} strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label={text("Theme sombre", "Dark theme")}
            onClick={() => setTheme("dark")}
            className={`p-2 rounded-full transition-all duration-200 ${
              theme === "dark"
                ? "bg-slate-700 text-blue-400 shadow-sm dark:bg-slate-900 dark:text-blue-300"
                : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            }`}
          >
            <Moon size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Separator */}
        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />

        {/* Language Toggle */}
        <div className="flex items-center gap-1 px-1">
          <Globe size={15} className="text-slate-500 dark:text-slate-400" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label={text("Langue", "Language")}
            className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer appearance-none focus:outline-none px-1"
          >
            {Object.entries(languageLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  if (variant === "expanded") {
    // Expanded version for header with more visual space
    return (
      <div className="flex items-center gap-3">
        {/* Theme Toggle Group */}
        <div className="flex items-center rounded-lg border border-slate-200/80 bg-slate-50 p-1.5 dark:border-slate-700/80 dark:bg-slate-800/50">
          <button
            type="button"
            aria-label={text("Theme clair", "Light theme")}
            onClick={() => setTheme("light")}
            className={`p-2 rounded-md transition-all duration-200 ${
              theme === "light"
                ? "bg-white text-yellow-500 shadow-sm dark:bg-slate-700 dark:text-yellow-400"
                : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            }`}
            title={text("Theme clair", "Light theme")}
          >
            <Sun size={18} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            aria-label={text("Theme sombre", "Dark theme")}
            onClick={() => setTheme("dark")}
            className={`p-2 rounded-md transition-all duration-200 ${
              theme === "dark"
                ? "bg-slate-700 text-blue-400 shadow-sm dark:bg-slate-900 dark:text-blue-300"
                : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            }`}
            title={text("Theme sombre", "Dark theme")}
          >
            <Moon size={18} strokeWidth={1.8} />
          </button>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50 px-3 py-2 dark:border-slate-700/80 dark:bg-slate-800/50">
          <Globe size={16} className="text-slate-500 dark:text-slate-400" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label={text("Langue", "Language")}
            className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer appearance-none focus:outline-none min-w-20"
          >
            {Object.entries(languageLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  // Minimal variant - icons only
  return (
    <div className="flex items-center gap-1 rounded-lg border border-slate-200/80 bg-slate-50 p-1 dark:border-slate-700/80 dark:bg-slate-800/50">
      <button
        type="button"
        aria-label={text("Theme clair", "Light theme")}
        onClick={() => setTheme("light")}
        className={`p-2 rounded transition-colors ${
          theme === "light" ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <Sun size={16} strokeWidth={2} />
      </button>
      <button
        type="button"
        aria-label={text("Theme sombre", "Dark theme")}
        onClick={() => setTheme("dark")}
        className={`p-2 rounded transition-colors ${
          theme === "dark" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <Moon size={16} strokeWidth={2} />
      </button>
    </div>
  );
}
