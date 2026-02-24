import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../data/repositories/task_repository.dart';
import '../../../../domain/models/article.dart';
import '../../../../domain/models/article_lot.dart';
import '../../../../domain/models/operateur.dart';
import '../../../../domain/models/semaine.dart';
import '../../../../domain/models/task.dart';
import '../../../../domain/models/unite.dart';
import '../../../../domain/models/workstation.dart';
import '../../../auth/controllers/auth_provider.dart';

class NewTaskState {
  static const Object _unset = Object();

  const NewTaskState({
    required this.isLoading,
    required this.isSubmitting,
    required this.semaines,
    required this.unites,
    required this.articles,
    required this.articlesLots,
    required this.postes,
    required this.operateurs,
    required this.selectedSemaine,
    required this.selectedUnite,
    required this.selectedArticle,
    required this.selectedArticleLot,
    required this.selectedPoste,
    required this.selectedOperateur,
    required this.operatorId,
    required this.error,
    required this.createdTask,
  });

  final bool isLoading;
  final bool isSubmitting;
  final List<Semaine> semaines;
  final List<Unite> unites;
  final List<Article> articles;
  final List<ArticleLot> articlesLots;
  final List<Workstation> postes;
  final List<Operateur> operateurs;
  final Semaine? selectedSemaine;
  final Unite? selectedUnite;
  final Article? selectedArticle;
  final ArticleLot? selectedArticleLot;
  final Workstation? selectedPoste;
  final Operateur? selectedOperateur;
  final String? operatorId;
  final String? error;
  final Task? createdTask;

  bool get isValid =>
      selectedSemaine != null &&
      selectedUnite != null &&
      (selectedArticle != null || selectedArticleLot != null) &&
      selectedPoste != null &&
      selectedOperateur != null;

  factory NewTaskState.initial() {
    return const NewTaskState(
      isLoading: true,
      isSubmitting: false,
      semaines: [],
      unites: [],
      articles: [],
      articlesLots: [],
      postes: [],
      operateurs: [],
      selectedSemaine: null,
      selectedUnite: null,
      selectedArticle: null,
      selectedArticleLot: null,
      selectedPoste: null,
      selectedOperateur: null,
      operatorId: null,
      error: null,
      createdTask: null,
    );
  }

  NewTaskState copyWith({
    bool? isLoading,
    bool? isSubmitting,
    List<Semaine>? semaines,
    List<Unite>? unites,
    List<Article>? articles,
    List<ArticleLot>? articlesLots,
    List<Workstation>? postes,
    List<Operateur>? operateurs,
    Object? selectedSemaine = _unset,
    Object? selectedUnite = _unset,
    Object? selectedArticle = _unset,
    Object? selectedArticleLot = _unset,
    Object? selectedPoste = _unset,
    Object? selectedOperateur = _unset,
    Object? operatorId = _unset,
    String? error,
    bool clearError = false,
    Task? createdTask,
  }) {
    return NewTaskState(
      isLoading: isLoading ?? this.isLoading,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      semaines: semaines ?? this.semaines,
      unites: unites ?? this.unites,
      articles: articles ?? this.articles,
      articlesLots: articlesLots ?? this.articlesLots,
      postes: postes ?? this.postes,
      operateurs: operateurs ?? this.operateurs,
      selectedSemaine: selectedSemaine == _unset
          ? this.selectedSemaine
          : selectedSemaine as Semaine?,
      selectedUnite:
          selectedUnite == _unset ? this.selectedUnite : selectedUnite as Unite?,
      selectedArticle: selectedArticle == _unset
          ? this.selectedArticle
          : selectedArticle as Article?,
      selectedArticleLot: selectedArticleLot == _unset
          ? this.selectedArticleLot
          : selectedArticleLot as ArticleLot?,
      selectedPoste: selectedPoste == _unset
          ? this.selectedPoste
          : selectedPoste as Workstation?,
      selectedOperateur: selectedOperateur == _unset
          ? this.selectedOperateur
          : selectedOperateur as Operateur?,
      operatorId:
          operatorId == _unset ? this.operatorId : operatorId as String?,
      error: clearError ? null : (error ?? this.error),
      createdTask: createdTask ?? this.createdTask,
    );
  }
}

final newTaskProvider =
    StateNotifierProvider.autoDispose<NewTaskNotifier, NewTaskState>((ref) {
  final repository = ref.read(taskRepositoryProvider);
  final operatorId = ref.read(authProvider).user?.id;
  final notifier = NewTaskNotifier(repository, defaultOperatorId: operatorId);
  notifier.loadInitialData();
  return notifier;
});

class NewTaskNotifier extends StateNotifier<NewTaskState> {
  NewTaskNotifier(this._repository, {String? defaultOperatorId})
      : super(NewTaskState.initial()) {
    if (defaultOperatorId != null && defaultOperatorId.isNotEmpty) {
      state = state.copyWith(operatorId: defaultOperatorId);
    }
  }

  final TaskRepository _repository;
  Timer? _debounce;

