import 'package:flutter/material.dart';
import '../../../../core/widgets/tap_scale.dart';

class QuantityStepper extends StatelessWidget {
  const QuantityStepper({
    super.key,
    required this.value,
    required this.onChanged,
    this.min = 0,
    this.max,
    this.quickAdds = const [10, 50],
  });

  final int value;
  final int min;
  final int? max;
  final ValueChanged<int> onChanged;
  final List<int> quickAdds;

  int _clamp(int val) {
    final withMin = val < min ? min : val;
    if (max == null) return withMin;
    return withMin > max! ? max! : withMin;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFF0E1E3D),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFF2A426B)),
          ),
          child: Row(
            children: [
              TapScale(
                onTap: () => onChanged(_clamp(value - 1)),
                child: SizedBox(
                  width: 56,
                  height: 56,
                  child: Icon(Icons.remove_rounded,
                      color: Colors.white.withOpacity(0.92)),
                ),
              ),
              Expanded(
                child: Center(
                  child: Text('$value pcs',
                      style: const TextStyle(
                          color: Color(0xFFE8EEF8),
                          fontSize: 24,
                          fontWeight: FontWeight.w700)),
                ),
              ),
              TapScale(
                onTap: () => onChanged(_clamp(value + 1)),
                child: SizedBox(
                  width: 56,
                  height: 56,
                  child: Icon(Icons.add_rounded,
                      color: Colors.white.withOpacity(0.92)),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          children: quickAdds
              .map(
                (inc) => OutlinedButton(
                  onPressed: () => onChanged(_clamp(value + inc)),
                  child: Text('+$inc'),
                ),
              )
              .toList(),
        ),
      ],
    );
  }
}
