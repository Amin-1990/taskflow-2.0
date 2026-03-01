# Améliorations pour la page Admin Matrice des Permissions

## Contexte
La page `AdminMatrice.tsx` permet de gérer les permissions des utilisateurs par module et par type de permission. Actuellement, elle propose des filtres basiques et une table scrollable. Cette planification définit les améliorations pour rendre la page plus intuitive, performante et accessible.

## Objectifs Principaux
1. Améliorer la clarté et l'efficacité des filtres
2. Optimiser la lisibilité et l'interaction avec la table
3. Ajouter des fonctionnalités avancées pour la gestion des permissions
4. Améliorer les performances et l'accessibilité

## Améliorations des Filtres

### 1. Structure des Filtres
- Créer une interface de filtrage collapsible avec des sections claires
- Ajouter un bouton de réinitialisation des filtres
- Afficher un indicateur de filtres actifs (badge avec compteur)

### 2. Filtres Utilisateur
- **Filtre par rôle** : Sélection multiple de rôles
- **Filtre par statut** : Actifs/Inactifs
- **Filtre par date d'inscription** : Sélecteur de date (de/à)
- **Recherche avancée** : Recherche sur plusieurs champs avec opérateurs

### 3. Filtres de Permissions
- **Filtre par type de permission** : Checkboxes pour READ, WRITE, DELETE, etc.
- **Filtre par état** : Permissions accordées/refusées
- **Recherche dans les permissions** : Champ de recherche pour trouver rapidement une permission

### 4. Interface Utilisateur
- Remplacer les boutons de module par un composant de sélection multi options
- Afficher un résumé des filtres appliqués en haut de la table
- Désactiver les filtres inutiles (ex: module sans permissions)

## Améliorations de la Table Principale

### 1. Visibilité des Données
- Figer l'en-tête horizontalement lors du défilement vertical
- Améliorer le contraste de la colonne utilisateur figée
- Optimiser la taille des cellules et ajouter des ellipses pour le texte long

### 2. Lisibilité
- Mise en évidence des cellules cliquables avec un effet de survol
- Coloration distincte pour les permissions accordées (vert) et refusées (rouge)
- Augmenter la taille de la police et améliorer le contraste

### 3. Fonctionnalités Avancées
- **Tri des colonnes** : Trier les utilisateurs par nom, email ou nombre de permissions
- **Pagination** : Pour les grands volumes de données
- **Export** : Exporter en CSV/Excel pour analyse externe
- **Recherche instantanée** : Recherche dans les données de la table

### 4. Interactions
- **Actions globales** : Accorder/refuser une permission à tous les utilisateurs
- **Visualisation des modifications** : Mettre en évidence les cellules modifiées
- **Confirmation des actions** : Popup de confirmation pour éviter les clics accidentels

### 5. Accessibilité
- Respecter les normes WCAG pour le contraste
- Afficher les noms complets des permissions dans des tooltips
- Ajouter des raccourcis clavier pour la navigation et les modifications

## Optimisations de Performance
- Chargement lazy des données
- Virtualisation pour les tables très grandes
- Caching des filtres pour une navigation fluide

## Priorisation
1. **Essentielles** : Structure des filtres, amélioration de la lisibilité, actions globales
2. **Important** : Filtres utilisateur avancés, pagination, export
3. **Bonus** : Recherche instantanée, virtualisation, caching

## Technologies à Utiliser
- Components existants de la base de code (Tailwind CSS, Preact)
- Composants UI réutilisables (SelectSearch, FilterPanel)
- Hooks personnalisés pour la gestion des données

## Fichiers à Modifier
- `frontend/src/pages/admin/AdminMatrice.tsx` : Principale page
- `frontend/src/hooks/useAdminMatrice.ts` : Logique de données
- `frontend/src/components/common/` : Composants réutilisables
