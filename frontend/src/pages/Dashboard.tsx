import { type FunctionComponent } from 'preact';
import { useEffect } from 'preact/hooks';
import { 
  Activity, 
  TrendingUp, 
  Users, 
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Calendar
} from 'lucide-preact';
import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../hooks/useAuth';
import { useChartData } from '../hooks/useChartData';
import { ProductionChart, QualiteChart, MaintenanceChart } from '../components/charts';
import { showToast } from '../utils/toast';

export const Dashboard: FunctionComponent = () => {
  const { data, loading, error, periode, setPeriode, refresh, lastUpdate } = useDashboard();
  const { user } = useAuth();
  const { productionData, qualiteData, maintenanceData } = useChartData(data);

  // Toast de bienvenue
  useEffect(() => {
    if (user) {
      showToast.success(`Bonjour ${user.nom_prenom} !`);
    }
  }, [user]);

  // Formatage de la dernière mise à jour
  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Jamais';
    return lastUpdate.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center bg-red-50 p-8 rounded-lg">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur de chargement</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={refresh}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec période et rafraîchissement */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-1">
            Dernière mise à jour : {formatLastUpdate()}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Sélecteur de période */}
          <div className="flex space-x-2 bg-white rounded-lg shadow-sm p-1">
            {(['jour', 'semaine', 'mois', 'annee'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriode(p)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center space-x-1 ${
                  periode === p
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>{p.charAt(0).toUpperCase() + p.slice(1)}</span>
              </button>
            ))}
          </div>

          {/* Bouton rafraîchir */}
          <button
            onClick={refresh}
            disabled={loading}
            className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Cartes de statistiques principales */}
      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Production */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  {data.production.rendement}%
                </span>
              </div>
              <h3 className="text-sm text-gray-500 mb-1">Commandes</h3>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold text-gray-800">
                  {data.production.commandes.commandes_en_cours}
                </span>
                <span className="ml-2 text-sm text-gray-500">en cours</span>
              </div>
              <div className="mt-3 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">
                  {data.production.taux_avancement}%
                </span>
                <span className="text-gray-500 ml-1">avancement</span>
              </div>
            </div>

            {/* Maintenance */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                {data.maintenance.machines.machines_panne > 0 && (
                  <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                    {data.maintenance.machines.machines_panne} en panne
                  </span>
                )}
              </div>
              <h3 className="text-sm text-gray-500 mb-1">Maintenance</h3>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold text-gray-800">
                  {data.maintenance.disponibilite}%
                </span>
                <span className="ml-2 text-sm text-gray-500">disponibilité</span>
              </div>
              <div className="mt-3 flex justify-between text-sm">
                <span className="text-yellow-600">
                  {data.maintenance.interventions.interventions_en_cours} en cours
                </span>
                <span className="text-orange-600">
                  {data.maintenance.interventions.interventions_attente} en attente
                </span>
              </div>
            </div>

            {/* Qualité */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  {data.qualite.taux_conformite}%
                </span>
              </div>
              <h3 className="text-sm text-gray-500 mb-1">Taux de conformité</h3>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold text-gray-800">
                  {data.qualite.taux_conformite}%
                </span>
              </div>
              <div className="mt-3 flex justify-between text-sm">
                <span className="text-gray-600">
                  {data.qualite.qualite.total_controles} contrôles
                </span>
                <span className="text-red-600">
                  {data.qualite.defauts.total_defauts} défauts
                </span>
              </div>
            </div>

            {/* Employés */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                  {data.rh.taux_presence}%
                </span>
              </div>
              <h3 className="text-sm text-gray-500 mb-1">Employés</h3>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold text-gray-800">
                  {data.rh.pointage.presents}
                </span>
                <span className="ml-2 text-sm text-gray-500">présents</span>
              </div>
              <div className="mt-3 flex justify-between text-sm">
                <span className="text-gray-600">
                  Total: {data.rh.personnel.total_personnel}
                </span>
                <span className="text-red-600">
                  {data.rh.pointage.absents} absents
                </span>
              </div>
            </div>
          </div>

          {/* Section Graphiques */}
          <div className="mt-8">
           <h2 className="text-xl font-bold text-gray-800 mb-6">Visualisation des données</h2>
           
           {/* Grille 2x2 pour les graphiques */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
             {/* Production - Haut gauche */}
             <ProductionChart data={productionData} loading={loading} />
             
             {/* Qualité - Haut droit */}
             <QualiteChart data={qualiteData} loading={loading} />
           </div>
           
           {/* Maintenance - Bas (fusionné) */}
           <div className="grid grid-cols-1">
             <MaintenanceChart data={maintenanceData} loading={loading} />
           </div>
          </div>

          {/* Alertes */}
          {data.maintenance.machines.machines_panne > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    Alertes maintenance
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    {data.maintenance.machines.machines_panne} machine(s) en panne
                  </p>
                </div>
              </div>
            </div>
          )}
          </>
          )}
          </div>
          );
          };

export default Dashboard;