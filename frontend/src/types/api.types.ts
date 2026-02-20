/**
 * Types génériques pour les réponses API
 * Basés sur la structure documentée du backend Taskflow
 */

/**
 * Réponse API standard pour les opérations réussies
 * @template T - Le type des données retournées
 * 
 * @example
 * {
 *   "success": true,
 *   "data": { "id": 1, "name": "Article" },
 *   "count": 42,
 *   "message": "Opération réussie"
 * }
 */
export interface ApiResponse<T> {
  success: boolean;      // Indique si l'opération a réussi
  data?: T;              // Les données (optionnel si pas de données)
  count?: number;        // Pour les listes : nombre total d'éléments
  message?: string;      // Message optionnel de l'API
}

/**
 * Réponse API standard pour les erreurs
 * 
 * @example
 * {
 *   "success": false,
 *   "error": "Message d'erreur",
 *   "details": [
 *     { "field": "username", "message": "Champ requis" }
 *   ]
 * }
 */
export interface ApiError {
  success: false;                 // Toujours false pour les erreurs
  error: string;                  // Message d'erreur principal
  details?: Array<{               // Détails supplémentaires (validation)
    field: string;                // Le champ concerné
    message: string;              // Le message pour ce champ
  }>;
}

/**
 * Paramètres de pagination pour les listes
 * Utilisé dans les requêtes GET avec pagination
 * 
 * @example
 * GET /api/commandes?page=2&limit=20&sort=date&order=desc
 */
export interface PaginationParams {
  page?: number;        // Numéro de page (défaut: 1)
  limit?: number;       // Éléments par page (défaut: 20)
  sort?: string;        // Champ pour le tri
  order?: 'asc' | 'desc'; // Ordre de tri
}

/**
 * Paramètres pour les indicateurs dashboard
 * 
 * @example
 * GET /api/indicateurs?periode=semaine
 */
export interface IndicateursParams {
  periode?: 'jour' | 'semaine' | 'mois' | 'annee';  // Période d'analyse
}