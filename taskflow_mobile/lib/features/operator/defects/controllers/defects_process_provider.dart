import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/services/timezone_service.dart';
import '../../../../data/repositories/defauts_process_repository.dart';
import '../../../../domain/models/article.dart';
import '../../../../domain/models/defaut_process.dart';
import '../../../../domain/models/operateur.dart';
import '../../../../domain/models/poste.dart';
import '../../../../domain/models/semaine.dart';
import '../../../../domain/models/type_defaut.dart';
import '../../../auth/controllers/auth_provider.dart';

class DefectsProcessState {
  const DefectsProcessState({
    required this.isLoading,
    required this.isSubmitting,
    required this.isOnline,
    required this.pendingCount,
    required this.now,
    required this.postes,
    required this.semaines,
    required this.operateurs,
    required this.typesDefaut,
    required this.selectedPoste,
    required this.selectedSemaine,
    required this.selectedArticle,
    required this.selectedOperateur,
    required this.selectedTypeDefaut,
    required this.articleSearch,
    required this.articleSuggestions,
    required this.quantite,
    required this.error,
  });

  final bool isLoading;
  final bool isSubmitting;
  final bool isOnline;
  final int pendingCount;
  final DateTime now;
  final List<Poste> postes;
  final List<Semaine> semaines;
  final List<Operateur> operateurs;
  final List<TypeDefaut> typesDefaut;
  final Poste? selectedPoste;
  final Semaine? selectedSemaine;
  final Article? selectedArticle;
  final Operateur? selectedOperateur;
  final TypeDefaut? selectedTypeDefaut;
  final String articleSearch;
  final List<Article> articleSuggestions;
  final int quantite;
  final String? error;

  bool get isValid {
    return selectedPoste != null &&
        selectedSemaine != null &&
        selectedArticle != null &&
        selectedOperateur != null &&
        selectedTypeDefaut != null &&
        quantite > 0;
  }

  factory DefectsProcessState.initial() {
    return DefectsProcessState(
      isLoading: true,
      isSubmitting: false,
      isOnline: true,
      pendingCount: 0,
      now: TimezoneService.now(),
      postes: const [],
      semaines: const [],
      operateurs: const [],
      typesDefaut: const [],
      selectedPoste: null,
      selectedSemaine: null,
      selectedArticle: null,
      selectedOperateur: null,
      selectedTypeDefaut: null,
      articleSearch: '',
      articleSuggestions: const [],
      quantite: 1,
      error: null,
    );
  }

