/**
 * Types pour l'authentification
 * Basés sur la documentation des endpoints /api/auth/*
 */

/**
 * Données envoyées pour la connexion
 * @example
 * POST /api/auth/login
 * {
 *   "username": "Amine",
 *   "password": "7410"
 * }
 */
export interface LoginCredentials {
  username: string;    // Nom d'utilisateur (ex: "Amine")
  password: string;    // Mot de passe (ex: "7410")
}

/**
 * Réponse du serveur après connexion réussie
 * @example
 * {
 *   "success": true,
 *   "data": {
 *     "token": "eyJhbGciOiJIUzI1NiIs...",
 *     "user": { ... },
 *     "sessionId": 42,
 *     "expiresIn": "2026-02-21T..."
 *   }
 * }
 */
export interface LoginResponse {
  token: string;           // JWT pour les requêtes authentifiées
  user: User;              // Informations de l'utilisateur connecté
  sessionId: number;       // ID de session (pour gestion multi-sessions)
  expiresIn: string;       // Date d'expiration du token
}

/**
 * Structure d'un utilisateur dans le système
 * Correspond à la réponse de GET /api/auth/profile
 */
export interface User {
  id: number;              // ID unique dans la base
  username: string;        // Nom d'utilisateur
  email: string;           // Email professionnel
  nom_prenom: string;      // Nom et prénom complets
  poste: string;           // Poste occupé (ex: "Responsable")
}

/**
 * Données pour l'inscription d'un nouvel utilisateur
 * @example
 * POST /api/auth/register
 * {
 *   "ID_Personnel": 1,
 *   "Username": "Amine",
 *   "Email": "qualite-U1@gd-tun.com",
 *   "Password": "..."
 * }
 */
export interface RegisterData {
  ID_Personnel: number;    // ID de la personne dans la table personnel
  Username: string;        // Nom d'utilisateur choisi
  Email: string;           // Email professionnel
  Password: string;        // Mot de passe (hashé côté serveur)
}

/**
 * Données pour changer le mot de passe
 * @example
 * POST /api/auth/change-password
 * {
 *   "oldPassword": "ancien123",
 *   "newPassword": "nouveau456"
 * }
 */
export interface ChangePasswordData {
  oldPassword: string;     // Ancien mot de passe (vérification)
  newPassword: string;     // Nouveau mot de passe
}

/**
 * État de l'authentification dans l'application
 * Utilisé par le hook useAuth pour suivre l'état utilisateur
 */
export interface AuthState {
  user: User | null;       // Utilisateur connecté (null si non connecté)
  isAuthenticated: boolean; // true si token valide existe
  loading: boolean;        // true pendant la vérification du token
  error: string | null;    // Message d'erreur si problème
}

/**
 * Contexte d'authentification (si on utilise Context API)
 * Contient l'état et les fonctions d'authentification
 */
export interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
}