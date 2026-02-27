import 'package:flutter/material.dart';
import '../constants/design_constants.dart';

class SelectionField<T> extends StatelessWidget {
  const SelectionField({
    Key? key,
    required this.label,
    required this.value,
    required this.displayText,
    required this.onTap,
    this.onScanQr,
    this.enableQrScan = false,
    this.error,
    this.onClear,
  }) : super(key: key);

  final String label;
  final T? value;
  final String Function(T) displayText;
  final VoidCallback onTap;
  final Future<void> Function()? onScanQr;
  final bool enableQrScan;
  final String? error;
  final VoidCallback? onClear;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final backgroundColor = isDark ? const Color(0xFF1A2C4B) : Colors.white;
    final borderColor = isDark ? AppPalette.primary : AppPalette.primary.withOpacity(0.5);
    final errorBorderColor = isDark ? AppPalette.error : const Color(0xFFD32F2F);
    final labelColor = isDark ? const Color(0xFF8EA2C3) : AppPalette.textSecondaryLight;
    final textColor = isDark ? AppPalette.textPrimary : AppPalette.textPrimaryLight;
    final iconColor = AppPalette.primary;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Label
        Padding(
          padding: const EdgeInsets.only(bottom: 8.0),
          child: Text(
            label,
            style: theme.textTheme.labelLarge?.copyWith(
              color: labelColor,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        // Field
        GestureDetector(
          onTap: onTap,
          child: Container(
            height: 56.0,
            decoration: BoxDecoration(
              color: backgroundColor,
              border: Border.all(
                color: error != null ? errorBorderColor : borderColor,
                width: 1.5,
              ),
              borderRadius: BorderRadius.circular(12.0),
              boxShadow: isDark
                  ? null
                  : [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.04),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
            ),
            child: Row(
              children: [
                // QR Scan Button
                if (enableQrScan)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12.0),
                    child: GestureDetector(
                      onTap: onScanQr,
                      child: Icon(
                        Icons.qr_code_2,
                        color: iconColor,
                        size: 24,
                      ),
                    ),
                  ),
                // Text Display
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12.0),
                    child: Text(
                      value != null ? displayText(value as T) : 'Sélectionner',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: value != null ? textColor : labelColor,
                        fontWeight: value != null ? FontWeight.w600 : FontWeight.normal,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
                // Clear Button (shown when value is selected)
                if (value != null && onClear != null)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12.0),
                    child: GestureDetector(
                      onTap: onClear,
                      child: Icon(
                        Icons.close,
                        color: iconColor,
                        size: 24,
                      ),
                    ),
                  ),
                // Dropdown Arrow
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12.0),
                  child: Icon(
                    Icons.expand_more,
                    color: iconColor,
                    size: 24,
                  ),
                ),
              ],
            ),
          ),
        ),
        // Error Message
        if (error != null)
          Padding(
            padding: const EdgeInsets.only(top: 4.0),
            child: Text(
              error!,
              style: theme.textTheme.labelSmall?.copyWith(
                color: errorBorderColor,
              ),
            ),
          ),
      ],
    );
  }
}