  Future<void> loadInitialData() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      // Charger les semaines avec commandes
      final semaines = await _repository.getSemainesAvecCommandes();

      // Charger les postes et opérateurs
      final postes = await _repository.getAvailableWorkstations();
      final operateurs = await _repository.getOperators();

      // Sélectionner la première semaine par défaut
      final selectedSemaine =
          semaines.isNotEmpty ? semaines.first : null;

      state = state.copyWith(
        isLoading: false,
        semaines: semaines,
        postes: postes,
        operateurs: operateurs,
        selectedSemaine: selectedSemaine,
      );

      // Si une semaine est sélectionnée, charger les unités
      if (selectedSemaine != null) {
        await _loadUnitesForSemaine(selectedSemaine.id);
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> selectSemaine(Semaine semaine) async {
    state = state.copyWith(
      selectedSemaine: semaine,
      selectedUnite: null,
      selectedArticle: null,
      unites: [],
      articles: [],
      clearError: true,
    );
    await _loadUnitesForSemaine(semaine.id);
  }

  Future<void> _loadUnitesForSemaine(String semaineId) async {
    try {
      final unites = await _repository.getUnitesProduction();
      state = state.copyWith(unites: unites);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> selectUnite(Unite unite) async {
    state = state.copyWith(
      selectedUnite: unite,
      selectedArticle: null,
      selectedArticleLot: null,
      articles: [],
      articlesLots: [],
      clearError: true,
    );

    // Charger les articles avec lots filtrés
    if (state.selectedSemaine != null) {
      await _loadArticlesLotsFiltres(state.selectedSemaine!.id, unite.nom);
    }
  }

  Future<void> _loadArticlesLotsFiltres(String semaineId, String unite) async {
    try {
      final articlesLots =
          await _repository.getArticlesLotsFiltres(semaineId, unite);
      state = state.copyWith(articlesLots: articlesLots);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  void selectArticle(Article article) {
    state = state.copyWith(selectedArticle: article, clearError: true);
  }

  void selectArticleLot(ArticleLot articleLot) {
    state = state.copyWith(
      selectedArticleLot: articleLot,
      selectedArticle: null,
      clearError: true,
    );
  }

  void selectPoste(Workstation poste) {
    state = state.copyWith(selectedPoste: poste, clearError: true);
  }

  Future<List<Operateur>> searchOperateurs(String query) async {
    _debounce?.cancel();
    final completer = Completer<List<Operateur>>();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      final trimmed = query.trim().toLowerCase();
      if (trimmed.isEmpty) {
        completer.complete(state.operateurs);
        return;
      }
      completer.complete(
        state.operateurs
            .where((item) =>
                item.fullName.toLowerCase().contains(trimmed) ||
                item.matricule.toLowerCase().contains(trimmed))
            .toList(),
      );
    });
    return completer.future;
  }

  void selectOperateur(Operateur operateur) {
    state = state.copyWith(
      selectedOperateur: operateur,
      operatorId: operateur.id,
      clearError: true,
    );
  }

  void clearSemaine() {
    state = state.copyWith(
      selectedSemaine: null,
      selectedUnite: null,
      selectedArticle: null,
      unites: [],
      articles: [],
      clearError: true,
    );
  }

  void clearUnite() {
    state = state.copyWith(
      selectedUnite: null,
      selectedArticle: null,
      articles: [],
      clearError: true,
    );
  }

  void clearArticle() {
    state = state.copyWith(
      selectedArticle: null,
      clearError: true,
    );
  }

  void clearArticleLot() {
    state = state.copyWith(
      selectedArticleLot: null,
      clearError: true,
    );
  }

  void clearPoste() {
    state = state.copyWith(
      selectedPoste: null,
      clearError: true,
    );
  }

  void clearOperateur() {
    state = state.copyWith(
      selectedOperateur: null,
      operatorId: null,
      clearError: true,
    );
  }

  Future<Task?> submit() async {
    if (!state.isValid) {
      state = state.copyWith(
          error: 'Veuillez completer tous les champs obligatoires.');
      return null;
    }

    state = state.copyWith(isSubmitting: true, clearError: true);
    try {
      final articleLot = state.selectedArticleLot;
      final article = state.selectedArticle;
      
      // Déterminer l'articleId et le commandeId
      final String articleId;
      final String? commandeId;
      
      if (articleLot != null) {
        articleId = articleLot.articleId ?? '';
        commandeId = articleLot.commandeId;
      } else if (article != null) {
        articleId = article.id;
        commandeId = null;
      } else {
        state = state.copyWith(isSubmitting: false, error: 'Article non sélectionné');
        return null;
      }

      final task = await _repository.createAffectation(
        operatorId: state.selectedOperateur!.id,
        articleId: articleId,
        workstationId: state.selectedPoste!.id,
        semaineId: state.selectedSemaine!.id,
        commandeId: commandeId,
      );
      state = state.copyWith(isSubmitting: false, createdTask: task);
      return task;
    } catch (e) {
      state = state.copyWith(isSubmitting: false, error: e.toString());
      return null;
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }
}
