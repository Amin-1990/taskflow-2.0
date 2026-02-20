/**
 * Composant ProtectedRoute
 * Protège les routes qui nécessitent une authentification
 * Redirige vers /login si l'utilisateur n'est pas connecté
 */

import { cloneElement, toChildArray, type FunctionalComponent } from 'preact';
import { useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { useAuth } from '../hooks/useAuth';

// Props du composant
interface ProtectedRouteProps {
  component: FunctionalComponent<any>;  // Le composant à protéger
  path: string;                          // Le chemin de la route
  [key: string]: any;                     // Autres props à passer au composant
}

/**
 * Composant qui protège une route
 * @param props - Les props du composant
 * @returns Le composant protégé ou une redirection
 */
export const ProtectedRoute: FunctionalComponent<ProtectedRouteProps> = (props) => {
  // Extraire le composant à protéger et les autres props
  const { component: Component, children, ...rest } = props;
  
  // Utiliser le hook d'authentification
  const { isAuthenticated, loading, user } = useAuth();

  /**
   * Effet pour gérer la redirection
   * S'exécute quand loading ou isAuthenticated change
   */
  useEffect(() => {
    // Si le chargement est terminé ET que l'utilisateur n'est pas authentifié
    if (!loading && !isAuthenticated) {
      console.log('🚫 Accès non autorisé, redirection vers login');
      
      // Sauvegarder l'URL demandée pour y revenir après connexion
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      
      // Rediriger vers la page de login
      route('/login', true);
    }
    
    // Si authentifié, on peut logger (optionnel)
    if (isAuthenticated && user) {
      console.log(`✅ Accès autorisé pour ${user.nom_prenom} à ${window.location.pathname}`);
    }
  }, [loading, isAuthenticated, user]);

  /**
   * État de chargement : afficher un spinner
   */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          {/* Spinner animé */}
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Vérification de l'authentification...</p>
          <p className="text-sm text-gray-500 mt-2">Un instant</p>
        </div>
      </div>
    );
  }

  /**
   * Si non authentifié, on ne rend rien (la redirection se fera via useEffect)
   * Mais on pourrait aussi rendre null
   */
  if (!isAuthenticated) {
    return null;
  }

  /**
   * Authentifié : rendre le composant demandé
   * On passe toutes les props (sauf 'component')
   */
  const enhancedChildren = toChildArray(children).map((child: any) => {
    if (child && typeof child === 'object') {
      return cloneElement(child, { ...rest });
    }
    return child;
  });

  return <Component {...rest}>{enhancedChildren}</Component>;
};

/**
 * Version alternative avec render prop
 * Plus flexible si on a besoin de passer des props supplémentaires
 */
export const withProtectedRoute = (Component: FunctionalComponent<any>) => {
  return (props: any) => (
    <ProtectedRoute component={Component} {...props} />
  );
};

/**
 * Composant pour les routes publiques (accessible sans auth)
 * Utile pour la page de login par exemple
 */
interface PublicRouteProps {
  component: FunctionalComponent<any>;
  restricted?: boolean;  // Si true et déjà connecté, redirige vers dashboard
  [key: string]: any;
}

export const PublicRoute: FunctionalComponent<PublicRouteProps> = (props) => {
  const { component: Component, restricted = false, ...rest } = props;
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // Si route restreinte ET déjà connecté, rediriger vers dashboard
    if (!loading && restricted && isAuthenticated) {
      console.log('🔄 Utilisateur déjà connecté, redirection vers dashboard');
      route('/', true);
    }
  }, [loading, restricted, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Pour les routes restreintes, si connecté on ne rend rien (redirection via useEffect)
  if (restricted && isAuthenticated) {
    return null;
  }

  return <Component {...rest} />;
};

export default ProtectedRoute;
