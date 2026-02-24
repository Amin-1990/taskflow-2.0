# Amélioration N°3: Ajout Flèche de Retour vers l'Accueil

## Problème Identifié

Certaines pages de l'application mobile ne disposent pas de flèche de retour vers la page d'accueil (dashboard opérateur).

## Analyse des Pages Existantes

### Pages AVEC flèche de retour ✅

| Page | Fichier | Navigation |
|------|---------|------------|
| Settings | `settings_page.dart` | `Navigator.of(context).maybePop()` |
| Request Intervention | `request_intervention_page.dart` | `context.pop()` |
| Packaging | `packaging_page.dart` | `context.pop()` |

### Pages SANS flèche de retour ❌

| Page | Fichier | Problème |
|------|---------|----------|
| New Task | `new_task_page.dart` | Pas de `leading` dans AppBar |
| Finish Task | `finish_task_page.dart` | Pas de `leading` dans AppBar |
| Defects | `defects_page.dart` | Pas de `leading` dans AppBar |
| Tasks to Finish | `tasks_to_finish_page.dart` | Pas de `leading` dans AppBar |
| Operator Dashboard | `operator_dashboard.dart` | Page d'accueil (pas besoin) |

---

## Solution Proposée

### Ajouter un bouton de retour dans l'AppBar

Pour chaque page concernée, ajouter le widget `leading` dans l'AppBar:

```dart
AppBar(
  backgroundColor: const Color(0xFF07152F),
  leading: IconButton(
    icon: const Icon(Icons.arrow_back, color: Color(0xFFE8EEF8)),
    onPressed: () => context.go('/operator/dashboard'),
  ),
  title: const Text('TITRE PAGE'),
)
```

### Alternative: Bouton Home

Pour certaines pages, un bouton "Home" peut être plus approprié:

```dart
AppBar(
  backgroundColor: const Color(0xFF07152F),
  leading: IconButton(
    icon: const Icon(Icons.home, color: Color(0xFFE8EEF8)),
    onPressed: () => context.go('/operator/dashboard'),
  ),
  title: const Text('TITRE PAGE'),
)
```

---

## Fichiers à Modifier

| Fichier | Action |
|---------|--------|
| `lib/features/operator/task/views/new_task_page.dart` | Ajouter `leading` avec retour |
| `lib/features/operator/task/views/finish_task_page.dart` | Ajouter `leading` avec retour |
| `lib/features/operator/views/defects_page.dart` | Ajouter `leading` avec retour |
| `lib/features/operator/views/tasks_to_finish_page.dart` | Ajouter `leading` avec retour |

---

## Code de Modification

### 1. new_task_page.dart

```dart
appBar: AppBar(
  backgroundColor: const Color(0xFF07152F),
  leading: IconButton(
    icon: const Icon(Icons.arrow_back, color: Color(0xFFE8EEF8)),
    onPressed: () => context.go('/operator/dashboard'),
  ),
  title: const Text('NOUVELLE AFFECTATION',
      style: TextStyle(fontWeight: FontWeight.w700)),
  actions: [
    IconButton(onPressed: () {}, icon: const Icon(Icons.help_outline)),
  ],
),
```

### 2. finish_task_page.dart

```dart
appBar: AppBar(
  backgroundColor: const Color(0xFF07152F),
  leading: IconButton(
    icon: const Icon(Icons.arrow_back, color: Color(0xFFE8EEF8)),
    onPressed: () => context.go('/operator/dashboard'),
  ),
  title: const Text('Fin d\'Affectation'),
  actions: [
    // ... existing actions
  ],
),
```

### 3. defects_page.dart

```dart
appBar: AppBar(
  backgroundColor: const Color(0xFF13284A),
  leading: IconButton(
    icon: const Icon(Icons.arrow_back, color: Color(0xFFE8EEF8)),
    onPressed: () => context.go('/operator/dashboard'),
  ),
  title: const Text('Défauts Produit'),
),
```

### 4. tasks_to_finish_page.dart

```dart
appBar: AppBar(
  leading: IconButton(
    icon: const Icon(Icons.arrow_back, color: Color(0xFFE8EEF8)),
    onPressed: () => context.go('/operator/dashboard'),
  ),
  title: const Text('Tâches à finir'),
),
```

---

## Considérations UX

1. **Cohérence**: Toutes les pages secondaires doivent avoir un moyen de revenir à l'accueil
2. **Visibilité**: L'icône doit être visible (couleur contrastée)
3. **Accessibilité**: Le bouton doit être assez grand pour être tapé facilement
4. **Confirmation**: Pour les pages avec formulaire, demander confirmation avant de quitter si des données sont saisies

### Option: Confirmation avant de quitter (formulaires)

```dart
leading: IconButton(
  icon: const Icon(Icons.arrow_back, color: Color(0xFFE8EEF8)),
  onPressed: () {
    if (state.hasUnsavedChanges) {
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Quitter sans sauvegarder?'),
          content: const Text('Les modifications seront perdues.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Annuler'),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                context.go('/operator/dashboard');
              },
              child: const Text('Quitter'),
            ),
          ],
        ),
      );
    } else {
      context.go('/operator/dashboard');
    }
  },
),
```

---

## Priorité

**Moyenne** - Amélioration de l'expérience utilisateur et de la navigation.
