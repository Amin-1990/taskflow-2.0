import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../../core/constants/design_constants.dart';
import '../../../../domain/models/commande_emballage.dart';

class PackagingOrderCard extends StatefulWidget {
  const PackagingOrderCard({
    super.key,
    required this.order,
    required this.periodQuantity,
    required this.onIncrement,
    required this.onDecrement,
    required this.onValidate,
  });

  final CommandeEmballage order;
  final int periodQuantity;
  final VoidCallback onIncrement;
  final VoidCallback onDecrement;
  final VoidCallback onValidate;

  @override
  State<PackagingOrderCard> createState() => _PackagingOrderCardState();
}

class _PackagingOrderCardState extends State<PackagingOrderCard> {
  late TextEditingController _quantityController;
  late FocusNode _focusNode;

  @override
  void initState() {
    super.initState();
    _quantityController = TextEditingController(text: widget.periodQuantity.toString());
    _focusNode = FocusNode();
  }

  @override
  void didUpdateWidget(PackagingOrderCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.periodQuantity != widget.periodQuantity) {
      _quantityController.text = widget.periodQuantity.toString();
    }
  }

  @override
  void dispose() {
    _quantityController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _handleQuantityChange(String value) {
    final newQuantity = int.tryParse(value) ?? 0;
    final diff = newQuantity - widget.periodQuantity;
    
    if (diff > 0) {
      for (int i = 0; i < diff; i++) {
        widget.onIncrement();
      }
    } else if (diff < 0) {
      for (int i = 0; i < -diff; i++) {
        widget.onDecrement();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    final statusColor =
        widget.order.isCompleted ? const Color(0xFF42D48C) : AppPalette.primary;

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF13284A) : AppPalette.surfaceLight,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isDark ? const Color(0xFF24456F) : AppPalette.borderLight),
        boxShadow: isDark ? null : [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Row 1: Status | Demandé: | Emballé:
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.18),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  widget.order.isCompleted ? 'TERMINEE' : 'EN COURS',
                  style: TextStyle(
                      color: statusColor, fontWeight: FontWeight.w700, fontSize: 11),
                ),
              ),
              Row(
                children: [
                  Text('Demandé: ',
                      style: TextStyle(color: isDark ? const Color(0xFF8CA3C6) : AppPalette.textSecondaryLight, fontSize: 11)),
                  Text('${widget.order.dailyTarget}',
                      style: TextStyle(
                          color: isDark ? AppPalette.textPrimary : AppPalette.textPrimaryLight,
                          fontSize: 12,
                          fontWeight: FontWeight.w700)),
                  const SizedBox(width: 16),
                  Text('Emballé: ',
                      style: TextStyle(color: isDark ? const Color(0xFF8CA3C6) : AppPalette.textSecondaryLight, fontSize: 11)),
                  Text('${widget.order.packedToday}',
                      style: TextStyle(
                          color: isDark ? AppPalette.textPrimary : AppPalette.textPrimaryLight,
                          fontSize: 12,
                          fontWeight: FontWeight.w700)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 10),
          // Row 2: Code cable (prominent) | Lot | Unité
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                flex: 2,
                child: Text(widget.order.articleRef,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                        color: statusColor,
                        fontSize: 15,
                        fontWeight: FontWeight.w800)),
              ),
              Expanded(
                flex: 1,
                child: Text('L:${widget.order.lotNumber}',
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        color: isDark ? const Color(0xFF94A8CA) : AppPalette.textSecondaryLight,
                        fontSize: 12,
                        fontWeight: FontWeight.w500)),
              ),
              Expanded(
                flex: 1,
                child: Text(widget.order.productionLine,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.end,
                    style: TextStyle(
                        color: isDark ? const Color(0xFF8CA3C6) : AppPalette.textSecondaryLight,
                        fontSize: 11)),
              ),
            ],
          ),
          const SizedBox(height: 10),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF0D1F3F) : const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                _StepperButton(icon: Icons.remove, onPressed: widget.onDecrement, color: statusColor),
                Expanded(
                  child: Column(
                    children: [
                      Text('Qte',
                          style: TextStyle(color: isDark ? const Color(0xFF93A8CB) : AppPalette.textSecondaryLight, fontSize: 13)),
                      // Champ de saisie de quantité modifiable
                      SizedBox(
                        width: 80,
                        child: TextField(
                          controller: _quantityController,
                          focusNode: _focusNode,
                          keyboardType: const TextInputType.numberWithOptions(signed: true),
                          inputFormatters: [
                            FilteringTextInputFormatter.allow(RegExp(r'-?\d*')),
                          ],
                          onChanged: _handleQuantityChange,
                          textAlign: TextAlign.center,
                          decoration: InputDecoration(
                            border: InputBorder.none,
                            contentPadding: EdgeInsets.zero,
                            isDense: true,
                          ),
                          style: TextStyle(
                              color: isDark ? AppPalette.textPrimary : AppPalette.textPrimaryLight,
                              fontSize: 28,
                              fontWeight: FontWeight.w800),
                        ),
                      ),
                    ],
                  ),
                ),
                _StepperButton(icon: Icons.add, onPressed: widget.onIncrement, color: statusColor),
              ],
            ),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: FilledButton(
              onPressed: widget.onValidate,
              style: FilledButton.styleFrom(
                backgroundColor: statusColor,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: const Text('Valider la quantité', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
            ),
          ),
          const SizedBox(height: 14),
          ClipRRect(
            borderRadius: BorderRadius.circular(99),
            child: LinearProgressIndicator(
              minHeight: 8,
              value: widget.order.progress,
              backgroundColor: isDark ? const Color(0xFF1E3559) : const Color(0xFFE2E8F0),
              valueColor: AlwaysStoppedAnimation<Color>(statusColor),
            ),
          ),
        ],
      ),
    );
  }
}

class _StepperButton extends StatelessWidget {
  const _StepperButton({required this.icon, required this.onPressed, required this.color});
  final IconData icon;
  final VoidCallback onPressed;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            border: Border.all(color: isDark ? const Color(0xFF24456F) : AppPalette.borderLight),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, size: 22, color: color),
        ),
      ),
    );
  }
}