  DefectsProcessState copyWith({
    bool? isLoading,
    bool? isSubmitting,
    bool? isOnline,
    int? pendingCount,
    DateTime? now,
    List<Poste>? postes,
    List<Semaine>? semaines,
    List<Operateur>? operateurs,
    List<TypeDefaut>? typesDefaut,
    Poste? selectedPoste,
    Semaine? selectedSemaine,
    Article? selectedArticle,
    Operateur? selectedOperateur,
    TypeDefaut? selectedTypeDefaut,
    String? articleSearch,
    List<Article>? articleSuggestions,
    int? quantite,
    String? error,
    bool clearError = false,
  }) {
    return DefectsProcessState(
      isLoading: isLoading ?? this.isLoading,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      isOnline: isOnline ?? this.isOnline,
      pendingCount: pendingCount ?? this.pendingCount,
      now: now ?? this.now,
      postes: postes ?? this.postes,
      semaines: semaines ?? this.semaines,
      operateurs: operateurs ?? this.operateurs,
      typesDefaut: typesDefaut ?? this.typesDefaut,
      selectedPoste: selectedPoste ?? this.selectedPoste,
      selectedSemaine: selectedSemaine ?? this.selectedSemaine,
      selectedArticle: selectedArticle ?? this.selectedArticle,
      selectedOperateur: selectedOperateur ?? this.selectedOperateur,
      selectedTypeDefaut: selectedTypeDefaut ?? this.selectedTypeDefaut,
      articleSearch: articleSearch ?? this.articleSearch,
      articleSuggestions: articleSuggestions ?? this.articleSuggestions,
      quantite: quantite ?? this.quantite,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

final defectsProcessProvider = StateNotifierProvider.autoDispose<
    DefectsProcessNotifier, DefectsProcessState>((ref) {
  final repository = ref.read(defautsProcessRepositoryProvider);
  final enregistreurId = ref.read(authProvider).user?.id ?? '0';
  final notifier =
      DefectsProcessNotifier(repository, enregistreurId: enregistreurId);
  notifier.initialize();
  ref.onDispose(notifier.dispose);
  return notifier;
});

class DefectsProcessNotifier extends StateNotifier<DefectsProcessState> {
  DefectsProcessNotifier(this._repository, {required this.enregistreurId})
      : super(DefectsProcessState.initial());

  final DefautsProcessRepository _repository;
  final String enregistreurId;

  Timer? _clockTimer;
  Timer? _syncTimer;
  Timer? _articleDebounce;

  Future<void> initialize() async {
    await loadLookups();
    _clockTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      state = state.copyWith(now: TimezoneService.now());
    });
    _syncTimer =
        Timer.periodic(const Duration(seconds: 25), (_) => syncPending());
  }

  Future<void> loadLookups() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final lookups = await _repository.loadLookups();
      final pending = await _repository.pendingCount();

      if (!mounted) return;

      final now = TimezoneService.now();
      final week = _findCurrentWeek(lookups.semaines, now) ??
          (lookups.semaines.isNotEmpty ? lookups.semaines.first : null);

      state = state.copyWith(
        isLoading: false,
        isOnline: true,
        pendingCount: pending,
        postes: lookups.postes,
        semaines: lookups.semaines,
        operateurs: lookups.operateurs,
        typesDefaut: lookups.typesDefaut,
        selectedSemaine: week,
      );
    } catch (e) {
      if (mounted) {
        state = state.copyWith(
            isLoading: false, isOnline: false, error: e.toString());
      }
    }
  }

  void selectPoste(Poste? poste) =>
      state = state.copyWith(selectedPoste: poste, clearError: true);
  void selectSemaine(Semaine? semaine) =>
      state = state.copyWith(selectedSemaine: semaine, clearError: true);
  void selectOperateur(Operateur? operateur) =>
      state = state.copyWith(selectedOperateur: operateur, clearError: true);
  void selectTypeDefaut(TypeDefaut? type) =>
      state = state.copyWith(selectedTypeDefaut: type, clearError: true);

  void incrementQuantite() =>
      state = state.copyWith(quantite: state.quantite + 1, clearError: true);
  void decrementQuantite() => state = state.copyWith(
      quantite: state.quantite > 1 ? state.quantite - 1 : 1, clearError: true);

  void setQuantite(int value) {
    if (value < 1) {
      state = state.copyWith(quantite: 1);
      return;
    }
    state = state.copyWith(quantite: value);
  }

  Future<List<Article>> searchArticles(String query) async {
    state = state.copyWith(articleSearch: query);

    _articleDebounce?.cancel();
    final completer = Completer<List<Article>>();
    _articleDebounce = Timer(const Duration(milliseconds: 300), () async {
      final result = await _repository.searchArticles(query);
      if (!mounted) return;
      if (!completer.isCompleted) {
        completer.complete(result);
      }
      state = state.copyWith(articleSuggestions: result);
    });

    return completer.future;
  }

  void selectArticle(Article article) {
    state = state.copyWith(
        selectedArticle: article,
        articleSearch: '${article.code} - ${article.name}',
        clearError: true);
  }

  void scanArticle(String scanValue) async {
    final result = await _repository.searchArticles(scanValue);
    if (!mounted) return;
    if (result.isNotEmpty) {
      selectArticle(result.first);
    } else {
      state = state.copyWith(error: 'Article non trouve pour ce scan.');
    }
  }

  void scanTypeDefaut(String scanValue) {
    final match = state.typesDefaut
        .where((t) =>
            t.code.toLowerCase() == scanValue.toLowerCase() ||
            t.codeAndDescription
                .toLowerCase()
                .contains(scanValue.toLowerCase()))
        .firstOrNull;

    if (match != null) {
      selectTypeDefaut(match);
    } else {
      state = state.copyWith(error: 'Code defaut non reconnu.');
    }
  }

  Future<bool> submit() async {
    if (!state.isValid) {
      state = state.copyWith(
          error: 'Veuillez renseigner tous les champs obligatoires.');
      return false;
    }

    final defaut = DefautProcess(
      posteId: state.selectedPoste!.id,
      semaineId: state.selectedSemaine!.id,
      articleId: state.selectedArticle!.id,
      articleCode: state.selectedArticle!.code,
      operateurId: state.selectedOperateur!.id,
      codeDefaut: state.selectedTypeDefaut!.code,
      descriptionDefaut: state.selectedTypeDefaut!.description,
      quantite: state.quantite,
      dateEnregistrement: TimezoneService.now(),
      enregistreurId: enregistreurId,
    );

    state = state.copyWith(
        isSubmitting: true, clearError: true, now: defaut.dateEnregistrement);
    try {
      await _repository.submitDefaut(defaut);
      final pending = await _repository.pendingCount();
      if (mounted) {
        state = state.copyWith(
            isSubmitting: false, pendingCount: pending, isOnline: true);
      }
      return true;
    } catch (e) {
      if (mounted) {
        state = state.copyWith(
            isSubmitting: false, isOnline: false, error: e.toString());
      }
      return false;
    }
  }

  Future<void> syncPending() async {
    try {
      await _repository.syncPending();
      final pending = await _repository.pendingCount();
      if (mounted) {
        state = state.copyWith(pendingCount: pending, isOnline: true);
      }
    } catch (_) {
      if (mounted) {
        state = state.copyWith(isOnline: false);
      }
    }
  }

  Semaine? _findCurrentWeek(List<Semaine> semaines, DateTime now) {
    final weekNumber = _isoWeekNumber(now);
    final year = now.year;
    final keys = [
      'W${weekNumber.toString().padLeft(2, '0')}',
      '$year-W${weekNumber.toString().padLeft(2, '0')}',
      '$weekNumber-$year'
    ];
    for (final s in semaines) {
      final label = s.label.toUpperCase();
      if (keys.any((k) => label.contains(k.toUpperCase()))) {
        return s;
      }
    }
    return null;
  }

  int _isoWeekNumber(DateTime date) {
    final thursday =
        date.add(Duration(days: 4 - (date.weekday == 7 ? 7 : date.weekday)));
    final firstJan = DateTime(thursday.year, 1, 1);
    return ((thursday.difference(firstJan).inDays) / 7).floor() + 1;
  }

  @override
  void dispose() {
    _clockTimer?.cancel();
    _syncTimer?.cancel();
    _articleDebounce?.cancel();
    super.dispose();
  }
}
