import 'package:flutter/material.dart';

import '../../../core/services/sync_service.dart';
import 'pending_action_tile.dart';

class LogoutWarningModal extends StatelessWidget {
  const LogoutWarningModal({
    super.key,
    required this.pendingActions,
    required this.onWait,
    required this.onForceLogout,
    required this.isProcessing,
  });

  final List<PendingActionView> pendingActions;
  final VoidCallback onWait;
  final VoidCallback onForceLogout;
  final bool isProcessing;

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      child: Container(
        padding: const EdgeInsets.fromLTRB(18, 18, 18, 12),
        decoration: BoxDecoration(
          color: const Color(0xFF1D2E4D),
          borderRadius: BorderRadius.circular(22),
          border: const Border(
              top: BorderSide(color: Color(0xFFFF8E2B), width: 1.5)),
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 90,
                height: 90,
                decoration: const BoxDecoration(
                  color: Color(0xFF3A3543),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.warning_amber_rounded,
                    size: 48, color: Color(0xFFFF8E2B)),
              ),
              const SizedBox(height: 14),
              const Text(
                'Donnees non sauvegardees',
                style: TextStyle(
                    color: Color(0xFFEAF0F9),
                    fontSize: 34 / 1.4,
                    fontWeight: FontWeight.w700),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Vous avez ${pendingActions.length} tache(s) en attente de synchronisation sur cet appareil.',
                style: const TextStyle(
                    color: Color(0xFFB8C7DF), fontSize: 17, height: 1.45),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 14),
              const Text(
                'Si vous vous deconnectez maintenant, ces donnees locales seront definitivement perdues.',
                style: TextStyle(
                    color: Color(0xFFCFD9E9), fontSize: 17, height: 1.45),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFF2A426B)),
                ),
                child: Column(
                  children: [
                    for (var i = 0; i < pendingActions.take(5).length; i++) ...[
                      PendingActionTile(action: pendingActions[i]),
                      if (i < pendingActions.take(5).length - 1)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 8),
                          child: Divider(height: 1, color: Color(0xFF2A426B)),
                        ),
                    ],
                    if (pendingActions.length > 5)
                      Text(
                        '+ ${pendingActions.length - 5} autre(s) action(s)',
                        style: const TextStyle(
                            color: Color(0xFF8BA2C6),
                            fontStyle: FontStyle.italic),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: FilledButton.icon(
                  onPressed: isProcessing ? null : onWait,
                  icon: const Icon(Icons.sync),
                  label: const Text('Attendre la synchronisation',
                      style: TextStyle(fontWeight: FontWeight.w700)),
                ),
              ),
              TextButton(
                onPressed: isProcessing ? null : onForceLogout,
                child: isProcessing
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Deconnexion forcee',
                        style: TextStyle(
                            color: Color(0xFFFF7D86), fontSize: 28 / 2)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
