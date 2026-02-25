import type { FunctionalComponent } from 'preact';
import { Router } from 'preact-router';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';

import { Commandes } from './pages/production/Commandes';
import { CommandeDetail } from './pages/production/CommandeDetail';
import { NouvelleCommande } from './pages/production/NouvelleCommande';
import { Semaines } from './pages/production/Semaines';
import { AffectationsGestion } from './pages/production/AffectationsGestion';
import PlanningManuel from './pages/planning/manuel/PlanningManuel';
import AnalyseCharge from './pages/planning/analyse/AnalyseCharge';
import SuiviRealisation from './pages/planning/realisation/SuiviRealisation';

import { Articles } from './pages/articles/Articles';
import { ArticleDetail } from './pages/articles/ArticleDetail';
import { ArticleGestion } from './pages/articles/ArticleGestion';

import { Machines } from './pages/maintenance/Machines';
import { MachineDetail } from './pages/maintenance/MachineDetail';
import { NouvelleMachine } from './pages/maintenance/NouvelleMachine';
import { Interventions } from './pages/maintenance/Interventions';
import { InterventionDetail } from './pages/maintenance/InterventionDetail';
import { NouvelleIntervention } from './pages/maintenance/NouvelleIntervention';
import { MaintenanceDashboard } from './pages/maintenance/MaintenanceDashboard';
import { TypesMachine } from './pages/maintenance/TypesMachine';
import { DefautsTypeMachine } from './pages/maintenance/DefautsTypeMachine';

import PersonnelDashboard from './pages/personnel/PersonnelDashboard';
import PersonnelEdit from './pages/personnel/PersonnelEdit';
import Horaires from './pages/personnel/Horaires';
import Pointage from './pages/personnel/Pointage';
import PostesGestion from './pages/personnel/PostesGestion';
import { SettingsPage } from './pages/Settings';
import AdminPanelPage from './pages/admin/AdminPanel';

import { ReferentielDefauts, NonConformitesProduction } from './pages/qualite';

export const App: FunctionalComponent = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Router>
        <PublicRoute path="/login" component={Login} restricted={true} />

        <ProtectedRoute path="/" component={Layout}>
          <Dashboard path="/" />
        </ProtectedRoute>

        <ProtectedRoute path="/production/commandes" component={Layout}>
          <Commandes path="/" />
        </ProtectedRoute>
        <ProtectedRoute path="/production/commandes/nouveau" component={Layout}>
          <NouvelleCommande path="/" />
        </ProtectedRoute>
        <ProtectedRoute path="/production/commandes/:id" component={Layout}>
          <CommandeDetail path="/" />
        </ProtectedRoute>
        <ProtectedRoute path="/production/planning" component={Layout}>
          <PlanningManuel path="/" />
        </ProtectedRoute>
        <ProtectedRoute path="/production/planning/manuel" component={Layout}>
          <PlanningManuel path="/" />
        </ProtectedRoute>
        <ProtectedRoute path="/production/planning/analyse" component={Layout}>
          <AnalyseCharge path="/" />
        </ProtectedRoute>
        <ProtectedRoute path="/planning/manuel" component={Layout}>
          <PlanningManuel path="/" />
        </ProtectedRoute>
        <ProtectedRoute path="/planning/realisation" component={Layout}>
          <SuiviRealisation path="/" />
        </ProtectedRoute>
        <ProtectedRoute path="/planification/auto" component={Layout}>
          <PlanningManuel path="/" />
        </ProtectedRoute>
        <ProtectedRoute path="/planning/analyse" component={Layout}>
          <AnalyseCharge path="/" />
        </ProtectedRoute>
        <ProtectedRoute path="/production/planification-facturation" component={Layout}>
          <PlanningManuel path="/" />
        </ProtectedRoute>
        <ProtectedRoute path="/production/affectations" component={Layout}>
          <AffectationsGestion path="/" />
        </ProtectedRoute>
        <ProtectedRoute path="/production/semaines" component={Layout}>
          <Semaines path="/" />
        </ProtectedRoute>

        <ProtectedRoute path="/articles" component={Layout}>
          <Articles path="/" />
        </ProtectedRoute>
        <ProtectedRoute path="/articles/gestion" component={Layout}>
          <ArticleGestion path="/" />
        </ProtectedRoute>
        <ProtectedRoute path="/articles/gestion/:id" component={Layout}>
          <ArticleGestion path="/" />
        </ProtectedRoute>
        <ProtectedRoute path="/articles/:id" component={Layout}>
          <ArticleDetail path="/" />
        </ProtectedRoute>

        <ProtectedRoute path="/maintenance/dashboard" component={Layout}>
          <MaintenanceDashboard path="/" />
        </ProtectedRoute>
        <ProtectedRoute path="/maintenance/machines" component={Layout}>
          <Machines path="/" />
        </ProtectedRoute>
        <ProtectedRoute path="/maintenance/types-machine" component={Layout}>
          <TypesMachine path="/" />
        </ProtectedRoute>
        <ProtectedRoute path="/maintenance/defauts-type-machine" component={Layout}>
          <DefautsTypeMachine path="/" />
        </ProtectedRoute>
        <ProtectedRoute path="/maintenance/machines/nouveau" component={Layout}>
          <NouvelleMachine path="/" />
        </ProtectedRoute>
        <ProtectedRoute path="/maintenance/machines/:id" component={Layout}>
          <MachineDetail path="/" />
        </ProtectedRoute>
        <ProtectedRoute path="/maintenance/interventions" component={Layout}>
          <Interventions path="/" />
        </ProtectedRoute>
        <ProtectedRoute path="/maintenance/interventions/nouveau" component={Layout}>
          <NouvelleIntervention path="/" />
        </ProtectedRoute>
        <ProtectedRoute path="/maintenance/interventions/:id" component={Layout}>
          <InterventionDetail path="/" />
        </ProtectedRoute>
        <ProtectedRoute path="/maintenance/interventions/:id/modifier" component={Layout}>
          <NouvelleIntervention path="/" />
        </ProtectedRoute>

        <ProtectedRoute path="/personnel" component={Layout}>
          <PersonnelDashboard path="/" />
        </ProtectedRoute>
        <ProtectedRoute path="/personnel/:id/edit" component={Layout}>
          <PersonnelEdit path="/" />
        </ProtectedRoute>
        <ProtectedRoute path="/personnel/horaires" component={Layout}>
          <Horaires path="/" />
        </ProtectedRoute>
        <ProtectedRoute path="/personnel/pointage" component={Layout}>
          <Pointage path="/" />
        </ProtectedRoute>
        <ProtectedRoute path="/personnel/postes" component={Layout}>
          <PostesGestion path="/" />
        </ProtectedRoute>

        <ProtectedRoute path="/qualite/referentiel-defauts" component={Layout}>
          <ReferentielDefauts path="/" />
        </ProtectedRoute>
        <ProtectedRoute path="/qualite/non-conformites-production" component={Layout}>
          <NonConformitesProduction path="/" />
        </ProtectedRoute>

        <ProtectedRoute path="/settings" component={Layout}>
          <SettingsPage path="/" />
        </ProtectedRoute>
        <ProtectedRoute path="/admin" component={Layout}>
          <AdminPanelPage path="/" />
        </ProtectedRoute>
      </Router>
    </div>
  );
};

export default App;

