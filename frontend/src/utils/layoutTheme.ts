export interface LayoutTheme {
  headerBg: string;
  headerText: string;
  sidebarBg: string;
  sidebarText: string;
}

const STORAGE_KEY = 'layout_theme';

export const DEFAULT_LAYOUT_THEME: LayoutTheme = {
  headerBg: '#C7BBFB',
  headerText: '#FFFFFF',
  sidebarBg: '#C7BBFB',
  sidebarText: '#FFFFFF',
};

const HEX_COLOR_REGEX = /^#([0-9A-F]{6})$/i;

const normalizeHexColor = (value: string, fallback: string): string => {
  const normalized = String(value || '').trim().toUpperCase();
  return HEX_COLOR_REGEX.test(normalized) ? normalized : fallback;
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const safeHex = normalizeHexColor(hex, '');
  if (!HEX_COLOR_REGEX.test(safeHex)) return null;

  return {
    r: parseInt(safeHex.slice(1, 3), 16),
    g: parseInt(safeHex.slice(3, 5), 16),
    b: parseInt(safeHex.slice(5, 7), 16),
  };
};

const withAlpha = (hex: string, alpha: number, fallback: string): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return fallback;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

export const sanitizeLayoutTheme = (theme: Partial<LayoutTheme>): LayoutTheme => ({
  headerBg: normalizeHexColor(theme.headerBg || '', DEFAULT_LAYOUT_THEME.headerBg),
  headerText: normalizeHexColor(theme.headerText || '', DEFAULT_LAYOUT_THEME.headerText),
  sidebarBg: normalizeHexColor(theme.sidebarBg || '', DEFAULT_LAYOUT_THEME.sidebarBg),
  sidebarText: normalizeHexColor(theme.sidebarText || '', DEFAULT_LAYOUT_THEME.sidebarText),
});

export const getStoredLayoutTheme = (): LayoutTheme => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LAYOUT_THEME;
    return sanitizeLayoutTheme(JSON.parse(raw));
  } catch (_error) {
    return DEFAULT_LAYOUT_THEME;
  }
};

export const saveLayoutTheme = (theme: LayoutTheme): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
};

export const applyLayoutTheme = (theme: LayoutTheme): void => {
  const root = document.documentElement;

  root.style.setProperty('--layout-header-bg', theme.headerBg);
  root.style.setProperty('--layout-header-text', theme.headerText);
  root.style.setProperty('--layout-header-text-muted', withAlpha(theme.headerText, 0.75, 'rgba(255,255,255,0.75)'));
  root.style.setProperty('--layout-header-border', withAlpha(theme.headerText, 0.35, 'rgba(255,255,255,0.35)'));
  root.style.setProperty('--layout-header-hover-bg', withAlpha(theme.headerText, 0.12, 'rgba(255,255,255,0.12)'));

  root.style.setProperty('--layout-sidebar-bg', theme.sidebarBg);
  root.style.setProperty('--layout-sidebar-text', theme.sidebarText);
  root.style.setProperty('--layout-sidebar-text-muted', withAlpha(theme.sidebarText, 0.85, 'rgba(255,255,255,0.85)'));
  root.style.setProperty('--layout-sidebar-hover-bg', withAlpha(theme.sidebarText, 0.12, 'rgba(255,255,255,0.12)'));
  root.style.setProperty('--layout-sidebar-active-bg', withAlpha(theme.sidebarText, 0.2, 'rgba(255,255,255,0.2)'));
  root.style.setProperty('--layout-sidebar-submenu-bg', withAlpha(theme.sidebarText, 0.08, 'rgba(255,255,255,0.08)'));
};

