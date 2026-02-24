import 'package:flutter/material.dart';

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

  static const double borderRadius = 12.0;
  static const double borderWidth = 2.0;
  static const Color borderColor = Color(0xFF2A7BFF);
  static const Color focusedBorderColor = Color(0xFF2A7BFF);
  static const Color errorBorderColor = Color(0xFFD32F2F);
  static const List<BoxShadow> boxShadow = [
    BoxShadow(
      color: Color(0x1A000000),
      blurRadius: 8,
      offset: Offset(0, 2),
    ),
  ];
  static const Color backgroundColor = Color(0xFF1A2C4B);
  static const Color textColor = Color(0xFFE8EEF8);
  static const Color labelColor = Color(0xFF8EA2C3);
  static const Color iconColor = Color(0xFF2A7BFF);
  static const double fieldHeight = 56.0;
  static const double paddingHorizontal = 12.0;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Label
        Padding(
          padding: const EdgeInsets.only(bottom: 8.0),
          child: Text(
            label,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  color: labelColor,
                  fontWeight: FontWeight.w600,
                ),
          ),
        ),
        // Field
        GestureDetector(
          onTap: onTap,
          child: Container(
            height: fieldHeight,
            decoration: BoxDecoration(
              color: backgroundColor,
              border: Border.all(
                color: error != null ? errorBorderColor : borderColor,
                width: borderWidth,
              ),
              borderRadius: BorderRadius.circular(borderRadius),
              boxShadow: boxShadow,
            ),
            child: Row(
              children: [
                // QR Scan Button
                if (enableQrScan)
                  Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: paddingHorizontal),
                    child: GestureDetector(
                      onTap: onScanQr,
                      child: const Icon(
                        Icons.qr_code_2,
                        color: iconColor,
                        size: 24,
                      ),
                    ),
                  ),
                // Text Display
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: paddingHorizontal),
                    child: Text(
                      value != null ? displayText(value as T) : 'Sélectionner',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: value != null ? textColor : labelColor,
                          ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
                // Clear Button (shown when value is selected)
                if (value != null && onClear != null)
                  Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: paddingHorizontal),
                    child: GestureDetector(
                      onTap: onClear,
                      child: const Icon(
                        Icons.close,
                        color: iconColor,
                        size: 24,
                      ),
                    ),
                  ),
                // Dropdown Arrow
                Padding(
                  padding: const EdgeInsets.symmetric(
                      horizontal: paddingHorizontal),
                  child: const Icon(
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
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: errorBorderColor,
                  ),
            ),
          ),
      ],
    );
  }
}
