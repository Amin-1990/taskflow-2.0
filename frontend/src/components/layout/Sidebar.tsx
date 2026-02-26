import type { FunctionComponent } from 'preact';
import { route } from 'preact-router';
import { useState } from 'preact/hooks';
import {
  LayoutDashboard,
  Factory,
  Wrench,
  Users,
  ClipboardCheck,
  Settings,
  LogOut,
  ChevronDown,
  Package,
  Calendar,
  Clock3,
  BarChart3,
  Activity,
  Zap,
  CalendarDays,
  Box,
  UserCheck,
  Shield,
  Lock,
  Key,
  Monitor,
  History
} from 'lucide-preact';
import { ROUTES } from '../../constants';
import { logout as apiLogout } from '../../services/api';

interface SubMenuItem {
  icon: any;
  label: string;
  path: string;
}

interface MenuItem {
  icon: any;
  label: string;
  path?: string;
  subItems?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: ROUTES.DASHBOARD },
  {
    icon: Factory,
    label: 'Production',
    subItems: [
      { icon: Package, label: 'Commandes', path: ROUTES.PRODUCTION_COMMANDES },
      { icon: Calendar, label: 'Planning', path: ROUTES.PLANNING_MANUEL },
      { icon: Clock3, label: 'Suivi realisation', path: ROUTES.PLANNING_REALISATION },
      { icon: Activity, label: 'Analyse charge', path: ROUTES.PLANNING_ANALYSE },
      { icon: Clock3, label: 'Affectations', path: ROUTES.PRODUCTION_AFFECTATIONS },
      { icon: CalendarDays, label: 'Semaines', path: '/production/semaines' },
      { icon: BarChart3, label: 'Indicateurs', path: '/production/indicateurs' }
    ]
  },
  {
    icon: Box,
    label: 'Articles',
    subItems: [
      { icon: Package, label: 'Liste articles', path: '/articles' },
      { icon: Settings, label: 'Gestion des articles', path: '/articles/gestion' }
    ]
  },
  {
    icon: Wrench,
    label: 'Maintenance',
    subItems: [
      { icon: Activity, label: 'Tableau de bord', path: ROUTES.MAINTENANCE_DASHBOARD },
      { icon: Package, label: 'Machines', path: ROUTES.MAINTENANCE_MACHINES },
      { icon: Settings, label: 'Types machine', path: ROUTES.MAINTENANCE_TYPES_MACHINE },
      { icon: ClipboardCheck, label: 'Defauts machine', path: ROUTES.MAINTENANCE_DEFAUTS_TYPE_MACHINE },
      { icon: Zap, label: 'Interventions', path: ROUTES.MAINTENANCE_INTERVENTIONS }
    ]
  },
  {
    icon: Users,
    label: 'Ressources Humaines',
    subItems: [
      { icon: UserCheck, label: 'Personnel', path: ROUTES.PERSONNEL },
      { icon: Settings, label: 'Gestion postes', path: ROUTES.PERSONNEL_POSTES },
      { icon: Calendar, label: 'Horaires', path: ROUTES.PERSONNEL_HORAIRES },
      { icon: Clock3, label: 'Pointage', path: ROUTES.PERSONNEL_POINTAGE }
    ]
  },
  {
    icon: ClipboardCheck,
    label: 'Qualite',
    subItems: [
      { icon: ClipboardCheck, label: 'Referentiel des defauts', path: ROUTES.QUALITY_REFERENTIEL_DEFAUTS },
      { icon: Activity, label: 'Non conformites production', path: ROUTES.QUALITY_NON_CONFORMITES }
    ]
  },
  {
    icon: Shield,
    label: 'Administration',
    subItems: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
      { icon: Users, label: 'Utilisateurs', path: '/admin/utilisateurs' },
      { icon: Key, label: 'Matrice permissions', path: '/admin/matrice' },
      { icon: Monitor, label: 'Sessions', path: '/admin/sessions' },
      { icon: History, label: 'Audit', path: '/admin/audit' }
    ]
  },
  { icon: Settings, label: 'Parametres', path: ROUTES.SETTINGS }
];

export const Sidebar: FunctionComponent = () => {
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const handleNavigation = (path: string) => {
    route(path);
  };

  const handleLogout = () => {
    apiLogout();
  };

  const toggleMenu = (label: string) => {
    setExpandedMenu(expandedMenu === label ? null : label);
  };

  const currentPath = window.location.pathname;
  const isPathMatch = (routePath: string, path: string) => {
    const routeParts = routePath.split('/').filter(Boolean);
    const pathParts = path.split('/').filter(Boolean);

    if (routeParts.length !== pathParts.length) return false;

    for (let i = 0; i < routeParts.length; i += 1) {
      const routePart = routeParts[i];
      const pathPart = pathParts[i];

      if (routePart.startsWith(':')) {
        // Convention locale: :id représente un identifiant numérique
        if (routePart === ':id') {
          if (!/^\d+$/.test(pathPart)) return false;
        } else if (!pathPart) {
          return false;
        }
      } else if (routePart !== pathPart) {
        return false;
      }
    }

    return true;
  };

  const isMenuActive = (item: MenuItem) => {
    if (item.path) return currentPath === item.path;
    if (item.subItems) {
      return item.subItems.some((sub) => isPathMatch(sub.path, currentPath));
    }
    return false;
  };

  return (
    <aside
      className="w-64 shadow-lg flex flex-col h-screen fixed left-0 top-0"
      style={{ backgroundColor: 'var(--layout-sidebar-bg)', color: 'var(--layout-sidebar-text)' }}
    >
      <div className="p-6 border-b" style={{ borderColor: 'var(--layout-sidebar-hover-bg)' }}>
        <h2 className="text-2xl font-bold">Taskflow</h2>
        <p className="text-xs mt-1" style={{ color: 'var(--layout-sidebar-text-muted)' }}>Gestion de production</p>
      </div>

      <nav className="flex-1 py-6 overflow-y-auto">
        {menuItems.map((item) => (
          <div key={item.label}>
            {item.subItems ? (
              <>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={`layout-sidebar-hover w-full flex items-center justify-between px-6 py-3 transition-colors ${
                    isMenuActive(item) ? 'layout-sidebar-active border-r-4 border-current' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon className="w-5 h-5 mr-3" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      expandedMenu === item.label ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {expandedMenu === item.label && (
                  <div className="border-l-2" style={{ backgroundColor: 'var(--layout-sidebar-submenu-bg)', borderColor: 'var(--layout-sidebar-hover-bg)' }}>
                    {item.subItems.map((subItem) => (
                      <button
                        key={subItem.path}
                        onClick={() => handleNavigation(subItem.path)}
                        className={`w-full flex items-center px-10 py-2.5 text-sm transition-colors ${
                          isPathMatch(subItem.path, currentPath)
                            ? 'layout-sidebar-active font-medium'
                            : 'layout-sidebar-hover'
                        }`}
                      >
                        <subItem.icon className="w-4 h-4 mr-2" />
                        <span>{subItem.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => handleNavigation(item.path!)}
                className={`layout-sidebar-hover w-full flex items-center px-6 py-3 transition-colors ${
                  currentPath === item.path ? 'layout-sidebar-active border-r-4 border-current' : ''
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            )}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t" style={{ borderColor: 'var(--layout-sidebar-hover-bg)' }}>
        <button
          onClick={handleLogout}
          className="layout-sidebar-hover w-full flex items-center px-4 py-2 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="text-sm font-medium">Deconnexion</span>
        </button>
      </div>
    </aside>
  );
};


