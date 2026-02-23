export const APP_NAME = 'Taskflow 2.0';
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://10.0.1.6:3000/api';

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  OPERATOR: 'operator',
  QUALITY: 'quality',
  MAINTENANCE: 'maintenance',
} as const;

export const ROUTES = {
  DASHBOARD: '/',
  PRODUCTION: '/production/commandes',
  PRODUCTION_COMMANDES: '/production/commandes',
  PRODUCTION_NOUVELLE: '/production/commandes/nouveau',
  PRODUCTION_DETAIL: '/production/commandes/:id',
  PRODUCTION_PLANNING: '/production/planning',
  PLANNING_MANUEL: '/planning/manuel',
  PLANNING_REALISATION: '/planning/realisation',
  PLANNING_AUTO: '/planification/auto',
  PLANNING_ANALYSE: '/planning/analyse',
  PRODUCTION_PLANNING_MANUEL: '/production/planning/manuel',
  PRODUCTION_PLANNING_AUTO: '/production/planning/auto',
  PRODUCTION_PLANNING_ANALYSE: '/production/planning/analyse',
  PRODUCTION_AFFECTATIONS: '/production/affectations',
  PRODUCTION_PLANIFICATION_FACTURATION: '/production/planification-facturation',
  MAINTENANCE_DASHBOARD: '/maintenance/dashboard',
  MAINTENANCE_MACHINES: '/maintenance/machines',
  MAINTENANCE_TYPES_MACHINE: '/maintenance/types-machine',
  MAINTENANCE_DEFAUTS_TYPE_MACHINE: '/maintenance/defauts-type-machine',
  MAINTENANCE_MACHINE_NOUVEAU: '/maintenance/machines/nouveau',
  MAINTENANCE_MACHINE_DETAIL: '/maintenance/machines/:id',
  MAINTENANCE_INTERVENTIONS: '/maintenance/interventions',
  MAINTENANCE_INTERVENTION_NOUVEAU: '/maintenance/interventions/nouveau',
  MAINTENANCE_INTERVENTION_DETAIL: '/maintenance/interventions/:id',
  PERSONNEL: '/personnel',
  PERSONNEL_EDIT: '/personnel/:id/edit',
  PERSONNEL_HORAIRES: '/personnel/horaires',
  PERSONNEL_POINTAGE: '/personnel/pointage',
  PERSONNEL_POSTES: '/personnel/postes',
  QUALITY: '/qualite/referentiel-defauts',
  QUALITY_REFERENTIEL_DEFAUTS: '/qualite/referentiel-defauts',
  QUALITY_NON_CONFORMITES: '/qualite/non-conformites-production',
  RH: '/rh',
  SETTINGS: '/settings',
  LOGIN: '/login',
} as const;

export const COLORS = {
  primary: '#2563eb',
  secondary: '#4b5563',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
} as const;
