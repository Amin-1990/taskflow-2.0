# Composant Standard de Page Header

## Contexte
Actuellement, les pages de l'application utilisent des approches variées pour les en-têtes :
- Pages comme `Articles.tsx` utilisent une implémentation directe avec des div flex
- Pages comme `PersonnelDashboard.tsx`, `Commandes.tsx` et `Interventions.tsx` utilisent le composant `PageHeader` existant

Cela crée une incohérence visuelle et du code dupliqué. Ce plan propose un composant standardisé.

## Projet de Composant

### Fonctionnalités Clés
Le composant standard devra inclure :
1. **Titre principal** - Texte clair et prominent
2. **Sous-titre** - Information contextuelle (ex: nombre d'enregistrements)
3. **Actions standardisées** :
   - **Importer** - Bouton pour importer des données via fichier Excel/CSV
   - **Exporter** - Bouton pour exporter les données en Excel/CSV
   - **Template** - Bouton pour télécharger le template d'import
   - **Actualiser** - Bouton pour rafraîchir les données
4. **Actions spécifiques** - Support pour ajouter des boutons personnalisés

### Interface du Composant
```typescript
interface PageHeaderProps extends JSX.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  eyebrow?: ComponentChildren;
  actions?: ComponentChildren;
  showImport?: boolean;
  showExport?: boolean;
  showTemplate?: boolean;
  showRefresh?: boolean;
  onImport?: () => void;
  onExport?: () => void;
  onTemplate?: () => void;
  onRefresh?: () => void;
  isImporting?: boolean;
  isExporting?: boolean;
  isDownloadingTemplate?: boolean;
  isRefreshing?: boolean;
}
```

### Implémentation
```typescript
import { h } from 'preact';
import type { ComponentChildren, FunctionalComponent, JSX } from 'preact';
import { Download, Upload, RefreshCw } from 'lucide-preact';
import ActionButton from '../components/common/ActionButton';

const cx = (...classes: Array<unknown>) => classes.filter(Boolean).map(String).join(' ');

const PageHeader: FunctionalComponent<PageHeaderProps> = ({
  title,
  subtitle,
  eyebrow,
  actions,
  showImport = false,
  showExport = false,
  showTemplate = false,
  showRefresh = false,
  onImport,
  onExport,
  onTemplate,
  onRefresh,
  isImporting = false,
  isExporting = false,
  isDownloadingTemplate = false,
  isRefreshing = false,
  className,
  ...props
}) => {
  const standardActions = [];
  
  if (showTemplate && onTemplate) {
    standardActions.push(
      <ActionButton 
        key="template"
        onClick={onTemplate} 
        loading={isDownloadingTemplate} 
        icon={Download}
      >
        {isDownloadingTemplate ? 'Template...' : 'Template'}
      </ActionButton>
    );
  }
  
  if (showImport && onImport) {
    standardActions.push(
      <ActionButton 
        key="import"
        onClick={onImport} 
        loading={isImporting} 
        icon={Upload}
      >
        {isImporting ? 'Import...' : 'Importer'}
      </ActionButton>
    );
  }
  
  if (showExport && onExport) {
    standardActions.push(
      <ActionButton 
        key="export"
        onClick={onExport} 
        loading={isExporting} 
        icon={Download}
      >
        {isExporting ? 'Export...' : 'Exporter'}
      </ActionButton>
    );
  }
  
  if (showRefresh && onRefresh) {
    standardActions.push(
      <ActionButton 
        key="refresh"
        onClick={onRefresh} 
        loading={isRefreshing} 
        icon={RefreshCw}
      >
        {isRefreshing ? 'Actualisation...' : 'Actualiser'}
      </ActionButton>
    );
  }

  return h(
    'header',
    {
      ...props,
      className: cx('flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between', className),
    },
    h(
      'div',
      null,
      eyebrow ? h('div', { className: 'mb-1 text-sm text-gray-500' }, eyebrow) : null,
      h('h1', { className: 'text-2xl font-semibold tracking-tight text-gray-900' }, title),
      subtitle ? h('p', { className: 'mt-1 text-sm text-gray-500' }, subtitle) : null
    ),
    h('div', { className: 'flex flex-wrap items-center gap-2' }, [
      ...standardActions,
      actions
    ])
  );
};

export default PageHeader;
```

### Avantages
1. **Standardisation** - Toutes les pages auront un look cohérent
2. **Réutilisabilité** - Réduction du code dupliqué
3. **Facilité de maintenance** - Modifications centralisées
4. **Support des états de chargement** - Indicateurs de progression pour chaque action
5. **Flexibilité** - Actions standardisées + support pour actions personnalisées
6. **Responsive** - Adaptation mobile/desktop

### Exemple d'Utilisation
```typescript
import PageHeader from '../components/common/PageHeader';

const MyPage = () => {
  return (
    <PageHeader
      title="Gestion des Articles"
      subtitle={`Total: ${total} article${total > 1 ? 's' : ''}`}
      showImport={canWrite('ARTICLES')}
      showExport={true}
      showTemplate={canWrite('ARTICLES')}
      showRefresh={true}
      onImport={handleImportClick}
      onExport={handleExportXLSX}
      onTemplate={handleDownloadTemplate}
      onRefresh={refreshData}
      isImporting={isImporting}
      isExporting={isExporting}
      isDownloadingTemplate={isDownloadingTemplate}
      isRefreshing={isRefreshing}
      actions={
        <ActionButton onClick={openCreateModal} icon={Plus} variant="accent">
          Nouvel article
        </ActionButton>
      }
    />
  );
};
```

### Pages à Mettre à Jour

#### Pages déjà utilisant PageHeader (12 pages)
1. `frontend/src/pages/qualite/NonConformitesProduction.tsx` - **AVEC MODAL** (formulaire)
2. `frontend/src/pages/qualite/ReferentielDefauts.tsx` - **AVEC MODAL** (formulaire)
3. `frontend/src/pages/production/Planning.tsx` - **AVEC MODAL** (article, edit cellule)
4. `frontend/src/pages/production/Semaines.tsx` - **AVEC MODAL** (import, ajout semaine)
5. `frontend/src/pages/production/Commandes.tsx` - **AVEC MODAL** (nouvelle commande)
6. `frontend/src/pages/production/AffectationsGestion.tsx` - **AVEC MODAL** (ajout affectation)
7. `frontend/src/pages/maintenance/Machines.tsx` - **AVEC MODAL** (formulaire machine)
8. `frontend/src/pages/maintenance/TypesMachine.tsx` - **AVEC MODAL** (formulaire type)
9. `frontend/src/pages/personnel/PostesGestion.tsx` - **AVEC MODAL** (formulaire poste)
10. `frontend/src/pages/maintenance/Interventions.tsx` - **AVEC MODAL** (formulaire, details, suppression)
11. `frontend/src/pages/personnel/PersonnelDashboard.tsx` - **AVEC MODAL** (formulaire personnel)
12. `frontend/src/pages/maintenance/DefautsTypeMachine.tsx` - **AVEC MODAL** (formulaire defaut)

#### Pages avec implémentation directe (25 pages)
1. `frontend/src/pages/Settings.tsx`
2. `frontend/src/pages/production/PlanningAnalyse.tsx`
3. `frontend/src/pages/production/PlanificationFacturation.tsx` - **AVEC MODAL** (details commande)
4. `frontend/src/pages/production/NouvelleCommande.tsx` (page独立的)
5. `frontend/src/pages/production/CommandeDetail.tsx` (page detail)
6. `frontend/src/pages/production/AffectationsTemps.tsx` (page独立的)
7. `frontend/src/pages/planning/realisation/SuiviRealisation.tsx`
8. `frontend/src/pages/planning/manuel/PlanningManuel.tsx`
9. `frontend/src/pages/planning/analyse/AnalyseCharge.tsx`
10. `frontend/src/pages/maintenance/NouvelleMachine.tsx` (page独立的)
11. `frontend/src/pages/maintenance/NouvelleIntervention.tsx` (page独立的)
12. `frontend/src/pages/maintenance/MaintenanceDashboard.tsx` (dashboard)
13. `frontend/src/pages/maintenance/MachineDetail.tsx` (page detail)
14. `frontend/src/pages/maintenance/InterventionDetail.tsx` (page detail)
15. `frontend/src/pages/Dashboard.tsx` (dashboard)
16. `frontend/src/pages/articles/Articles.tsx` - **AVEC MODAL** (nouveau, edition, suppression)
17. `frontend/src/pages/articles/ArticleGestion.tsx` (page formulaire)
18. `frontend/src/pages/articles/ArticleDetail.tsx` - **AVEC MODAL** (suppression)
19. `frontend/src/pages/admin/AdminUsers.tsx` - **AVEC MODAL** (creation utilisateur)
20. `frontend/src/pages/admin/AdminUserCreate.tsx` (page formulaire)
21. `frontend/src/pages/admin/AdminSessions.tsx`
22. `frontend/src/pages/admin/AdminMatrice.tsx`
23. `frontend/src/pages/admin/AdminDashboard.tsx` (dashboard)
24. `frontend/src/pages/admin/AdminAudit.tsx`
25. `frontend/src/pages/personnel/PersonnelDashboard.tsx` - **AVEC MODAL** (deja listé ci-dessus)
26. `frontend/src/pages/personnel/Pointage.tsx` - **AVEC MODAL** (edition pointage)
27. `frontend/src/pages/personnel/Horaires.tsx` - **AVEC MODAL** (edition horaire)

**Note Importante sur les Modals** :
- Les modals utilisent le composant `Modal` existant avec la prop `title`
- Ou utilisent des implémentations custom avec `<h3>` (comme Articles.tsx)
- Ces headers de modal NE SONT PAS à remplacer par le PageHeader
- Le PageHeader est uniquement pour le header PRINCIPAL de chaque page
- Les pages avec "(page独立的)" sont des pages completes sans liste principale

### Réalisations d'Intégration
1. Mise à jour du composant `PageHeader` existant avec les nouvelles fonctionnalités
2. Remplacement de l'implémentation directe dans `Articles.tsx`
3. Mise à jour des 12 pages déjà utilisant PageHeader pour utiliser les nouveaux props
4. Conversion des pages avec implémentation directe vers le composant PageHeader
5. **Conservation des modals existants** - ils utilisent déjà leur propre structure
6. Documentation des props et des patterns d'utilisation

### Fichiers à Modifier
- `frontend/src/components/common/PageHeader.tsx` - Mise à jour du composant
- `frontend/src/pages/articles/Articles.tsx` - Remplacement de l'implémentation directe
- `frontend/src/pages/personnel/PersonnelDashboard.tsx` - Utilisation du nouveau composant
- `frontend/src/pages/production/Commandes.tsx` - Utilisation du nouveau composant
- `frontend/src/pages/maintenance/Interventions.tsx` - Utilisation du nouveau composant
