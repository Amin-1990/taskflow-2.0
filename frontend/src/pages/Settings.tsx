import type { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { showToast } from '../utils/toast';
import {
  DEFAULT_LAYOUT_THEME,
  applyLayoutTheme,
  getStoredLayoutTheme,
  sanitizeLayoutTheme,
  saveLayoutTheme,
  type LayoutTheme,
} from '../utils/layoutTheme';

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

const ColorField: FunctionComponent<{
  label: string;
  value: string;
  onChange: (next: string) => void;
}> = ({ label, value, onChange }) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onInput={(event) => onChange((event.currentTarget as HTMLInputElement).value.toUpperCase())}
          className="h-10 w-14 cursor-pointer rounded border border-gray-300 bg-white p-1"
        />
        <input
          type="text"
          value={value}
          onInput={(event) => onChange((event.currentTarget as HTMLInputElement).value.toUpperCase())}
          placeholder="#FFFFFF"
          className={inputClass}
        />
      </div>
    </div>
  );
};

export const SettingsPage: FunctionComponent = () => {
  const [theme, setTheme] = useState<LayoutTheme>(getStoredLayoutTheme());

  const updateTheme = (key: keyof LayoutTheme, value: string) => {
    setTheme((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleApply = () => {
    const sanitized = sanitizeLayoutTheme(theme);
    setTheme(sanitized);
    saveLayoutTheme(sanitized);
    applyLayoutTheme(sanitized);
    showToast.success('Couleurs appliquees');
  };

  const handleReset = () => {
    setTheme(DEFAULT_LAYOUT_THEME);
    saveLayoutTheme(DEFAULT_LAYOUT_THEME);
    applyLayoutTheme(DEFAULT_LAYOUT_THEME);
    showToast.info('Theme reinitialise');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Parametres d apparence</h1>
        <p className="text-sm text-gray-500 mt-1">
          Choisissez manuellement les couleurs du header, du sidebar et de leur texte.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Header</h2>
          <ColorField
            label="Couleur de fond"
            value={theme.headerBg}
            onChange={(next) => updateTheme('headerBg', next)}
          />
          <ColorField
            label="Couleur du texte"
            value={theme.headerText}
            onChange={(next) => updateTheme('headerText', next)}
          />
          <div className="rounded-lg p-4 border border-gray-200" style={{ backgroundColor: theme.headerBg, color: theme.headerText }}>
            Apercu du header
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Sidebar</h2>
          <ColorField
            label="Couleur de fond"
            value={theme.sidebarBg}
            onChange={(next) => updateTheme('sidebarBg', next)}
          />
          <ColorField
            label="Couleur du texte"
            value={theme.sidebarText}
            onChange={(next) => updateTheme('sidebarText', next)}
          />
          <div className="rounded-lg p-4 border border-gray-200" style={{ backgroundColor: theme.sidebarBg, color: theme.sidebarText }}>
            Apercu du sidebar
          </div>
        </section>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleApply}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          Appliquer
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 text-sm font-medium hover:bg-gray-300"
        >
          Reinitialiser
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;

