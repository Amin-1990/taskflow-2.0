enum TaskStatus {
  pending,
  inProgress,
  completed,
  cancelled,
}

TaskStatus taskStatusFromString(String? value) {
  switch ((value ?? '').toLowerCase()) {
    case 'pending':
    case 'en_attente':
      return TaskStatus.pending;
    case 'in_progress':
    case 'en_cours':
      return TaskStatus.inProgress;
    case 'completed':
    case 'terminee':
    case 'termine':
      return TaskStatus.completed;
    case 'cancelled':
    case 'annulee':
      return TaskStatus.cancelled;
    default:
      return TaskStatus.pending;
  }
}

String taskStatusToApi(TaskStatus status) {
  switch (status) {
    case TaskStatus.pending:
      return 'PENDING';
    case TaskStatus.inProgress:
      return 'EN_COURS';
    case TaskStatus.completed:
      return 'TERMINEE';
    case TaskStatus.cancelled:
      return 'ANNULEE';
  }
}
